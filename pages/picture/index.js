//index.js
//获取应用实例
const app = getApp()
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        allPic: [],
        pics: []
    },
    init() {
        var chapterList = wx.getStorageSync('chapterList');
        if (!chapterList) {
            return;
        }
        var chapterList = JSON.parse(chapterList);
        this.chapterList = chapterList;
        this.originChapterList = chapterList.concat([]);
        //设置标题
        wx.setNavigationBarTitle({
            title: chapterList[0].name.replace(/\s/g, '')
        });
        this.getPics();
    },
    onLoad: function(option) {
        this.init();  
    },
    preview(e) {
        var url = e.currentTarget.dataset.pic;
        // wx.request({
        //     url: url,
        //     method: 'GET',
        //     responseType: 'arraybuffer',
        //     success: function (res) {
        //         let base64 = wx.arrayBufferToBase64(res.data);
        //         var url = 'data:image/jpg;base64,' + base64;
        //         wx.previewImage({
        //             current: url,
        //             urls: [url]
        //         })
        //     }
        // });
    },
    loadMore() {
        if (this.data.pics.length < this.data.allPic.length) {
            var pics = this.data.pics.concat(this.data.allPic.slice(this.data.pics.length, this.data.pics.length + 20));
            this.setData({
                pics: pics
            });
        } else {
            this.getPics();
        }
    },
    nextChapter() {
        this.getPics();
    },
    scroll(e) {
        var scrollTop = e.detail.scrollTop;
        var chapterList = this.originChapterList.concat([]);
        var title = chapterList[0].name;
        setTitle();
        function setTitle() {
            if (!chapterList.length) {
                //设置标题
                wx.setNavigationBarTitle({
                    title: title.replace(/\s/g, '')
                });
                return;
            }
            var chapter = chapterList.shift();
            var query = wx.createSelectorQuery();
            query.select('.chapter_' + chapter.id).boundingClientRect(function(rect) {
                //scrollTop为正数，top超出屏幕顶部时为负数，否则为正数
                if (rect && rect.top <= 0 && -rect.top <= scrollTop) {
                    title = chapter.name;
                    setTitle();
                } else {
                    //设置标题
                    wx.setNavigationBarTitle({
                        title: title.replace(/\s/g, '')
                    });
                }
            });
            query.exec();
        }
    },
    getPics() {
        if(!this.chapterList.length) {
            return;
        }
        var self = this;
        var chapter = this.chapterList.shift();
        wx.request({
            url: host + '/pic/' + chapter.id,
            success(res) {
                if (res.statusCode == 200 && res.data.length) {
                    var preTotal = self.data.allPic.length;
                    res.data[0].showId = true;
                    self.setData({
                        allPic: self.data.allPic.concat(res.data)
                    });
                    if (self.data.pics.length == preTotal) {
                        self.loadMore();
                    }
                    self.next = (self.next || 0) + res.data.length;
                    //至少加载20条
                    if (self.next < 20) {
                        self.getPics();
                    } else {
                        self.next = 0;
                    }
                }
            }
        })
    }
})