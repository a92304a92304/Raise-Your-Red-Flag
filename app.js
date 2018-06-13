var app = new Vue({
  el: '#app',
  data: {
    color: {
      left: null,
      right: null,
    },
    state: 0,          // 0: 開頭畫面,  1: 遊戲開始
    canvas: null,
    tracker: null,
    task: null,
    detectlist: {},    // 所偵測到畫面中顏色的列表
  },
  mounted: function() {
    var vm = this
    vm.Start()
  },
  methods: {
    Start: function() {
      this.state = 1
      setTimeout(this.RunTask, 1000)
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
        if (r < 80 && g < 80 && b > 160) {
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

        vm.detectlist = event.data
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
    }
  },
})
