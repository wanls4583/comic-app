//app.js
var loginUtil = require('./utils/login.js');
App({
    onLaunch: function() {
        var systemInfo = wx.getSystemInfoSync();
        this.globalData.systemInfo = systemInfo;
        this.globalData.navHeight = 48;
        if (systemInfo.platform == 'ios') {
            this.globalData.navHeight = 44;
        }
        loginUtil.checkLogin().then(()=>{
            var userInfo = JSON.parse(wx.getStorageSync('userInfo'));
            this.globalData.userInfo = userInfo;
            this.userInfoReadyCallback && this.userInfoReadyCallback(userInfo);
        }).catch((err)=>{
            console.log(err);
        });
    },
    globalData: {
        userInfo: null
    }
})