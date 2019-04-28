const host = require('../config/index.js').httpHost;

function request(obj) {
    var header = obj.header || {};
    header.cookie = wx.getStorageSync('cookie');
    if (obj.method && obj.method.toLocaleUpperCase() == 'POST') {
        header['content-type'] = header['content-type'] || 'application/x-www-form-urlencoded'
    }
    return wx.request({
        url: host + obj.url,
        method: obj.method || 'get',
        header: header,
        data: obj.data,
        success: (res) => {
            var cookie = res.header["Set-Cookie"];
            if (cookie != null) {
                wx.setStorageSync("cookie", res.header["Set-Cookie"]);
            }
            if(res.data.status == 403) {
                wx.showToast({
                    title: '登录已过期，请重新登录',
                    icon: 'none'
                });
            }
            obj.success && obj.success(res);
        },
        fail: (err) => {
            obj.fail && obj.fail(err);
        },
        complete: (res) => {
            if (res.statusCode == 404 || res.statusCode == 403) {
                obj.fail && obj.fail(res);
            }
            obj.complete && obj.complete(res);
        }
    });
}

module.exports = request;