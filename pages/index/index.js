//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        categoryList: [],
        recommend: [],
        comicListByCategory: [],
        total: -1,
        nowCid: 0,
        nowCidIndex: 0,
        page: 1,
        size: 20,
        toCategory: 'category_0',
        testImg: 'http://mhfm6tel.cdndm5.com/7/6746/20190222150546_480x369_82.jpg',
        showCategoryDialog: false,
        currentBannerIndex: 0,
        banner: [],
        swiperData: [{}],
        scrollTop: [],
        swiperDataMap: []
    },
    onLoad: function() {
        wx.hideTabBar();
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
                    userInfo: res.userInfo,
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
        this.getCategory();
        this.getRecommend();
        this.getSwitch();
    },
    onPullDownRefresh() {
        this.getSwitch();
        if (this.data.nowCid) {
            this.refreshCategory();
        } else {
            this.getCategory();
            this.getRecommend();
        }
    },
    //滚动事件
    onScroll(e) {
        var cid = e.currentTarget.dataset.cid;
        //记录当前滚动距离
        this.data.swiperData[cid].scrollTop = e.detail.scrollTop;
    },
    animationFinish(e) {
        var current = e.detail.current;
        this.renderSwiper(current);
    },
    renderSwiper(current) {
        var categoryList = this.data.categoryList;
        var map = [];
        if (current == 0) {
            map.push(0);
            current + 1 < categoryList.length && map.push(current + 1);
            current + 2 < categoryList.length && map.push(current + 2);
        } else if (current == categoryList.length - 1) {
            current - 1 > -1 && map.push(current - 1);
            current - 2 > -1 && map.push(current - 2);
            map.push(current);
        } else {
            current - 1 > -1 && map.push(current - 1);
            map.push(current);
            current + 1 < categoryList.length && map.push(current + 1);
        }
        map = map.map((item) => {
            return categoryList[item].cid;
        });
        map.map((item) => {
            if (!this.data.swiperData[item]) {
                this.getComicListByCategory(item);
            }
        });
        this.setData({
            nowCid: categoryList[current].cid,
            swiperDataMap: map
        }, () => {
            var s = [];
            map.map((item) => {
                s[item] = this.data.swiperData[item].scrollTop || 0;
            });
            this.setData({
                scrollTop: s
            });
        });
        this.scrollToCategory(this.data.nowCid);
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
    bannerChang(e) {
        this.setData({
            currentBannerIndex: e.detail.current
        })
    },
    //获取所有分类
    getCategory() {
        var self = this;
        wx.request({
            url: host + '/category',
            success(res) {
                if (res.statusCode == 200 && res.data && res.data.length) {
                    self.setData({
                        categoryList: res.data
                    });
                    var cids = [];
                    for (var i = 0; i < 3 && i < res.data.length; i++) {
                        cids.push(res.data[i].cid);
                    }
                    self.setData({
                        swiperDataMap: cids
                    });
                    self.renderSwiper(0);
                }
            }
        });
    },
    //获取推荐列表
    getRecommend() {
        var self = this;
        wx.request({
            url: host + '/recommend',
            success(res) {
                wx.stopPullDownRefresh();
                if (res.statusCode == 200 && res.data && res.data.length) {
                    var allRec = [];
                    var banner = [];
                    res.data.map((item) => {
                        allRec = allRec.concat(item.list);
                    });
                    allRec.map((item) => {
                        item.lastupdatetime = util.passTime(item.lastupdatets);
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
    //显隐分类弹出框
    toggleCategory(e) {
        this.setData({
            showCategoryDialog: !this.data.showCategoryDialog
        });
    },
    //选择某个分类
    slectCategory(e) {
        var cid = e.currentTarget.dataset.category.cid;
        var index = 0;
        for (var i = 0; i < this.data.categoryList.length; i++) {
            if (this.data.categoryList[i].cid == cid) {
                index = i;
                break;
            }
        }
        this.setData({
            nowCid: this.data.categoryList[index],
            nowCidIndex: index,
            showCategoryDialog: false,
        });
        this.scrollToCategory(this.data.categoryList[index]);
    },
    scrollToCategory(cid) {
        //目录滚动到当前按钮的前两个按钮的位置
        for (var i = 0; i < this.data.categoryList.length; i++) {
            var item = this.data.categoryList[i];
            if (item.cid == cid) {
                var index = i - 2 > 0 ? i - 2 : 0;
                this.setData({
                    toCategory: 'category_' + this.data.categoryList[index].cid
                });
                break;
            }
        }
    },
    //刷新分类列表
    refreshCategory() {
        this.setData({
            ['swiperData[' + this.data.nowCid + ']']: {
                list: [],
                total: -1,
                scrollTop: 0,
                page: 1
            },
        });
        this.renderSwiper(this.data.nowCidIndex);
    },
    //加载漫画列表
    getComicListByCategory(cid) {
        var self = this;
        if (!cid) {
            return;
        }
        if (this.data.swiperData[cid]) {
            if (this.data.swiperData[cid].total > -1 && this.data.swiperData[cid].list.length >= this.data.swiperData[cid].total) {
                return;
            }
        } else {
            self.setData({
                ['swiperData[' + cid + ']']: {
                    list: [],
                    total: -1,
                    scrollTop: 0,
                    page: 1
                }
            });
        }
        wx.request({
            url: host + '/comic?cid=' + cid + '&page=' + self.data.swiperData[cid].page + '&size=' + this.data.size,
            success(res) {
                wx.stopPullDownRefresh();
                if (res.statusCode == 200 && res.data.list && res.data.list.length) {
                    res.data.list.map((item) => {
                        item.lastupdatetime = util.formatTime(item.lastupdatets, 'yyyy/MM/dd').slice(2);
                    });
                    var obj = self.data.swiperData[cid];
                    obj.list = obj.list.concat(res.data.list);
                    obj.total = res.data.size;
                    obj.page++;
                    self.setData({
                        ['swiperData[' + cid + ']']: obj
                    });
                }
            }
        })
    },
    //加载更多分类下的漫画列表
    loadMore() {
        this.getComicListByCategory(this.data.nowCid);
    },
    getSwitch() {
        var self = this;
        wx.request({
            url: host + '/switch',
            success(res) {
                if (res.statusCode == 200) {
                    app.dirMenu = res.data.switch;
                    if (res.data.switch) {
                        wx.showTabBar();
                    } else {
                        wx.hideTabBar();
                    }
                }
            }
        })
    }
})