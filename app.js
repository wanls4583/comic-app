//app.js
var loginUtil = require('./utils/login.js');
App({
    onLaunch: function() {
        var menuRect = wx.getMenuButtonBoundingClientRect();
        var systemInfo = wx.getSystemInfoSync();
        this.globalData.systemInfo = systemInfo;
        this.globalData.navHeight = menuRect.height + (menuRect.top - systemInfo.statusBarHeight) * 2;
        this.globalData.menuRect = menuRect;
        //登录检测
        loginUtil.checkLogin().then(() => {
            var userInfo = JSON.parse(wx.getStorageSync('userInfo'));
            this.globalData.userInfo = userInfo;
            this.userInfoReadyCallback && this.userInfoReadyCallback(userInfo);
        }).catch((err) => {
            console.log(err);
        });
    },
    onShow() {
        this.updateCheck();
    },
    //版本检测
    updateCheck() {
        const updateManager = wx.getUpdateManager();

        updateManager.onCheckForUpdate(function(res) {
            // 请求完新版本信息的回调
            console.log('更新检测', res.hasUpdate)
        });

        updateManager.onUpdateReady(function() {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                success(res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                    }
                }
            })
        });

        updateManager.onUpdateFailed(function() {
            // 新版本下载失败
            wx.showModal({
                title: '已经有新版本了哟~',
                content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~'
            })
        });
    },
    globalData: {
        userInfo: null
    }
})