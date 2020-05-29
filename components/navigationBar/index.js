const app = getApp();
Component({
  externalClasses: ['external-classes'],
  properties: {
    // 这里定义属性，属性值可以在组件使用时指定
    back: { //是否显示返回
      type: Boolean,
      value: true,
    },
    holder: { //导航栏是否占位
      type: Boolean,
      value: true,
    },
    background: { //导航栏背景色
      type: String,
      value: '#fa9144'
    },
    color: {
      type: String,
      value: '#fff'
    },
    title: { //导航栏标题
      type: String,
      value: ''
    },
    fixed: { //导航栏是否fixed定位
      type: Boolean,
      value: true
    },
    fontSize: {
      type: String,
      value: ''
    }
  },
  data: {
    showBack: true,
    systemInfo: app.globalData.systemInfo,
    navHeight: 0,
    menuRect: {left: 0},
    defaultFontSize: '',
    canSharedPath: ['pages/detail/index']
  },
  lifetimes: {
    attached() {
      //检测首页是否在当前页面栈中
      let pages = getCurrentPages();
      let showHomeButton = false;
      if (pages.length < 2) {
        this.setData({
          showBack: this.data.canSharedPath.indexOf(pages[pages.length - 1].route) > -1 ? true : false,
          defaultFontSize: '48rpx'
        })
      } else {
        this.setData({
          defaultFontSize: '30rpx'
        })
      }
      app.getDeviceInfo((deviceInfo)=>{
          this.setData({
            navHeight: deviceInfo.navHeight,
            menuRect: deviceInfo.menuRect
          });
      });
    }
  },
  attached: function(option) {
    //检测首页是否在当前页面栈中
    let pages = getCurrentPages();
    let showHomeButton = false;
    if (pages.length < 2) {
      this.setData({
        showBack: this.data.canSharedPath.indexOf(pages[pages.length - 1].route) > -1 ? true : false,
        defaultFontSize: '48rpx'
      })
    } else {
      this.setData({
        defaultFontSize: '30rpx'
      })
    }
    app.getDeviceInfo((deviceInfo)=>{
      this.setData({
        navHeight: deviceInfo.navHeight,
        menuRect: deviceInfo.menuRect
      });
  });
  },
  methods: {
    back() {
      let pages = getCurrentPages();
      if (pages.length == 1 && this.data.canSharedPath.indexOf(pages[pages.length - 1].route) > -1) {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      } else {
        wx.navigateBack({
          delta: 1
        });
      }
    }
  }
})