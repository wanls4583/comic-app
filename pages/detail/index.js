//获取应用实例
const app = getApp();
const request = require('../../utils/request.js');
const loginUtil = require('../../utils/login.js');
Page({
    data: {
        comic: {},
        chapterList: [],
        loadingStatus: 0,
        historyNum: 0,
        dirMenu: false,
        nowTab: 0,
        liked: false,
        logined: false
    },
    onLoad: function(option) {
        if (!option.comic) {
            return;
        }
        var self = this;
        var comic = JSON.parse(decodeURIComponent(option.comic));
        if (comic.status == 1) {
            comic.status = '完结';
        } else if (comic.status == 0) {
            comic.status = '连载中';
        }
        comic.author = comic.author.split(',');
        comic.area = '';
        comic.categorys = [];
        this.setData({
            comic: comic,
            dirMenu: app.dirMenu
        });
        this.getCategoryAndArea();
        this.getLiked();
        this.getChpater();
        //设置标题
        wx.setNavigationBarTitle({
            title: comic.title
        });
        //存储漫画打开记录
        wx.getStorage({
            key: 'comic_history',
            complete: function (res) {
                var list = [];
                if (res.data) {
                    list = JSON.parse(res.data);
                }
                for (var i = 0; i < list.length; i++) {
                    var obj = list[i];
                    //已经有记录了则更新该记录，并且移动到第一个位置
                    if (obj.comic.comicid == self.data.comic.comicid) {
                        obj.comic = self.data.comic;
                        list.splice(i, 1);
                        list.unshift(obj);
                        wx.setStorage({
                            key: 'comic_history',
                            data: JSON.stringify(list),
                        });
                        break;
                    }
                }
            }
        });
    },
    onShow() {
        var self = this;
        loginUtil.checkLogin().then(()=>{
            self.setData({
                logined: true
            });
            if(!self.liked) {
                self.getLiked();
            }
        }).catch(()=>{
            self.setData({
                logined: false
            });
        });
        //获取章节观看记录
        wx.getStorage({
            key: 'comic_history',
            success: function (res) {
                var list = JSON.parse(res.data);
                for (var i = 0; i < list.length; i++) {
                    var obj = list[i];
                    //已经有记录了则将该记录移除
                    if (obj.comic.comicid == self.data.comic.comicid) {
                        self.setData({
                            historyNum: obj.chapter.c_order
                        });
                    }
                }
            }
        })
    },
    onPullDownRefresh() {
        this.getCategoryAndArea();
        this.getChpater();
    },
    animationFinish(e) {
        var current = e.detail.current;
        this.setData({
            nowTab: current
        });
    },
    continueRead() {
        if (!this.data.historyNum) {
            return;
        }
        var obj = {}
        obj.chapterList = this.data.chapterList;
        obj.startChapterIndex = this.data.historyNum - 1;
        wx.setStorageSync('chapterList', JSON.stringify(obj));
        wx.navigateTo({
            url: '/pages/picture/index'
        });
    },
    gotoPicture(e) {
        var index = e.currentTarget.dataset.index;
        this.gotoPictureByIndex(index);
    },
    gotoLast() {
        if(this.data.chapterList.length) {
            this.gotoPictureByIndex(this.data.chapterList.length - 1);
        }
    },
    gotoPictureByIndex(index) {
        var self = this;
        var obj = {};
        obj.chapterList = this.data.chapterList;
        obj.startChapterIndex = index;
        wx.setStorageSync('chapterList', JSON.stringify(obj));
        wx.getStorage({
            key: 'comic_history',
            complete: function(res) {
                var list = [];
                if (res.data) {
                    list = JSON.parse(res.data);
                }
                for (var i = 0; i < list.length; i++) {
                    var obj = list[i];
                    //已经有记录了则将该记录移除
                    if (obj.comic.comicid == self.data.comic.comicid) {
                        list.splice(i, 1);
                        break;
                    }
                }
                //添加新纪录
                list.unshift({
                    comic: self.data.comic,
                    chapter: self.data.chapterList[index]
                });
                wx.setStorage({
                    key: 'comic_history',
                    data: JSON.stringify(list),
                });
            },
        });
        wx.navigateTo({
            url: '/pages/picture/index'
        });
    },
    toggleTab(e) {
        this.setData({
            nowTab: e.currentTarget.dataset.tab
        })
    },
    getCategoryAndArea() {
        var self = this;
        request({
            url: '/comic/category_area/' + this.data.comic.comicid,
            success(res) {
                if (res.statusCode == 200) {
                    self.setData({
                        'comic.area': res.data.area,
                        'comic.categorys': res.data.categorys
                    })
                }
            }
        })
    },
    getChpater() {
        var self = this;
        request({
            url: '/chapter/' + this.data.comic.comicid,
            success(res) {
                wx.stopPullDownRefresh();
                if (res.statusCode == 200) {
                    self.setData({
                        chapterList: res.data.sort((arg1, arg2) => {
                            return arg1.c_order - arg2.c_order;
                        }),
                        loadingStatus: 1
                    })
                } else {
                    self.setData({
                        loadingStatus: -1
                    })
                }
            }
        })
    },
    //是否被收藏
    getLiked() {
        var self = this;
        request({
            url: '/like/get?id=' + this.data.comic.id,
            success(res) {
                self.setData({
                    liked: res.data.result && res.data.result.length || false
                });
            }
        })
    },
    //添加到收藏
    like() {
        var self = this;
        if (this.changeLike) {
            return;
        }
        this.changeLike = true;
        request({
            url: '/like/add',
            method: 'post',
            data: {
                id: this.data.comic.id
            },
            success(res) {
                self.changeLike = false;
                if(res.data.status == 1) {
                    wx.showToast({
                        title: '收藏成功'
                    });
                    self.setData({
                        liked: true
                    });
                    wx.setStorageSync('likeChange', true);
                } else if(res.data.status == 403) {
                    wx.showToast({
                        title: '请先登录'
                    });
                    self.setData({
                        logined: false
                    });
                } else {
                    wx.showToast({
                        title: '添加失败，服务器错误'
                    });
                }
            }
        })
    },
    //取消收藏
    unLike() {
        var self = this;
        if(this.changeLike) {
            return;
        }
        this.changeLike = true;
        request({
            url: '/like/del',
            method: 'post',
            data: {
                id: this.data.comic.id
            },
            success(res) {
                self.changeLike = false;
                if (res.data.status == 1) {
                    wx.showToast({
                        title: '取消收藏成功'
                    });
                    self.setData({
                        liked: false
                    });
                    wx.setStorageSync('likeChange', true);
                } else if (res.data.status == 403) {
                    wx.showToast({
                        title: '请先登录'
                    });
                    self.setData({
                        logined: false
                    });
                } else {
                    wx.showToast({
                        title: '添加失败，服务器错误'
                    });
                }
            }
        })
    },
    getUserInfo: function (e) {
        console.log(e)
        app.globalData.userInfo = e.detail.userInfo;
        wx.setStorageSync('userInfo', JSON.stringify(e.detail.userInfo));
        this.setData({
            userInfo: e.detail.userInfo
        });
        wx.showLoading({
            title: '登录中',
        });
        loginUtil.login().then(() => {
            wx.hideLoading();
            this.setData({
                logined: true
            })
        }).catch(() => {
            wx.hideLoading();
            wx.showToast({
                title: '登录失败',
                icon: 'none'
            });
        });
    },
})