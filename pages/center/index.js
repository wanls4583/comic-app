//index.js
//获取应用实例
const app = getApp()
const loginUtil = require('../../utils/login.js');
Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        statusBarHeight: app.globalData.systemInfo.statusBarHeight
    },
    onLoad: function() {
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            })
        } else if (this.data.canIUse) {
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.setData({
                    userInfo: res,
                    hasUserInfo: true
                })
            }
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    })
                }
            })
        }
    },
    getUserInfo: function(e) {
        console.log(e)
        app.globalData.userInfo = e.detail.userInfo;
        wx.setStorageSync('userInfo', e.detail.userInfo);
        this.setData({
            userInfo: e.detail.userInfo,
            hasUserInfo: true
        });
        wx.showLoading({
            title: '登录中',
        });
        loginUtil.login().then(()=>{
            wx.hideLoading();
        }).catch(()=>{
            wx.hideLoading();
            wx.showToast({
                title: '登录失败',
                icon: 'none'
            });
        });
    },
    gotoFeedBack() {
        wx.navigateTo({
            url: '/pages/feedback/index'
        })
    }
})