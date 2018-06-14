var app = new Vue({
  el: '#app',
  data: {
    state: 0,          // 0: 開頭畫面,  1: 遊戲開始,  2: GAME OVER
    canvas: null,
    tracker: null,
    task: null,
    detectList: [],                       // 所偵測到畫面中顏色的列表
    score: 0,                             // 得分
    answer: { a: false, b: false },       // 預期正解
    current: { a: false, b: false },      // 玩家舉的
    q: '',                  // 題目中文字
    result: null,           // 答對與否
    qNum: 0,                // 當前第幾題
    repeatedAction: {raise: true, time: 0},           // 記錄相同動作重複次數(避免多次)
    interval: null,         // 儲存計數器編號(結束遊戲用)
    isResultHide: false,
    // ––––––可設定––––––
    color: { a: 'red', b: 'blue' },     // a和b旗分別代表之顏色(與註冊之顏色對應)
    speed: 3500,                        // 換題延遲
    isShowDebug: true,                 // 是否顯示DEBUG視窗
    maxGame: 20,                        // 遊戲總場數
    isPlayVoice: false,                  // 是否播放語音
  },

  mounted: function() {
    var vm = this
    try{ responsiveVoice.setDefaultVoice("Chinese Female") }
    catch(e){}
  },
  methods: {
    Start: function() {
      var vm = this
      vm.state = 1                 // 設定遊戲狀態
      setTimeout(vm.RunTask, 500)  // 1秒後啟用攝像頭
      // 設定計數器
      this.interval = setInterval(() => {
        vm.SetAnswer()
      }, vm.speed)
    },
    Stop: function() {
      var vm = this
      clearInterval(vm.interval)  // 停止計數器
      vm.state = 2
    },
    SetAnswer: function() {
      var newQ = this.RandomMakeQuestion()

      if(this.qNum != 0){
        this.CheckAnswer()
      }

      switch (newQ.flag) {
        case 'a':
          this.answer.a = newQ.raise
          break;
        case 'b':
          this.answer.b = newQ.raise
          break;
        case 'ab':
          this.answer.a = this.answer.b = newQ.raise
          break;
        default:
      }

      this.q = this.GetAnswerText(newQ)
      this.qNum++

      if(this.qNum > this.maxGame) {
        this.Stop()
        return true
      }

      if(this.isPlayVoice)
        responsiveVoice.speak(this.q)
    },
    GetAnswerText: function(newQ) {
      let flag, action

      switch (newQ.flag) {
        case 'a':
          flag = '紅旗'
          break;
        case 'b':
          flag = '藍旗'
          break;
        case 'ab':
          flag = this.RandomChoose(['紅旗藍旗', '藍旗紅旗', '通通', '全部'])
          break;
        default:
      }
      if(newQ.raise){
        action = this.RandomChoose(['舉起來', '升起來', '不要降', '不要放'])
      } else{
        action = this.RandomChoose(['放下來', '放下去', '不要升', '不要舉'])
      }
      return `${flag}${action}`
    },
    CheckAnswer: function() {
      var answer = this.answer
      var current = this.current
      this.result = (answer.a == current.a && answer.b == current.b)

      this.isResultHide = false
      setTimeout(() => { this.isResultHide = true }, 1000)

      if(this.result) this.score += 10
      return this.result
    },
    SetColor: function() {
      var vm = this
      // 先註冊顏色規則
      tracking.ColorTracker.registerColor("red", (r, g, b) => {
        return (r > 140 && g < 80 && b < 80)
      })
      tracking.ColorTracker.registerColor("green", (r, g, b) =>  {
        return (r < 80 && g > 140 && b < 80)
      })
      tracking.ColorTracker.registerColor("blue", (r, g, b) => {
        return (r < 80 && g < 80 && b > 140)
      })

      // 使用上面註冊的顏色。
      vm.tracker.setColors(['red', 'green', 'blue'])
    },
    RunTask: function() {
      var vm = this
      // 初始化 Tracker 和 canvas
      vm.tracker = new tracking.ColorTracker()
      vm.canvas = document.getElementById('canvas')
      vm.task = tracking.track("#video", vm.tracker, { camera: true })  // 啟動攝影機
      vm.SetColor()

      // 開始追蹤顏色
      vm.tracker.on('track', (event) => {
        var context = vm.canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)

        vm.detectList = event.data
        if (event.data.length === 0) {
          // 未偵測到物件
        } else {
          event.data.forEach((rect) => {
            context.strokeStyle = rect.color;
            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
            context.font = '14px arial';
            context.fillStyle = "#fff";
            context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
            context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
          })
        }
      })
    },
    RandomMakeQuestion: function() {
      //a =redFlag,b =blueFlag,ab =redFlag&blueFlag
      //raise: up->true down->false
      var flag = Math.random()
      var raise = Math.random()

      if(flag <= 0.33333){
        flag = 'a'
      } else if (flag > 0.3333 && flag <= 0.6666) {
        flag = 'b'
      }else {
        flag = 'ab'
      }

      if(raise<=0.5){
        raise = true
      }else {
        raise = false
      }

      if(this.repeatedAction.raise == raise){
        this.repeatedAction.time++
        if(this.repeatedAction.time > 3){
          raise = !raise
        }
      }else{
        this.repeatedAction.raise = raise
        this.repeatedAction.time = 0
      }
      return {
        flag: flag,
        raise: raise,
      }

    },
    GetCurrent: function() {          // 檢查動作
      var vm = this
      var tempA = 0
      var tempB = 0
      this.detectList.forEach((item, index, array) => {
        if (item.color === vm.color.a && (item.y + (item.height / 2)) <= 360) tempA++
        if (item.color === vm.color.b && (item.y + (item.height / 2)) <= 360) tempB++
      })
      vm.current = {a: tempA, b: tempB}
    },
    RandomChoose: function (array) {
      const n = Math.floor(Math.random() * array.length + 1) - 1
      return array[n]
    }
  },
  watch: {
    detectList: function() {
      this.GetCurrent()
    }
  }
})
