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
        renderData: [],
        swiperDataMap: [],
        scrollTop: [],
        palceholderHeight: {}
    },
    onLoad: function() {
        wx.hideTabBar();
        this.itemHeight = 175 * app.globalData.systemInfo.screenWidth / 375;
        this.maxTopHeight = 200;
        this.loading = {};
        this.getCategory();
        this.getRecommend();
        this.getSwitch();
    },
    //顶部下拉刷新
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
        var swiperData = this.data.swiperData[cid];
        this.data.swiperData[cid].scrollTop = e.detail.scrollTop;
        if (!cid) {
            return;
        }
        if (!this.deling && e.detail.scrollTop > this.maxTopHeight * this.itemHeight) {
            var key = `swiperData[${cid}].renderData`;
            var total = `swiperData[${cid}].total`;
            var delCount = Math.floor(e.detail.scrollTop / this.itemHeight) * 3 - 3 * this.maxTopHeight / 2;
            this.deling = true;
            swiperData.startIndex += delCount;
            console.log('delCount', delCount);
            this.setData({
                [key]: swiperData.renderData.slice(delCount),
                [total]: swiperData.total,
                [`scrollTop[${cid}]`]: e.detail.scrollTop - delCount / 3 * this.itemHeight
            }, () => {
                this.setData({
                    [`scrollTop[${cid}]`]: e.detail.scrollTop - delCount / 3 * this.itemHeight
                }, () => {
                    setTimeout(() => {
                        this.deling = false;
                    }, 1000);
                });
            });
        } else if (!this.deling && swiperData.startIndex > 0 && e.detail.scrollTop < this.maxTopHeight / 2 * this.itemHeight - 3) {
            var key = `swiperData[${cid}].renderData`;
            var startIndex = swiperData.startIndex - this.maxTopHeight / 2 * 3;
            startIndex = startIndex > 0 ? startIndex : 0;
            var addData = swiperData.list.slice(startIndex, swiperData.startIndex);
            swiperData.startIndex = startIndex;
            this.deling = true;
            console.log('addData', addData.length);
            if (swiperData.endIndex - startIndex > 2 * this.maxTopHeight) {
                swiperData.endIndex = 2 * this.maxTopHeight + startIndex;
            }
            this.setData({
                [key]: swiperData.list.slice(startIndex, swiperData.endIndex),
                [`scrollTop[${cid}]`]: e.detail.scrollTop + addData.length / 3 * this.itemHeight
            }, () => {
                this.setData({
                    [`scrollTop[${cid}]`]: e.detail.scrollTop + addData.length / 3 * this.itemHeight
                }, () => {
                    setTimeout(() => {
                        this.deling = false;
                    }, 1000);
                });
            });
        }
    },
    //加载更多
    onLoadMore(e) {
        var cid = e.currentTarget.dataset.cid;
        this.loadNext(cid);
    },
    //左右滑动切换完成事件
    animationFinish(e) {
        var current = e.detail.current;
        this.renderSwiper(current);
    },
    //渲染swiper-item，每次只渲染三个
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
                this.loadNext(item);
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
    //轮播图切换事件
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
        wx.showLoading({
            title: '加载中'
        });
        wx.request({
            url: host + '/recommend',
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
    //导航栏菜单滚动到指定item
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
        this.data.swiperData[this.data.nowCid] = null;
        this.renderSwiper(this.data.nowCidIndex);
    },
    //底部加载
    loadNext(cid) {
        var swiperData = this.data.swiperData[cid];
        if (swiperData && swiperData.endIndex < swiperData.list.length) {
            var addData = swiperData.list.slice(swiperData.endIndex, swiperData.endIndex + 90);
            var key = `swiperData[${cid}].renderData`;
            var total = `swiperData[${cid}].total`;
            var endIndex = `swiperData[${cid}].endIndex`;
            swiperData.endIndex += addData.length;
            this.setData({
                [key]: swiperData.renderData.concat(addData),
                [total]: swiperData.total,
                [endIndex]: swiperData.endIndex
            });
        } else if (!this.loading[cid] && (!swiperData || swiperData.total < 0 || swiperData.list.length < swiperData.total)) {
            if (!swiperData) {
                this.data.swiperData[cid] = {
                    scrollTop: 0,
                    total: -1,
                    page: 1,
                    list: [],
                    renderData: [],
                    startIndex: 0,
                    endIndex: 0
                }
                swiperData = this.data.swiperData[cid];
            }
            this.getComicListByCategory(cid).then((data) => {
                swiperData.list = swiperData.list.concat(data.list);
                swiperData.total = data.size;
                swiperData.page++;
                this.loadNext(cid);
            });
        }
    },
    //加载漫画列表
    getComicListByCategory(cid) {
        var self = this;
        this.loading[cid] = true;
        return new Promise((resolve, reject) => {
            wx.request({
                url: host + '/comic?cid=' + cid + '&page=' + self.data.swiperData[cid].page + '&size=' + this.data.size,
                success(res) {
                    wx.stopPullDownRefresh();
                    self.loading[cid] = false;
                    res.data.list.map((item) => {
                        item.lastupdatetime = util.formatTime(item.lastupdatets, 'yyyy/MM/dd').slice(2);
                    });
                    resolve(res.data);
                },
                fail(err) {
                    console.log(err);
                    self.loading[cid] = false;
                    reject(err);
                }
            });
        })
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