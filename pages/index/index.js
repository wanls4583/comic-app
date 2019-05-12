//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const request = require('../../utils/request.js');
Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        recommend: [], //推荐列表
        currentBannerIndex: 0, //当前轮播图索引号
        banner: [], //轮播图
        systemInfo: app.globalData.systemInfo,
        navHeight: app.globalData.navHeight,
        menuRect: app.globalData.menuRect,
        searchOpacity: 0,
        showScrollBtn: false,
        ifScrollToTop: false,
        stopRefresh: false,
        topHeight: app.globalData.navHeight * 1.5
    },
    onLoad: function() {
        this.itemHeight = 205 * app.globalData.systemInfo.screenWidth / 375;
        this.windowHeight = app.globalData.systemInfo.windowHeight;
        this.getSwitch();
        this.getRecommend();
    },
    //顶部下拉刷新
    onRefresh() {
        this.refreshing = true;
        this.getSwitch();
        this.getRecommend();
    },
    //滚动事件
    onScroll(e) {
        var scrollTop = e.detail.scrollTop - this.data.topHeight - app.globalData.systemInfo.statusBarHeight;
        var opacity = scrollTop / (170 + this.data.navHeight + this.data.systemInfo.statusBarHeight);
        opacity = opacity > 1 ? 1 : opacity;
        opacity = opacity < 0 ? 0 : opacity;
        this.setData({
            searchOpacity: opacity
        });
        if (scrollTop > this.data.systemInfo.screenHeight / 2) {
            !this.data.showScrollBtn && this.setData({
                showScrollBtn: true
            });
        } else if(this.data.showScrollBtn) {
            this.setData({
                showScrollBtn: false
            });
        }
    },
    //跳到搜索页
    gotoSearch() {
        wx.navigateTo({
            url: '/pages/search/index'
        });
    },
    //跳转到动漫详情页
    gotoDetail(e) {
        var comic = e.currentTarget.dataset.comic;
        wx.navigateTo({
            url: '/pages/detail/index?comic=' + encodeURIComponent(JSON.stringify(comic))
        });
    },
    //轮播图切换事件
    bannerChang(e) {
        this.setData({
            currentBannerIndex: e.detail.current
        })
    },
    scrollToTop(e) {
        this.setData({
            ifScrollToTop: true
        });
    },
    //获取推荐列表
    getRecommend() {
        var self = this;
        if(!this.refreshing) {
            wx.showLoading({
                title: '加载中',
                mask: true
            });
        }
        request({
            url: '/recommend',
            success(res) {
                wx.stopPullDownRefresh();
                wx.hideLoading();
                if(self.refreshing) {
                    self.setData({
                        stopRefresh: true
                    });
                    self.refreshing = false;
                }
                if (res.statusCode == 200 && res.data && res.data.length) {
                    var allRec = [];
                    var banner = [];
                    res.data.map((item) => {
                        allRec = allRec.concat(item.list);
                    });
                    allRec.map((item) => {
                        item.lastupdatetime = util.passTime(item.update_time);
                    });
                    self.setData({
                        recommend: res.data
                    });
                    //随机生成四个banner图
                    while (banner.length < 5 && banner.length < allRec.length) {
                        var item = allRec[Math.floor(Math.random() * allRec.length)];
                        if (banner.indexOf(item) == -1) {
                            banner.push(item);
                        }
                    }
                    self.setData({
                        banner: banner
                    });
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
    //选择某个分类
    slectCategory(e) {
        var cid = e.currentTarget.dataset.category.cid;
        wx.setStorageSync('nowCid', cid)
        wx.switchTab({
            url: '/pages/subject/index'
        })
    },
    getSwitch() {
        var self = this;
        app.canRead = true;
        return;
        request({
            url: '/switch',
            success(res) {
                if (res.statusCode == 200) {
                    app.canRead = res.data.switch;
                }
            }
        })
    }
})