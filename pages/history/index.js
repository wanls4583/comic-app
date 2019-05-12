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
        logined: true,
        page: 0,
        pageSize: 27,
        totalPage: -1,
        menuRect: app.globalData.menuRect,
        systemInfo: app.globalData.systemInfo,
        navHeight: app.globalData.navHeight,
        canRead: false,
        stopRefresh: false
    },
    onLoad() {
        var self = this;
        wx.getStorage({
            key: 'comic_history',
            success: function(res) {
                console.log(res.data);
                self.setData({
                    comicHistory: res.data
                });
            }
        });
    },
    onShow() {
        var self = this;
        app.historyPage = self;
        loginUtil.checkLogin().then(() => {
            self.setData({
                logined: true
            });
            if (self.data.totalPage < 0) {
                self.refresh();
            } else if (wx.getStorageSync('likeChange') && self.data.nowSwiperIndex == 0) {
                self.refresh();
            }
        }).catch(() => {
            wx.hideLoading();
            self.setData({
                logined: false
            });
        });
        this.setData({
            canRead: app.canRead
        });
    },
    //下拉刷新
    onRefresh() {
        this.refreshing = true;
        this.refresh();
    },
    //加载更多收藏列表
    onLoadMore() {
        if (this.data.totalPage > -1 && this.data.page >= this.data.totalPage || this.refreshing) {
            return;
        }
        this.getLikeList();
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
        if (this.data.nowSwiperIndex != 1) {
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
        });
        this.data.favoriteList = [];
        this.requestTask && this.requestTask.abort();
        this.getLikeList();
    },
    //获取收藏列表
    getLikeList() {
        if (!this.refreshing && this.data.page == 0) {
            wx.showLoading({
                title: '加载中'
            });
        }
        this.requestTask = request({
            url: '/like/list',
            data: {
                page: this.data.page + 1,
                pageSize: this.data.pageSize
            },
            success: (res) => {
                wx.removeStorageSync('likeChange');
                wx.stopPullDownRefresh();
                wx.hideLoading();
                res.data.list.map((item) => {
                    item.lastupdatetime = util.formatTime(item.update_time, 'yyyy/MM/dd').slice(2);
                });
                if (this.refreshing) {
                    this.setData({
                        favoriteList: []
                    });
                }
                if (res.data.list.length) {
                    this.setData({
                        [`favoriteList[${this.data.favoriteList.length}]`]: res.data.list,
                        page: this.data.page + 1,
                    });
                }
                this.setData({
                    totalPage: Math.ceil(res.data.total / this.data.pageSize)
                });
                if (this.refreshing) {
                    this.setData({
                        stopRefresh: true
                    });
                    this.refreshing = false;
                }
            },
            fail: (err) => {
                console.log(err);
                if (this.refreshing) {
                    this.setData({
                        stopRefresh: true
                    });
                    this.refreshing = false;
                }
            }
        })
    },
    //更改tab
    changeSwiper(e) {
        var index = e.currentTarget.dataset.index;
        this.setData({
            nowSwiperIndex: index
        });
        if (index == 0 && wx.getStorageSync('likeChange')) {
            this.refresh();
        }
    },
    //滑动
    onChangeSwiper(e) {
        var index = e.detail.current;
        this.setData({
            nowSwiperIndex: index
        });
        if (index == 0 && wx.getStorageSync('likeChange')) {
            this.refresh();
        }
    },
    getUserInfo: function(e) {
        console.log(e)
        app.globalData.userInfo = e.detail.userInfo;
        wx.setStorageSync('userInfo', e.detail.userInfo);
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