var app = new Vue({
  el: '#app',
  data: {
    state: 0,          // 0: 開頭畫面,  1: 遊戲開始,  2: GAME OVER
    canvas: null,
    tracker: null,
    task: null,
    detectList: {},                       // 所偵測到畫面中顏色的列表
    score: 0,                             // 得分
    answer: { a: false, b: false },       // 預期正解
    current: { a: false, b: false },      // 玩家舉的
    q: '',                  // 題目中文字
    result: null,           // 答對與否
    qNum: 0,                // 當前第幾題
    interval: null,         // 儲存計數器編號(結束遊戲用)
    // ––––––可設定––––––
    color: { a: 'red', b: 'blue' },     // a和b旗分別代表之顏色(與註冊之顏色對應)
    speed: 3500,                        // 換題延遲
    isShowDebug: false,                 // 是否顯示DEBUG視窗
    maxGame: 30,                        // 遊戲總場數
  },
  mounted: function() {
    var vm = this
    try{ responsiveVoice.setDefaultVoice("Chinese Female") }
    catch(e){}
  },
  methods: {
    Start: function() {
      var vm = this
      vm.state = 1  // 設定遊戲狀態
      setTimeout(this.RunTask, 1000)  // 1秒後啟用攝像頭

      // 設定計數器
      this.interval = setInterval(function () {
        vm.SetAnswer()
      }, vm.speed)
    },
    Stop: function () {
      var vm = this
      clearInterval(vm.interval)  // 停止計數器
      vm.state = 2
    },
    SetAnswer: function () {
      var rand = this.RandomMakeQuestion()

      if(this.qNum != 0){
        this.CheckAnswer()
      }

      switch (rand.flag) {
        case 'a':
          this.answer.a = rand.raise
          break;
        case 'b':
          this.answer.b = rand.raise
          break;
        case 'ab':
          this.answer.a = this.answer.b = rand.raise
          break;
        default:
      }
      this.q = this.GetAnswerText(rand)
      this.qNum++
      // responsiveVoice.speak(this.q)
      if(this.qNum > this.maxGame) this.Stop()

    },
    GetAnswerText: function (rand) {
      var flag, action

      switch (rand.flag) {
        case 'a':
          flag = '紅旗'
          break;
        case 'b':
          flag = '藍旗'
          break;
        case 'ab':
          var text = ['紅旗藍旗', '藍旗紅旗', '通通', '全部']
          var n = Math.floor(Math.random() * text.length + 1)-1
          flag = text[n]
          break;
        default:
      }
      if(rand.raise){
          var text = ['舉起來', '升起來', '不要降', '不要放', '舉高高']
          var n = Math.floor(Math.random() * text.length + 1)-1
          action = text[n]
        } else{
          var text = ['放下來', '不要升', '不要舉', '放低低']
          var n = Math.floor(Math.random() * text.length + 1)-1
          action = text[n]
        }
      return flag + action
    },
    CheckAnswer: function () {
      var answer = this.answer
      var current = this.current
      this.result = (answer.a == current.a && answer.b == current.b)
      if(this.result) this.score += 10
      return this.result
    },
    SetColor: function() {
      var vm = this
      // 先註冊顏色規則
      tracking.ColorTracker.registerColor("red", function(r, g, b) {
        if (r > 160 && g < 80 && b < 80) {
          return true;
        }
        return false;
      });
      tracking.ColorTracker.registerColor("green", function(r, g, b) {
        if (r < 80 && g > 160 && b < 80) {
          return true;
        }
        return false;
      });
      tracking.ColorTracker.registerColor("blue", function(r, g, b) {
        if (r < 80 && g < 80 && b > 130) {
          return true;
        }
        return false;
      });

      // 使用上面註冊的顏色。
      vm.tracker.setColors(['red', 'green', 'blue'])
    },
    RunTask: function () {
      var vm = this
      // 初始化 Tracker 和 canvas
      vm.tracker = new tracking.ColorTracker()
      vm.canvas = document.getElementById('canvas')
      vm.task = tracking.track("#video", vm.tracker, { camera: true })  // 啟動攝影機
      vm.SetColor()

      // 開始追蹤顏色
      vm.tracker.on('track', function(event) {
        var context = vm.canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)

        vm.detectList = event.data
        if (event.data.length === 0) {
          // 未偵測到物件
        } else {
          event.data.forEach(function(rect) {
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
    RandomMakeQuestion: function(){
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
      return {
        flag: flag,
        raise: raise,
      }

    },
    GetCurrent: function(){          // 檢查動作
      var vm = this
      var current = this.current
      var tempA = 0
      var tempB = 0
      this.detectList.forEach(function(item, index, array){
        if (item.color === vm.color.a && (item.y + (item.height / 2)) <= 360) tempA++
        if (item.color === vm.color.b && (item.y + (item.height / 2)) <= 360) tempB++
      })
      vm.current = {a: tempA, b: tempB}
    }
  },
  watch: {
    detectList: function () {
      this.GetCurrent()
    }
  }
})
