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
        scrollTop: 0
    },
    onLoad: function() {
        this.itemHeight = 180 * app.globalData.systemInfo.screenWidth / 375;
        this.windowHeight = app.globalData.systemInfo.windowHeight;
        this.getSwitch();
        this.getRecommend();
    },
    //顶部下拉刷新
    onPullDownRefresh() {
        this.getSwitch();
        this.getRecommend();
    },
    //滚动事件
    onScroll(e) {
        var scrollTop = e.detail.scrollTop;
        var opacity = scrollTop / (170 + this.data.navHeight + this.data.systemInfo.statusBarHeight);
        opacity = opacity > 1 ? 1 : opacity;
        opacity = opacity < 0 ? 0 : opacity;
        this.setData({
            searchOpacity: opacity
        });
        if(scrollTop > this.data.systemInfo.screenHeight / 2) {
            this.setData({
                showScrollBtn: true
            });
        } else {
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
            scrollTop: 0
        });
    },
    //获取推荐列表
    getRecommend() {
        var self = this;
        wx.showLoading({
            title: '加载中'
        });
        request({
            url: '/recommend',
            success(res) {
                wx.stopPullDownRefresh();
                wx.hideLoading();
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
        request({
            url: '/switch',
            success(res) {
                if (res.statusCode == 200) {
                    app.dirMenu = res.data.switch;
                }
            }
        })
    }
})