//index.js
//获取应用实例
const app = getApp()
const request = require('../../utils/request.js');
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
        showTitle: false,
        chapterList: [],
        nowChapterIndex: 1,
        scrollAnimation: false,
        nowMenu: 1,
        light: 0,
        switchChecked: true
    },
    init() {
        var obj = wx.getStorageSync('chapterList');
        var self = this;
        if (!obj) {
            return;
        }
        this.comic = obj.comic;
        this.chapterList = obj.chapterList; //章节列表
        this.nowChapterIndex = obj.startChapterIndex; //当前章节索引
        this.startChapterIndex = obj.startChapterIndex; //已请求章节的开始索引
        this.endChapterIndex = obj.startChapterIndex; //已请求章节的结束(不包含)索引
        this.allPic = []; //存储已经从网络获取到的图片链接
        this.tipScrollTop = 0 //this.data.systemInfo.screenWidth / 750 * this.data.topLoadingHeight;
        this.picTotal = 0; //图片计数
        this.maxPicTotal = 2000; //最多加载2000张图片
        //设置标题
        this.setData({
            title: this.chapterList[obj.startChapterIndex].name.replace(/\s/g, ''),
            chapterList: this.chapterList,
            nowChapterIndex: this.nowChapterIndex
        });
        this.loadChapter(this.nowChapterIndex);
        //获取设备初始亮度
        wx.getScreenBrightness({
            success: function(e) {
                self.setData({
                    light: e.value
                });
                self.originLight = e.value;
            }
        })
    },
    onLoad: function(option) {
        this.init();
    },
    onUnload() {
        clearTimeout(this.loadingTimer);
    },
    //到顶部了
    onUpper() {},
    //到底底部了
    onLolower() {
        if (!this.jumping) {
            this.loadMore();
        } else {
            setTimeout(() => {
                this.jumping = false;
            }, 500);
        }
    },
    //顶部点击加载上一章
    onTopPreChapter() {
        this.onPreChapter();
    },
    //底部菜单点击加载上一章
    onPreChapter() {
        wx.vibrateShort();
        if (this.nowChapterIndex < 1) {
            wx.showToast({
                title: '已经是第一章了',
                icon: 'none'
            });
            return;
        }
        this.loadChapter(--this.nowChapterIndex);
    },
    //底部菜单点击加载下一章
    onNextChapter() {
        wx.vibrateShort();
        if (this.nowChapterIndex >= this.chapterList.length - 1) {
            wx.showToast({
                title: '已经是最后一章了',
                icon: 'none'
            });
            return;
        }
        this.loadChapter(++this.nowChapterIndex);
    },
    //章节跳转
    sliderChange(e) {
        var chapter = e.detail.value;
        this.nowChapterIndex = chapter - 1;
        this.loadChapter(chapter - 1);
    },
    //章节跳转
    gotoChapter(e) {
        var index = e.currentTarget.dataset.index;
        this.nowChapterIndex = index;
        this.loadChapter(index);
        this.setData({
            nowMenu: 1
        });
        wx.vibrateShort();
    },
    //调整亮度
    lightChange(e) {
        var light = e.detail.value;
        wx.setScreenBrightness({
            value: light
        });
        this.setData({
            light: light,
            switchChecked: false
        })
    },
    //是否跟随系统亮度
    switchChange(e) {
        var bool = e.detail.value;
        if (bool) {
            wx.setScreenBrightness({
                value: this.originLight
            });
            this.preLight = this.data.light;
            this.setData({
                light: this.originLight
            });
        } else {
            wx.setScreenBrightness({
                value: this.preLight
            });
            this.setData({
                light: this.preLight
            });
        }
        this.setData({
            switchChecked: bool
        })
    },
    menuChange(e) {
        var nowMenu = e.currentTarget.dataset.index;
        this.setData({
            nowMenu: nowMenu
        });
        if (nowMenu == 0) {
            this.setData({
                showTitle: false,
                showBootomBtn: false
            })
        }
        wx.vibrateShort();
    },
    /**
     * 去到下一章
     */
    loadChapter(chapterIndex) {
        var pics = this.allPic[chapterIndex];
        this.setTitle(chapterIndex);
        if (pics) {
            this.picTotal = pics.length;
            this.setData({
                pics: [pics],
            }, () => {
                this.setData({
                    scrollAnimation: false
                }, () => {
                    this.setData({
                        scrollTop: this.chapterScrollTop || this.tipScrollTop
                    });
                    if (this.chapterScrollTop) {
                        this.loadMore();
                    }
                    this.chapterScrollTop = 0;
                });
                this.setTopLoadingTip();
                this.setBottomLoadingTip();
            });
        } else if (typeof pics == 'undefined') {
            var chapter = this.chapterList[chapterIndex];
            wx.showLoading({
                mask: true,
                title: '加载中'
            });
            clearTimeout(this.loadingTimer);
            this.showLoading = true;
            this.requestTask && this.requestTask.abort();
            this.getPics(chapter.id).then((res) => {
                this.allPic[chapterIndex] = res.data || [{
                    chapterid: chapter.id,
                    chapterIndex: chapterIndex
                }];
                this.loadChapter(chapterIndex);
            });
        }
        this.startChapterIndex = chapterIndex;
        this.endChapterIndex = chapterIndex;
    },
    //底部自动加载
    loadMore() {
        //避免超过小程序DOM的限制
        if (this.picTotal > this.maxPicTotal) {
            var chapter = this.chapterList[this.nowChapterIndex];
            this.getRect('.chapter_' + chapter.id).then((rect) => {
                if (rect) {
                    //该章节的滚动距离
                    this.chapterScrollTop = rect.top;
                }
                this.loadChapter(this.nowChapterIndex);
            });
            return;
        }
        if (this.endChapterIndex + 1 < this.chapterList.length && !this.laoding) {
            if (this.allPic[this.endChapterIndex + 1]) {
                this.setData({
                    [`pics[${this.data.pics.length}]`]: this.allPic[this.endChapterIndex + 1]
                });
                this.picTotal += this.allPic[this.endChapterIndex + 1].length;
                this.endChapterIndex++;
            } else {
                var chapter = this.chapterList[this.endChapterIndex + 1];
                this.getPics(chapter.id).then((res) => {
                    this.allPic[this.endChapterIndex + 1] = res.data || [{
                        chapterid: chapter.id,
                        chapterIndex: this.endChapterIndex + 1
                    }];
                    this.picTotal += this.allPic[this.endChapterIndex + 1].length;
                    this.setData({
                        [`pics[${this.data.pics.length}]`]: res.data
                    });
                    this.endChapterIndex++;
                    this.setBottomLoadingTip();
                });
            }
        }
    },
    /**
     * 加载图片请求
     * chapterId Nunber 章节id
     */
    getPics(chapterId) {
        var self = this;
        self.laoding = true;
        return new Promise((resolve, reject) => {
            self.requestTask = request({
                url: '/pic/' + chapterId,
                success(res) {
                    resolve(res);
                    self.laoding = false;
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
        if (this.endChapterIndex < this.chapterList.length - 1) {
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
        var chapterList = this.chapterList.slice(this.startChapterIndex);
        var title = '';
        var nowChapter = null;
        //直接指定章节名称
        if (typeof nowChapterIndex != 'undefined') {
            title = this.chapterList[nowChapterIndex].name.replace(/\s/g, '');
            if (this.data.title != title) {
                this.setHistory(this.nowChapterIndex);
            }
            this.setData({
                title: title,
                nowChapterIndex: this.nowChapterIndex
            });
        } else { //通过计算得出当前章节名称
            _setTitle();
        }

        function _setTitle() {
            if (!chapterList.length) {
                self.nowChapterIndex = self.endChapterIndex;
                self.setData({
                    nowChapterIndex: self.nowChapterIndex
                });
                if (title) {
                    title = title.replace(/\s/g, '');
                    if (self.data.title != title) {
                        self.setHistory(self.nowChapterIndex);
                        //设置标题
                        self.setData({
                            title: title
                        });
                    }
                }
                return;
            }
            var chapter = chapterList.shift();
            self.getRect('.chapter_' + chapter.id).then((rect) => {
                if (rect && rect.top <= 100) {
                    title = chapter.name;
                    nowChapter = chapter;
                } else if (title) {
                    title = title.replace(/\s/g, '');
                    //设置标题
                    self.setData({
                        title: title
                    });
                    for (var i = 0; i < self.chapterList.length; i++) {
                        if (self.chapterList[i].id == nowChapter.id) {
                            self.nowChapterIndex = i;
                            self.setData({
                                nowChapterIndex: self.nowChapterIndex
                            });
                            break;
                        }
                    }
                    self.setHistory(self.nowChapterIndex);
                    return;
                }
                _setTitle();
            });
        }
    },
    //滚动事件
    scroll(e) {
        //节流处理
        if (!this.setTitleTimer) {
            this.setTitleTimer = setTimeout(() => {
                this.setTitle();
                this.setTitleTimer = null;
            }, 30);
        }
        this.scrollTop = e.detail.scrollTop;
    },
    //回到顶部
    scrollToTop() {
        wx.vibrateShort();
        var scrollAnimation = false;
        if (this.scrollTop < this.data.systemInfo.screenHeight * 10) {
            scrollAnimation = true;
        } else {
            scrollAnimation = false;
        }
        this.setData({
            scrollAnimation: scrollAnimation
        }, () => {
            this.setData({
                scrollTop: this.tipScrollTop
            })
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
                if (this.data.nowMenu == 0) { //目录弹框
                    this.setData({
                        nowMenu: 1
                    });
                } else {
                    this.setData({
                        showBootomBtn: !this.data.showBootomBtn,
                        showTitle: !this.data.showTitle,
                    }, () => {
                        this.setData({
                            nowMenu: 1
                        });
                    });
                }
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
    //图片加载成功
    onImgLoad() {
        if (this.showLoading) {
            clearTimeout(this.loadingTimer);
            this.loadingTimer = setTimeout(() => {
                this.showLoading = false;
                wx.hideLoading();
            }, 500);
        }
    },
    //图片加载失败
    onImgError() {
        if (this.showLoading) {
            clearTimeout(this.loadingTimer);
            this.loadingTimer = setTimeout(() => {
                this.showLoading = false;
                wx.hideLoading();
            }, 500);
        }
    },
    //设置观看记录
    setHistory(index) {
        var self = this;
        clearTimeout(this.historyTimer);
        this.historyTimer = setTimeout(() => {
            wx.getStorage({
                key: 'comic_history',
                success: function(res) {
                    var list = res.data;
                    for (var i = 0; i < list.length; i++) {
                        var obj = list[i];
                        //已经有记录了则将该记录移除
                        if (obj.comic.comicid == self.comic.comicid) {
                            list.splice(i, 1);
                            break;
                        }
                    }
                    //添加新纪录
                    list.unshift({
                        comic: self.comic,
                        chapter: self.data.chapterList[index]
                    });
                    wx.setStorage({
                        key: 'comic_history',
                        data: list
                    });
                },
            });
        }, 1000);
    }
})