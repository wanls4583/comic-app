//index.js
//获取应用实例
const app = getApp()
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        pics: [],
        imgScale: 1, //图片缩放比例
        picIndex: ''
    },
    init() {
        var objStr = wx.getStorageSync('chapterList');
        if (!objStr) {
            return;
        }
        var obj = JSON.parse(objStr);
        this.chapterList = obj.chapterList;
        this.startChapterIndex = obj.startChapterIndex; //已请求章节的开始索引
        this.endChapterIndex = obj.startChapterIndex; //已请求章节的结束(不包含)索引
        this.startPicIndex = 0; //在页面上显示的图片的开始索引
        this.endPicIndex = 0; //在页面上显示的图片的结束(不包含)索引
        this.allPic = []; //存储已经从网络获取到的图片链接
        this.canLoadTop = true; //是否可以加载上一个章节
        //设置标题
        wx.setNavigationBarTitle({
            title: this.chapterList[obj.startChapterIndex].name.replace(/\s/g, '')
        });
        this.getPics();
    },
    onLoad: function(option) {
        this.init();
    },
    //到底底部了
    onLolower() {
        this.loadMore();
    },
    //加载更多图片
    loadMore(topLoad) {
        //底部加载
        if (!topLoad) {
            if (this.allPic.length > this.endPicIndex) {
                //一次最多显示20条
                var addPic = this.allPic.slice(this.endPicIndex, this.endPicIndex + 20);
                var pics = this.data.pics.concat(addPic);
                this.endPicIndex += addPic.length;
                this.setData({
                    pics: pics
                });
            } else {
                this.getPics();
            }
            //顶部加载
        } else {
            if (this.startPicIndex > 0) {
                //一次最多显示20条
                var begin = this.startPicIndex - 20 > 0 ? this.startPicIndex - 20 : 0;
                var addPic = this.allPic.slice(begin, this.startPicIndex);
                var pics = addPic.concat(this.data.pics);
                this.startPicIndex -= addPic.length;
                this.setData({
                    pics: pics
                });
                // this.setPicIndex = 'pic_' + addPic.length;
                // setTimeout(() => {
                //     this.setData({
                //         picIndex: this.setPicIndex
                //     });
                // }, 30);
                setTimeout(() => {
                    this.canLoadTop = true;
                }, 1000);
            } else {
                this.getPics(true);
            }
        }
    },
    //滚动事件
    scroll(e) {
        var self = this;
        var scrollTop = e.detail.scrollTop;
        var startChapterIndex = this.startChapterIndex >= 0 ? this.startChapterIndex : 0;
        var chapterList = this.chapterList.slice(startChapterIndex, this.endChapterIndex);
        var title = chapterList[0].name;
        this.scrollTop = scrollTop;
        if (!this.setTitleTimer) {
            this.setTitleTimer = setTimeout(() => {
                setTitle();
                this.setTitleTimer = null;
            }, 100);
        }
        if (scrollTop == 0 && this.waiteToLoadTop) {
            this.waiteToLoadTop = false;
            this.loadMore(true);
        }

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
                if (rect && rect.top <= 0 && -rect.top <= self.scrollTop + 800) {
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
    /**
     * 加载图片请求
     * topLoad Boolean 是否加载上一章
     */
    getPics(topLoad) {
        if (this.loading) {
            return;
        }
        //防止频繁加载顶部
        if (topLoad) {
            this.canLoadTop = false;
        }
        if (!this.chapterList.length || topLoad && !this.chapterList[this.startChapterIndex - 1] || !topLoad && !this.chapterList[this.endChapterIndex]) {
            return;
        }
        var self = this;
        var chapter = null;
        if (topLoad) {
            chapter = this.chapterList[this.startChapterIndex - 1];
            this.startChapterIndex--;
        } else {
            chapter = this.chapterList[this.endChapterIndex];
            this.endChapterIndex++;
        }
        this.loading = true;
        wx.request({
            url: host + '/pic/' + chapter.id,
            success(res) {
                self.loading = false;
                if (res.statusCode == 200 && res.data.length) {
                    var preStartPicIndex = self.startPicIndex;
                    var preTotal = self.allPic.length;
                    res.data[0].showId = true;
                    if (!topLoad) {
                        self.allPic = self.allPic.concat(res.data);
                    } else {
                        self.allPic = res.data.concat(self.allPic);
                        self.startPicIndex += res.data.length;
                        self.endPicIndex += res.data.length;
                    }
                    //已经到底部了，需要立即加载图片到页面
                    if (!topLoad && (!self.endPicIndex || self.endPicIndex == preTotal)) {
                        self.loadMore();
                        //已经到顶部了，需要立即加载
                    } else if (topLoad && preStartPicIndex == 0) {
                        self.loadMore(topLoad);
                    }
                    self.next = (self.next || 0) + res.data.length;
                    //至少加载20条
                    if (self.next < 20 && !topLoad) {
                        self.getPics();
                    } else {
                        self.next = 0;
                    }
                }
            },
            error(err) {
                this.canLoadTop = true;
                self.loading = false;
                this.startChapterIndex++;
                this.endChapterIndex--;
                console.log('加载失败', err);
            }
        })
    },
    //双击缩放
    clickToScale(e) {
        var index = e.currentTarget.dataset.index
        var scale = this.data.imgScale;
        if (Date.now() - this.startTs < 300) {
            if ([1, 1.5, 2].indexOf(scale) != -1) {
                scale += 0.5;
                if (scale > 2) {
                    scale = 1;
                }
            } else {
                scale = 1;
            }
            this.setData({
                imgScale: scale,
            });
            setTimeout(() => {
                this.setData({
                    picIndex: 'pic_' + index
                });
            }, 0);
        }
        this.startTs = Date.now();
    },
    touchStartHandle(e) {
        if (e.touches.length == 1) {
            //单手双击缩放
            return
        }
        //双手拉伸缩放
        var index = e.currentTarget.dataset.index;
        var xMove = e.touches[1].clientX - e.touches[0].clientX;
        var yMove = e.touches[1].clientY - e.touches[0].clientY;
        this.distance = Math.sqrt(xMove * xMove + yMove * yMove);
    },
    touchMoveHandle(e) {
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
    },
    touchEndHandle(e) {
        //下拉松手后加载上一章
        if (this.scrollTop && this.scrollTop < -80 && this.canLoadTop) {
            //准备去加载上一章
            this.waiteToLoadTop = true;
        }
    }
})