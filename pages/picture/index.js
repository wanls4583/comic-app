//index.js
//获取应用实例
const app = getApp()
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        allPic: [],
        pics: [],
        imgScale: 1, //图片缩放比例
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
        if (!this.chapterList.length) {
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
    },
    touchStartHandle(e) {
        // 单手指缩放开始，也不做任何处理 
        if (e.touches.length == 1) {
            return
        }
        var xMove = e.touches[1].clientX - e.touches[0].clientX;
        var yMove = e.touches[1].clientY - e.touches[0].clientY;
        this.distance = Math.sqrt(xMove * xMove + yMove * yMove);
    },
    touchMoveHandle(e) {
        // 单手指缩放我们不做任何操作 
        if (e.touches.length == 1) {
            return
        }
        var xMove = e.touches[1].clientX - e.touches[0].clientX;
        var yMove = e.touches[1].clientY - e.touches[0].clientY;
        var distance = Math.sqrt(xMove * xMove + yMove * yMove);
        var distanceDiff = distance - this.distance;
        var newScale = this.data.imgScale + 0.00005 * distanceDiff
        if (newScale >= 2) {
            newScale = 2;
        } else if (newScale <= 1) {
            newScale = 1;
            //小于1以后，以该距离为初始距离
            this.distance = distance;
        }
        this.setData({
            imgScale: newScale
        });
    }
})