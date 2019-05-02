//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const request = require('../../utils/request.js');
const loginUtil = require('../../utils/login.js');
Page({
    data: {
        comicHistory: [],
        favoriteList: [],
        nowSwiperIndex: 0,
        logined: false,
        page: 0,
        pageSize: 27,
        totalPage: -1,
        statusBarHeight: app.globalData.systemInfo.statusBarHeight,
        navHeight: app.globalData.navHeight,
    },
    onShow: function() {
        var self = this;
        loginUtil.checkLogin().then(() => {
            self.setData({
                logined: true
            });
            if (!self.data.favoriteList.length) {
                self.getLikeList();
            } else if(wx.getStorageSync('likeChange')) {
                self.refresh();
            }
        }).catch(() => {
            self.setData({
                logined: false
            });
        });
        wx.getStorage({
            key: 'comic_history',
            success: function(res) {
                var comicHistory = JSON.parse(res.data);
                comicHistory.map((item)=>{
                    item.comic.author = item.comic.author.join(',');
                    item.comic.lastupdatetime = util.formatTime(item.comic.update_time, 'yyyy/MM/dd').slice(2);
                });
                self.setData({
                    comicHistory: comicHistory
                });
            },
        })
    },
    //下拉刷新
    onPullDownRefresh() {
        this.refresh();
    },
    //跳转到动漫详情页
    gotoDetail(e) {
        var comic = e.currentTarget.dataset.comic;
        wx.navigateTo({
            url: '/pages/detail/index?comic=' + encodeURIComponent(JSON.stringify(comic))
        });
    },
    //清除历史记录
    clearHistory() {
        var self = this;
        if (this.data.nowSwiperIndex!=0) {
            return;
        }
        wx.showModal({
            title: '删除',
            content: '确认删除历史记录？',
            success(res) {
                if (res.confirm) {
                    wx.removeStorageSync('comic_history');
                    wx.removeStorageSync('chapter_history');
                    self.setData({
                        comicHistory: []
                    });
                }
            }
        })
    },
    //刷新收藏列表
    refresh() {
        this.setData({
            page: 0,
            totalPage: -1,
            favoriteList: []
        });
        this.getLikeList();
    },
    //获取收藏列表
    getLikeList() {
        request({
            url: '/like/list',
            data: {
                page: this.data.page + 1,
                pageSize: this.data.pageSize
            },
            success: (res)=>{
                res.data.list.map((item) => {
                    item.lastupdatetime = util.formatTime(item.update_time, 'yyyy/MM/dd').slice(2);
                });
                if(res.data.list.length) {
                    this.setData({
                        [`favoriteList[${this.data.favoriteList.length}]`]: res.data.list,
                        page: this.data.page + 1,
                    });
                }
                this.setData({
                    totalPage: Math.ceil(res.data.total / this.data.pageSize)
                });
                wx.removeStorageSync('likeChange');
                wx.stopPullDownRefresh();
            }
        })
    },
    //更改tab
    changeSwiper(e) {
        var index = e.currentTarget.dataset.index;
        this.setData({
            nowSwiperIndex: index
        });
    },
    //滑动
    onChangeSwiper(e) {
        var index = e.detail.current;
        this.setData({
            nowSwiperIndex: index
        });
    },
    getUserInfo: function (e) {
        console.log(e)
        app.globalData.userInfo = e.detail.userInfo;
        wx.setStorageSync('userInfo', JSON.stringify(e.detail.userInfo));
        wx.showLoading({
            title: '登录中',
        });
        loginUtil.login().then(() => {
            wx.hideLoading();
            this.setData({
                logined: true
            });
            this.refresh();
        }).catch(() => {
            wx.hideLoading();
            wx.showToast({
                title: '登录失败',
                icon: 'none'
            });
        });
    },
})