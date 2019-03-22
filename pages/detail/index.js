//获取应用实例
const app = getApp()

Page({
    data: {
        showDes: true,
        comic: {},
        chapterList: [],
        hasChapter: true
    },
    onLoad: function(option) {
        if(!option.comic) {
            return;
        }
        var comic = JSON.parse(option.comic);
        if(comic.status == 1) {
            comic.status = '完结';
        } else if(comic.status == 0) {
            comic.status = '连载中';
        }
        comic.author = comic.author.split(',');
        comic.area = 'heh';
        comic.categorys = [];
        this.setData({
            comic: comic
        });
        this.getCategoryAndArea();
        this.getChpater();
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
            url: 'https://lisong.hn.cn/comic/' + this.data.comic.comicid,
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
            url: 'https://lisong.hn.cn/chapter/' + this.data.comic.comicid,
            success(res) {
                if (res.statusCode == 200) {
                    self.setData({
                        chapterList: res.data,
                        hasChapter: res.data.length > 0
                    })
                } else {
                    self.setData({
                        hasChapter: false
                    })
                }
            }
        })
    }
})