//获取应用实例
const app = getApp()

Page({
    data: {
        showDes: true
    },
    onLoad: function() {

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
    }
})