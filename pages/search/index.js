//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const request = require('../../utils/request.js');
Page({
    data: {
        searchKey: '',
        comicList: [],
        total: -1,
        totalPage: -1,
        page: 1,
        pageSize: 27,
        showPlace: false,
        showHistory: true,
        autoFocus: false,
        history: [],
        viewArr: [],
        nowView: 0,
        viewSize: 40, //scroll-view中最多同时存在40页
        pageSize: 3 * 3 * 3, //一页的数量
        scrollTop: 0,
        overlappingPage: 5,
        systemInfo: app.globalData.systemInfo,
        navHeight: 0,
        menuRect: null,
        showScrollBtn: false,
        scrollAnimation: false,
        stopRefresh: false,
        ifScrllToTop: false
    },
    onLoad: function() {
        var history = wx.getStorageSync('search_history') || [];
        this.setData({
            autoFocus: true,
            history: history
        });
        this.itemHeight = 205 * app.globalData.systemInfo.screenWidth / 375;
        this.windowHeight = app.globalData.systemInfo.windowHeight;
    },
    onShow() {
        app.getDeviceInfo((deviceInfo)=>{
            this.setData({
                navHeight: deviceInfo.navHeight,
                menuRect: deviceInfo.menuRect
            });
        });
    },
    onShareAppMessage: function (res) {
      return {
        title: 'M画大全',
        path: '/pages/index/index'
      }
    },
    onRefresh() {
        this.data.page = 1;
        this.data.total = -1;
        this.refreshing = true;
        this.getComicList();
    },
    //滚动事件
    onScroll(e) {
        //避免频繁计算
        if (!this.scrollTimer) {
            this.scrollTimer = setTimeout(() => {
                this.scrollCompute(e);
                this.scrollTimer = null;
            }, 50);
        }

    },
    scrollCompute(e) {
        if (e.detail.scrollTop > this.data.systemInfo.screenHeight / 2) {
            !this.data.showScrollBtn && this.setData({
                showScrollBtn: true
            });
        } else if(this.data.showScrollBtn) {
            this.setData({
                showScrollBtn: false
            });
        }
        this.scrollTop = e.detail.scrollTop;
        if (this.viewRending) {
            return;
        }
        this.viewHeight = this.viewHeight || this.data.pageSize / 3 * (this.data.viewSize + this.data.overlappingPage) * this.itemHeight;
        this.nextViewScrollTop = this.nextViewScrollTop || this.data.overlappingPage * this.itemHeight * (this.data.pageSize / 3) + this.data.navHeight + this.data.systemInfo.statusBarHeight - this.windowHeight;
        this.preViewScrollTop = this.preViewScrollTop || this.itemHeight * (this.data.pageSize / 3) * this.data.viewSize + 3 * this.itemHeight;
        if (e.detail.scrollHeight + 3 * this.itemHeight >= this.viewHeight && e.detail.scrollHeight - e.detail.scrollTop <= this.windowHeight + 50 && this.data.nowView < this.data.viewArr.length - 1) {
            this.viewRending = true;
            this.setData({
                nowView: this.data.nowView + 1
            }, () => {
                this.setData({
                    scrollTop: this.nextViewScrollTop
                }, () => {
                    setTimeout(() => {
                        this.viewRending = false;
                    }, 1000);
                });
            });
        } else if (e.detail.scrollTop < 3 * this.itemHeight && this.data.nowView > 0) {
            this.viewRending = true;
            this.setData({
                nowView: this.data.nowView - 1
            }, () => {
                this.setData({
                    scrollTop: this.preViewScrollTop
                }, () => {
                    setTimeout(() => {
                        this.viewRending = false;
                    }, 1000);
                });
            });
        }
    },
    //跳转到动漫详情页
    gotoDetail(e) {
        var comic = e.currentTarget.dataset.comic;
        wx.navigateTo({
            url: '/pages/detail/index?comic=' + encodeURIComponent(JSON.stringify(comic))
        });
    },
    //选中搜索历史
    selectHistory(e) {
        var text = e.currentTarget.dataset.text;
        this.setData({
            searchKey: text,
            viewArr: [],
            comicList: [],
            total: -1,
            totalPage: -1,
            page: 1,
            showPlace: false,
            showHistory: false
        });
        wx.showLoading({
            title: '加载中',
            icon: 'none'
        });
        this.getComicList();
    },
    //清除历史记录
    clearHistory() {
        wx.showModal({
            title: '删除',
            content: '确认删除历史记录？',
            success: (res) => {
                if (res.confirm) {
                    wx.removeStorageSync('search_history');
                    this.setData({
                        history: []
                    });
                }
            }
        })
    },
    //输入内容
    searchInput(e) {
        this.setData({
            searchKey: e.detail.value
        })
    },
    //确认搜索
    searchConfirm(e) {
        this.setData({
            viewArr: [],
            searchKey: e.detail.value,
            comicList: [],
            total: -1,
            totalPage: -1,
            page: 1,
            showHistory: false,
        });
        if (this.data.searchKey && this.data.history.indexOf(this.data.searchKey) == -1) {
            this.setData({
                history: this.data.history.concat([this.data.searchKey])
            })
            wx.setStorageSync('search_history', this.data.history);
        }
        wx.showLoading({
            title: '加载中',
            icon: 'none'
        });
        this.getComicList();
    },
    //清空输入框
    clearInput() {
        this.setData({
            searchKey: '',
            showPlace: true,
            autoFocus: true
        })
    },
    //取消搜索
    searchCancel() {
        wx.navigateBack({
            delta: 1
        })
    },
    //聚焦
    searchFocus() {
        this.setData({
            showPlace: false,
            showHistory: true
        })
    },
    //失焦
    searchBlur() {
        if (!this.data.searchKey) {
            this.setData({
                showPlace: true
            });
        }
        if (this.data.comicList.length) {
            //延迟隐藏历史记录
            setTimeout(() => {
                this.setData({
                    showHistory: false
                })
            }, 100);
        }
    },
    //滚动到顶部
    scrollToTop() {
        this.viewRending = true;
        this.setData({
            ifScrllToTop: true,
            nowView: 0,
        }, () => {
            setTimeout(() => {
                this.viewRending = false;
            }, 1000);
        });
    },
    //加载更多
    loadMore() {
        if (!this.refreshing && (this.data.nowView + 1) * this.data.viewSize + this.data.overlappingPage + 1 >= this.data.comicList.length) {
            this.getComicList();
        }
    },
    //加载列表
    getComicList() {
        var self = this;
        request({
            url: '/comic?search=' + this.data.searchKey + '&page=' + this.data.page + '&size=' + this.data.pageSize,
            success(res) {
                wx.stopPullDownRefresh();
                wx.hideLoading();
                if (self.data.total <= 0) {
                    //总页数
                    var totalPage = Math.ceil(res.data.size / self.data.pageSize);
                    //视图数组
                    var viewArr = [];
                    //计算视图的个数
                    for (var i = 0, len = Math.ceil(res.data.size / self.data.pageSize / self.data.viewSize); i < len; i++) {
                        viewArr.push(i);
                    };
                    self.setData({
                        totalPage: totalPage,
                        viewArr: viewArr,
                        nowView: 0,
                        total: res.data.size,
                        comicList: []
                    });
                    if(self.refreshing) {
                        self.setData({
                            stopRefresh: true
                        });
                        self.refreshing = false;
                    }
                }
                if (res.data.list.length) {
                    self.setData({
                        page: self.data.page,
                        [`comicList[${self.data.page-1}]`]: res.data.list
                    }, () => {
                        if (!self.hasGetScrollHeight) {
                            setTimeout(() => {
                                var query = wx.createSelectorQuery()
                                query.select('.comic_scroll').boundingClientRect()
                                query.exec(function(rect) {
                                    if (rect && rect[0]) {
                                        self.windowHeight = rect[0].height;
                                    }
                                });
                                var query = wx.createSelectorQuery()
                                query.select('.item').boundingClientRect()
                                query.exec(function(rect) {
                                    if (rect && rect[0]) {
                                        self.itemHeight = rect[0].height;
                                    }
                                });
                            }, 500);
                            self.hasGetScrollHeight = true;
                        }
                    });
                    self.data.page++;
                }
            },
            fail(err) {
                console.log(err);
                if(self.refreshing) {
                    self.setData({
                        stopRefresh: true
                    });
                    self.refreshing = false;
                }
            }
        })
    },
})