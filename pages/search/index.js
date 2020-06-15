//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const request = require('../../utils/request.js');
Page({
    data: {
        searchKey: '',
        comicList: [],
        totalPage: -1,
        lastPage: 1,
        showPlace: false,
        showHistory: true,
        autoFocus: false,
        history: [],
        viewArr: [],
        pageSize: 3 * 3 * 5, //一页的数量
        scrollTop: 0,
        systemInfo: app.globalData.systemInfo,
        navHeight: 0,
        menuRect: null,
        showScrollBtn: false,
        scrollAnimation: false,
        stopRefresh: false,
        ifScrllToTop: false,
        pageArr: [],
        wrapHeight: 0,
        lastPage: 0,
        nowPage: 1
    },
    onLoad: function() {
        var history = wx.getStorageSync('search_history') || [];
        this.setData({
            autoFocus: true,
            history: history
        });
        this.itemHeight = 205 * app.globalData.systemInfo.screenWidth / 375;
        this.windowHeight = app.globalData.systemInfo.windowHeight;
        this.setData({
            wrapHeight: this.itemHeight * (this.data.pageSize / 3)
        });
        var tmp = [];
        for (var i = 1; i <= 500; i++) {
            tmp.push(i);
        }
        this.setData({
            pageArr: tmp
        });
        this.getComicList();
    },
    onShow() {
        app.getDeviceInfo((deviceInfo) => {
            this.setData({
                navHeight: deviceInfo.navHeight,
                menuRect: deviceInfo.menuRect
            });
        });
    },
    onShareAppMessage: function(res) {
        return {
            title: 'M画大全',
            path: '/pages/index/index'
        }
    },
    onRefresh() {
        this.setData({
            totalPage: -1,
            nowPage: 1,
            lastPage: 0
        })
        this.refreshing = true;
        this.getComicList();
    },
    //滚动事件
    onScroll(e) {
        //避免频繁计算
        this.scrollCompute(e);

    },
    scrollCompute(e) {
        var self = this;
        var scrollTop = e.detail.scrollTop;
        var cid = e.currentTarget.dataset.cid;
        if (scrollTop > this.data.systemInfo.screenHeight / 2) {
            !this.data.showScrollBtn && this.setData({
                showScrollBtn: true
            });
        } else if (this.data.showScrollBtn) {
            this.setData({
                showScrollBtn: false
            });
        }
        _getItemHeight().then((itemHeight) => {
            var pageHeight = (this.data.pageSize / 3) * itemHeight;
            var nowPage = Math.ceil(scrollTop / pageHeight);
            if (this.data.nowPage != nowPage) {
                this.setData({
                    [`nowPage`]: nowPage
                });
            }
        });
        //获取item的高度
        function _getItemHeight() {
            if (self.hasGetItemHeight) {
                return Promise.resolve(self.itemHeight);
            }
            return new Promise((resolve) => {
                var query = wx.createSelectorQuery()
                query.select('.category_item').boundingClientRect()
                query.exec(function(rect) {
                    if (rect && rect[0]) {
                        self.itemHeight = rect[0].height;
                        if (!self.data.wrapHeight) {
                            self.setData({
                                wrapHeight: self.itemHeight * (self.data.pageSize / 3)
                            });
                            self.hasGetItemHeight = true;
                        }
                    }
                    resolve(self.itemHeight);
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
            comicList: [],
            totalPage: -1,
            lastPage: 0,
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
            totalPage: -1,
            lastPage: 0,
            nowPage: 1,
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
        this.setData({
            ifScrllToTop: true,
            nowPage: 1,
        });
    },
    //加载更多
    loadMore() {
        if (!this.refreshing && this.data.lastPage  < this.data.totalPage) {
            this.getComicList();
        }
    },
    //加载列表
    getComicList() {
        var self = this;
        if(this.loading) {
            return;
        }
        this.loading = true;
        request({
            url: '/comic?search=' + this.data.searchKey + '&page=' + (this.data.lastPage + 1) + '&pageSize=' + this.data.pageSize,
            success(res) {
                wx.stopPullDownRefresh();
                wx.hideLoading();
                if (self.data.totalPage <= 0) {
                    //总页数
                    var totalPage = Math.ceil(res.data.size / self.data.pageSize);
                    self.setData({
                        totalPage: totalPage,
                        comicList: []
                    });
                }
                self.setData({
                    lastPage: self.data.lastPage + 1,
                    [`comicList[${self.data.lastPage}]`]: res.data.list || []
                });
                self.loading = false;
                if (self.refreshing) {
                    self.setData({
                        stopRefresh: true
                    });
                    self.refreshing = false;
                }
            },
            fail(err) {
                console.log(err);
                self.loading = false;
                if (self.refreshing) {
                    self.setData({
                        stopRefresh: true
                    });
                    self.refreshing = false;
                }
            }
        })
    },
})