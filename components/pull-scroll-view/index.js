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
                    if (this.canSetTop) {
                        this.setData({
                            scrollTop: this.properties.topHeight
                        });
                        this.canSetTop = false;
                    }
                    this.setData({
                        upText: this.properties.uploadTipText
                    });
                }, 500);
            }
        },
        topHeight: {
            type: Number,
            value: app.globalData.navHeight * 2
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
            this.canSetTop = true;
            this.properties.topHeight += this.properties.topPadding;
            this.setData({
                upText: this.properties.uploadTipText,
                scrollTop: this.properties.topHeight
            });
        }
    },
    attached: function(option) {
        this.canSetTop = true;
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
            if (!this.touching && !this.refreshing && !this.readyToRefresh && !this.gettingRect && this.canSetTop) {
                if (scrollTop < this.properties.topHeight) {
                    this.setData({
                        scrollTop: this.properties.topHeight
                    });
                    this.canSetTop = false;
                }
            }
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => {
                //滚动停止时候执行更新
                if (this.readyToRefresh) {
                    this.refresh();
                }
                this.readyToRefresh = false;
                this.canSetTop = true;
            }, 60);
        },
        touchStart(e) {
            this.touching = true;
            this.startTime = new Date().getTime();
        },
        touchEnd(e) {
            this.touching = false;
            //时间太短，不触发更新
            // if(new Date().getTime() - this.startTime < 100) {
            //     return;
            // }
            this.getRect().then((res) => {
                if (!res || this.refreshing || this.readyToRefresh) {
                    return;
                }
                if (res.scrollTop <= 0) {
                    //准备更新
                    this.readyToRefresh = true;
                } else if (res.scrollTop < this.data.topHeight && this.canSetTop) {
                    this.setData({
                        scrollTop: this.properties.topHeight
                    });
                    this.canSetTop = false;
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