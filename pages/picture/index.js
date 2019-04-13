//index.js
//获取应用实例
const app = getApp()
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        pics: [],
        imgScale: 1, //图片缩放比例
        picIndex: '',
        scrollTop: 0,
        topLoadingTip: '',
        topLoadingHeight: 100,
        bottomLoadingTip: '',
        systemInfo: app.globalData.systemInfo,
        showBootomBtn: false,
        statusBarHeight: app.globalData.systemInfo.statusBarHeight,
        navHeight: app.globalData.navHeight,
        title: '',
        showTitle: false
    },
    init() {
        console.log('systemInfo', this.data.systemInfo);
        var objStr = wx.getStorageSync('chapterList');
        if (!objStr) {
            return;
        }
        var obj = JSON.parse(objStr);
        this.chapterList = obj.chapterList;
        this.nowChapterIndex = obj.startChapterIndex;
        this.startChapterIndex = obj.startChapterIndex; //已请求章节的开始索引
        this.endChapterIndex = obj.startChapterIndex; //已请求章节的结束(不包含)索引
        this.startPicIndex = 0; //在页面上显示的图片的开始索引
        this.endPicIndex = 0; //在页面上显示的图片的结束(不包含)索引
        this.allPic = []; //存储已经从网络获取到的图片链接
        this.canLoadTop = true; //是否可以加载上一个章节
        this.tipScrollTop = this.data.systemInfo.screenWidth / 750 * this.data.topLoadingHeight;
        //设置标题
        this.setData({
            title: this.chapterList[obj.startChapterIndex].name.replace(/\s/g, '')
        });
        this.loadNextChapter(0);
    },
    onLoad: function(option) {
        this.init();
    },
    //到顶部了
    onUpper() {},
    //到底底部了
    onLolower() {
        this.loadMore();
    },
    //安卓机顶部点击加载上一章
    onTopPreChapter() {
        this.loadPreChapter(-Infinity);
    },
    //底部菜单点击加载上一章
    onPreChapter() {
        if (this.nowChapterIndex < 1) {
            wx.showToast({
                title: '已经是第一章了',
                icon: 'none'
            });
            return;
        }
        var chapter = this.chapterList[this.nowChapterIndex - 1];
        var index = this.findPicIndexByChapterId(chapter.id);
        if (index > -1) {
            this.nowChapterIndex--;
        }
        this.loadPreChapter(index);
    },
    //底部菜单点击加载下一章
    onNextChapter() {
        if (this.nowChapterIndex >= this.chapterList.length - 1) {
            wx.showToast({
                title: '已经是最后一章了',
                icon: 'none'
            });
            return;
        }
        var chapter = this.chapterList[this.nowChapterIndex + 1];
        var index = this.findPicIndexByChapterId(chapter.id);
        if (index > -1) {
            this.nowChapterIndex++;
        } else {
            index = Infinity;
        }
        this.loadNextChapter(index);
    },
    //根据章节id查询该章节图片链接的开始索引位置
    findPicIndexByChapterId(chapterid) {
        for (var i = 0; i < this.allPic.length; i++) {
            if (this.allPic[i].chapterid == chapterid) {
                return i;
            }
        }
        return -1;
    },
    /**
     * 加载或回到上一章
     * preChapterstartPicIndex Number 上一章的起始索引
     */
    loadPreChapter(preChapterstartPicIndex) {
        if (preChapterstartPicIndex >= 0) {
            var pics = this.allPic.slice(preChapterstartPicIndex);
            this.startPicIndex = preChapterstartPicIndex;
            this.setData({
                pics: pics
            }, () => {
                //防止频繁加载，画面闪动
                setTimeout(() => {
                    this.canLoadTop = true;
                }, 800);
                this.setTitle(this.nowChapterIndex);
                this.setData({
                    scrollTop: this.tipScrollTop
                });
                this.setTopLoadingTip();
            });
        } else if (this.startChapterIndex > 0) {
            var chapter = this.chapterList[this.startChapterIndex - 1];
            wx.showLoading({
                mask: true,
                title: '加载中'
            });
            this.requestTask && this.requestTask.abort();
            this.getPics(chapter.id).then((res) => {
                this.allPic = res.data.concat(this.allPic);
                this.startChapterIndex--;
                this.nowChapterIndex = this.startChapterIndex;
                this.startPicIndex += res.data.length;
                this.endPicIndex += res.data.length;
                this.loadPreChapter(0);
            });
        }
    },
    /**
     * 去到下一章
     * preChapterstartPicIndex Number 下一章的起始索引
     */
    loadNextChapter(nextChapterstartPicIndex) {
        if (nextChapterstartPicIndex < this.allPic.length) {
            var addPic = this.allPic.slice(nextChapterstartPicIndex);
            var pics = addPic;
            this.startPicIndex = nextChapterstartPicIndex;
            this.endPicIndex = this.allPic.length;
            this.setData({
                pics: pics,
            }, () => {
                this.setTitle(this.nowChapterIndex);
                this.setData({
                    scrollTop: this.tipScrollTop
                });
                this.setTopLoadingTip();
                this.setBottomLoadingTip();
            });
        } else {
            var chapter = this.chapterList[this.endChapterIndex];
            wx.showLoading({
                mask: true,
                title: '加载中'
            });
            nextChapterstartPicIndex = this.allPic.length;
            this.requestTask && this.requestTask.abort();
            this.getPics(chapter.id).then((res) => {
                this.allPic = this.allPic.concat(res.data);
                this.nowChapterIndex = this.endChapterIndex;
                this.endChapterIndex++;
                this.loadNextChapter(nextChapterstartPicIndex);
            });
        }
    },
    //底部自动加载
    loadMore() {
        if (this.endChapterIndex < this.chapterList.length && !this.laoding) {
            var chapter = this.chapterList[this.endChapterIndex];
            this.getPics(chapter.id).then((res) => {
                this.allPic = this.allPic.concat(res.data);
                this.endChapterIndex++;
                this.endPicIndex += res.data.length;
                this.setData({
                    pics: this.data.pics.concat(res.data)
                });
                this.setBottomLoadingTip();
            });
        }
    },
    /**
     * 加载图片请求
     * chapterId Nunber 章节id
     */
    getPics(chapterId) {
        var self = this;
        self.laoding = true;
        return new Promise((resolve) => {
            self.requestTask = wx.request({
                url: host + '/pic/' + chapterId,
                success(res) {
                    resolve(res);
                    self.laoding = false;
                    wx.hideLoading();
                },
                fail(err) {
                    reject(err);
                    self.laoding = false;
                    wx.hideLoading();
                }
            })
        });
    },
    //为安卓机设置顶部加载提示语
    setTopLoadingTip() {
        if (this.nowChapterIndex > 0) {
            this.setData({
                topLoadingTip: '点击加载上一章'
            });
        } else {
            this.setData({
                topLoadingTip: '已经是第一章了'
            });
        }
    },
    //设置底部加载提示语
    setBottomLoadingTip() {
        if (this.endChapterIndex < this.chapterList.length) {
            this.setData({
                bottomLoadingTip: '正在加载下一章'
            });
        } else {
            this.setData({
                bottomLoadingTip: '已经是最后一章了'
            });
        }
    },
    //设置标题栏名称
    setTitle(nowChapterIndex) {
        var self = this;
        var chapterList = this.chapterList.slice(this.startChapterIndex, this.endChapterIndex);
        var title = '';
        var nowChapter = null;
        //直接指定章节名称
        if (typeof nowChapterIndex != 'undefined') {
            setTimeout(() => {
                this.setData({
                    title: this.chapterList[nowChapterIndex].name.replace(/\s/g, '')
                });
            }, 100);
        } else { //通过计算得出当前章节名称
            _setTitle();
        }

        function _setTitle() {
            if (!chapterList.length) {
                //设置标题
                title && self.setData({
                    title: title.replace(/\s/g, '')
                });
                return;
            }
            var chapter = chapterList.shift();
            self.getRect('.chapter_' + chapter.id).then((rect) => {
                if (rect && rect.top <= 100) {
                    title = chapter.name;
                    nowChapter = chapter;
                } else if (title) {
                    //设置标题
                    self.setData({
                        title: title.replace(/\s/g, '')
                    });
                    for (var i = 0; i < self.chapterList.length; i++) {
                        if (self.chapterList[i].id == nowChapter.id) {
                            self.nowChapterIndex = i;
                            break;
                        }
                    }
                    return;
                }
                _setTitle();
            });
        }
    },
    //滚动事件
    scroll(e) {
        var self = this;
        var chapterList = this.chapterList.slice(this.startChapterIndex, this.endChapterIndex);
        var title = chapterList[0].name;
        //节流处理
        if (!this.setTitleTimer) {
            this.setTitleTimer = setTimeout(() => {
                this.setTitle();
                this.setTitleTimer = null;
            }, 30);
        }
    },
    //回到顶部
    scrollToTop() {
        this.setData({
            scrollTop: this.tipScrollTop
        });
    },
    //双击缩放
    clickToScale(e) {
        var index = e.currentTarget.dataset.index
        var scale = this.data.imgScale;
        if (Date.now() - this.startTs < 250) {
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
            clearTimeout(this.tapTimer);
        } else {
            this.tapTimer = setTimeout(() => {
                this.setData({
                    showBootomBtn: !this.data.showBootomBtn,
                    showTitle: !this.data.showTitle
                });
                this.startTs = 0;
            }, 300);
        }
        this.startTs = Date.now();
    },
    touchStartHandle(e) {
        if (e.touches.length == 1) {
            this.startY = e.touches[0].clientY;
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
            imgScale: newScale,
        });
    },
    touchEndHandle(e) {},
    //获取元素距离边框的位置
    getRect(selector) {
        return new Promise((reslove, reject) => {
            var query = wx.createSelectorQuery();
            query.select(selector).boundingClientRect(function(rect) {
                reslove(rect);
            });
            query.exec();
        });
    },
    back() { 
        wx.navigateBack({
            delta: 1
        });
    }
})