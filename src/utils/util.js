//与网站内容无关的工具类
export function isEmptyObject(obj) {
    for (var k in obj) {
        return false;
    }
    return true;
}

export function jsonToQueryString(json) {
    return Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' +
            encodeURIComponent(json[key]);
    }).join('&');
}

export function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(window.location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export function formatDuring(mss) {
    var isMinus = mss<0;
    mss = Math.abs(mss);
    var hours = parseInt(mss / (1000 * 60 * 60));
    var minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = parseInt((mss % (1000 * 60)) / 1000);
    return (isMinus?'-':'')+('0'+hours).substr(-2) + ":" + ('0'+minutes).substr(-2) + ":" + ('0'+seconds).substr(-2);
}

export function text2html(text) {
    return text.replace(/([\r\n]+)/g, '<br/>');
}

//json和数组
export function clone(obj) {
    var newObj = {};
    for (var key in obj){
        newObj[key] = typeof(obj[key]=='object') ? clone(obj[key]) : obj[key];
    }
    return newObj;
}

export function parseUri(str) {
    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
}

export function requestFullScreen(elem) {
    var element = elem? elem : document.documentElement;
    // 判断各种浏览器，找到正确的方法
    var requestMethod = element.requestFullScreen || //W3C
        element.webkitRequestFullScreen || //Chrome等
        element.mozRequestFullScreen || //FireFox
        element.msRequestFullScreen; //IE11
    if (requestMethod) {
        requestMethod.call(element);
    }
    else if (typeof window.ActiveXObject !== "undefined") {//for Internet Explorer
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}
export function exitFull() {
    // 判断各种浏览器，找到正确的方法
    var exitMethod = document.exitFullscreen || //W3C
        document.mozCancelFullScreen || //Chrome等
        document.webkitExitFullscreen || //FireFox
        document.webkitExitFullscreen; //IE11
    if (exitMethod) {
        exitMethod.call(document);
    }
    else if (typeof window.ActiveXObject !== "undefined") {//for Internet Explorer
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}
export function checkScreenFull() {
    var isFull = document.fullscreenEnabled || window.fullScreen || document.webkitIsFullScreen || document.msFullscreenEnabled;
    //to fix : false || undefined == undefined
    if (!isFull) {isFull = false;}
    return isFull;
}

export function setStorage(key, value, isLocal){
    try{
        var text = JSON.stringify({value: value});
        if(isLocal)
            window.localStorage.setItem(key, text);
        else
            window.sessionStorage.setItem(key, text);
    }catch (e) {
        console.log(e);
    }
}
export function getStorage(key, isLocal){
    try{
        var text;
        if (isLocal)
            text = window.localStorage.getItem(key);
        else
            text = window.sessionStorage.getItem(key);
        if (!text) return null;

        var obj = JSON.parse(text);
        if (obj)
            return obj.value;
    }catch (e) {
        console.log(e);
    }
}
export function removeStorage(key, isLocal){
    try{
        if (isLocal)
            window.localStorage.removeItem(key);
        else
            window.sessionStorage.removeItem( key );
    }catch (e) {
        console.log(e);
    }
}
export function isMobile(){
    if (/(iPhone|iPod|iOS|Android)/i.test(navigator.userAgent)) { //移动端
        //if(window.screen.width<1100){
          return true
        //}
    }
    return false;
}

export function checkAgent(){
    var u = navigator.userAgent, app = navigator.appVersion;
    return {
        trident: u.indexOf('Trident') > -1,     //IE内核
        presto: u.indexOf('Presto') > -1,       //opera内核
        webKit: u.indexOf('AppleWebKit') > -1,  //苹果、谷歌内核
        gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,     //火狐内核
        mobile: !!u.match(/AppleWebKit.*Mobile.*/),                     //是否为移动终端
        ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),                //ios终端
        android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1,    //android终端
        iPhone: u.indexOf('iPhone') > -1 ,          //是否为iPhone或者QQHD浏览器
        iPad: u.indexOf('iPad') > -1,               //是否iPad
        webApp: u.indexOf('Safari') == -1,          //是否web应该程序，没有头部与底部
        weixin: u.indexOf('MicroMessenger') > -1,   //是否微信 （2015-01-22新增）
        qq: u.match(/\sQQ/i) == " qq"               //是否QQ
    };
}

export function htmlEscape(text){
    return text.replace(/[<>"&]/g, function(match){
        switch(match){
            case "<": return "&lt;";
            case ">":return "&gt;";
            case "&":return "&amp;";
            case "\"":return "&quot;";
        }
    });
}

export function randomStr(len) {
    len = len || 32;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = chars.length;
    var pwd = '';
    for (var i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}
