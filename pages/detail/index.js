//获取应用实例
const app = getApp()
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        showDes: true,
        comic: {},
        chapterList: [],
        loadingStatus: 0,
        historyNum: 0
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
            comic: comic
        });
        this.getCategoryAndArea();
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
    continueRead() {
        if (!this.data.historyNum) {
            return;
        }
        var chapterList = this.data.chapterList.slice(this.data.historyNum - 1);
        wx.setStorageSync('chapterList', JSON.stringify(chapterList));
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
        var chapterList = this.data.chapterList.slice(index);
        wx.setStorageSync('chapterList', JSON.stringify(chapterList));
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
        if (e.currentTarget.dataset.tab == 1) {
            this.setData({
                showDes: true
            });
        } else {
            this.setData({
                showDes: false
            });
        }
    },
    getCategoryAndArea() {
        var self = this;
        wx.request({
            url: host + '/comic/category_area/' + this.data.comic.comicid,
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
        wx.request({
            url: host + '/chapter/' + this.data.comic.comicid,
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
    }
})