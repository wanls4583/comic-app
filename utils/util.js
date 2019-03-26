function formatTime(date, format = 'yyyy-MM-dd hh:mm:ss:SSS') {
    date = date instanceof Date ? date : new Date(date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const millis = date.getMilliseconds();
    format = format.replace('yyyy', year);
    format = format.replace('MM', ('0' + month).slice(-2));
    format = format.replace('dd', ('0' + day).slice(-2));
    format = format.replace('hh', ('0' + hour).slice(-2));
    format = format.replace('mm', ('0' + minute).slice(-2));
    format = format.replace('ss', ('0' + second).slice(-2));
    format = format.replace('SSS', millis);
    return format;
}

function passTime(date) {
    date = date instanceof Date ? date : new Date(date);
    var now = new Date();
    var todayTs = now - now.getHours() * 60 * 60 * 1000 - now.getMinutes() * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
    var differ = todayTs - date;
    var hours = date.getHours();
    var minutes = date.getMinutes();
    hours = ('0' + hours).slice(-2);
    minutes = ('0' + minutes).slice(-2);
    if (differ > 2 * 24 * 60 * 60 * 1000) {
        return formatTime(date, 'yyyy/MM/dd') + '更新';
    } else if (differ > 1 * 24 * 60 * 60 * 1000) {
        return '前天 ' + hours + ':' + minutes + '更新';
    } else if(differ > 0) {
        return '昨天 ' + hours + ':' + minutes + '更新';
    } else if(now - date < 60*60*1000) {
        return Math.ceil((now - date) / 60 / 1000) + '分钟前更新';
    } else {
        return '今天 ' + hours + ':' + minutes + '更新';
    }
}

module.exports = {
    formatTime: formatTime,
    passTime: passTime
}