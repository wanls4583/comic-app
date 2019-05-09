const app = getApp();
Component({
    externalClasses: ['external-classes'],
    properties: {
        scrollToTop: {
            type: Boolean,
            value: false,
            observer: function(newVal, oldVal) {
                //使下次能触发observer
                this.properties.scrollToTop = false;
                this.getRect().then((res) => {
                    var animation = true;
                    //滚动距离过大时不再使用过度动画
                    if (res.scrollTop > app.globalData.systemInfo.screenHeight * 10) {
                        animation = false;
                    }
                    this.setData({
                        animation: animation
                    }, () => {
                        //滚动到顶部
                        this.setData({
                            scrollTop: this.properties.topHeight + newVal
                        }, () => {
                            this.setData({
                                animation: true
                            });
                        });
                    });
                });

            }
        },
        stopRefresh: {
            type: Boolean,
            value: false,
            observer: function(newVal, oldVal) {
                //使下次能再触发observer
                this.properties.stopRefresh = false;
                clearTimeout(this.stopTimer);
                //防止频繁刷新，导致画面闪烁
                this.stopTimer = setTimeout(() => {
                    this.refreshing = false;
                    this.setData({
                        scrollTop: this.data.scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                    });
                    this.setData({
                        upText: this.properties.uploadTipText
                    });
                }, 500);
            }
        },
        topHeight: {
            type: Number,
            value: app.globalData.navHeight * 1.5
        },
        topPadding: {
            type: Number,
            value: 0
        },
        uploadTipText: {
            type: String,
            value: '松手刷新'
        },
        uploadingText: {
            type: String,
            value: '刷新中'
        },
    },
    data: {
        systemInfo: app.globalData.systemInfo,
        statusBarHeight: app.globalData.systemInfo.statusBarHeight,
        navHeight: app.globalData.navHeight,
        scrollTop: 0,
        upText: '',
        animation: true
    },
    lifetimes: {
        attached() {
            this.properties.topHeight += this.properties.topPadding;
            this.setData({
                upText: this.properties.uploadTipText,
                scrollTop: this.properties.topHeight
            });
        }
    },
    attached: function(option) {
        this.properties.topHeight += this.properties.topPadding;
        this.setData({
            upText: this.properties.uploadTipText,
            scrollTop: this.properties.topHeight
        });
    },
    methods: {
        onScroll(e) {
            var scrollTop = e.detail.scrollTop;
            this.triggerEvent('scroll', e.detail);
            if (!this.touching && !this.refreshing && !this.readyToRefresh && !this.gettingRect) {
                if (scrollTop < this.properties.topHeight) {
                    this.setData({
                        scrollTop: this.data.scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                    });
                }
            }
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => {
                //滚动停止时候执行更新
                if (this.readyToRefresh) {
                    this.refresh();
                }
                this.readyToRefresh = false;
            }, 500);
        },
        touchStart(e) {
            this.touching = true;
            this.startTime = new Date().getTime();
        },
        touchEnd(e) {
            this.touching = false;
            this.endTime = new Date().getTime();
            this.getRect().then((res) => {
                if (!res || this.refreshing || this.readyToRefresh) {
                    return;
                }
                //时间太短，不触发更新
                if (res.scrollTop <= 0 && !(app.globalData.systemInfo.platform == 'android' && this.endTime - this.startTime < 300)) {
                    //准备更新
                    this.readyToRefresh = true;
                    //滚动停止时再刷新
                    this.scrollTimer = setTimeout(() => {
                        this.refresh();
                        this.readyToRefresh = false;
                    }, 100);
                } else if (res.scrollTop < this.data.topHeight) {
                    this.setData({
                        scrollTop: this.data.scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                    });
                }
            });
        },
        refresh() {
            this.refreshing = true;
            this.setData({
                upText: this.properties.uploadingText,
            }, () => {
                this.triggerEvent('refresh');
            });
        },
        getRect() {
            clearTimeout(this.rectTimer);
            this.gettingRect = true;
            return new Promise((reslove, reject) => {
                var query = wx.createSelectorQuery().in(this);
                query.select('.scroll_view').fields({
                    size: true,
                    scrollOffset: true,
                }, (res) => {
                    reslove(res);
                    this.rectTimer = setTimeout(() => {
                        this.gettingRect = false;
                    }, 10);
                });
                query.exec();
            });
        }
    }
})