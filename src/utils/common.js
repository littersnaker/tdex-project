//与网站有关或浏览器相关的
import {CONST} from '../public/const';
import Product from '../model/product';
import md5 from 'blueimp-md5';
import {IS_MD5_PWD} from '../config';
import Notification from '../utils/notification';
import Intl from '../intl';
import moment from 'moment';

const $ = window.$;
//浮动提示框 1秒后消失
export function toast(msg, isError, sec) {
    // var div = $('#toast');
    // div.html(msg);
    // div.css({visibility: 'hidden'});
    // if (isError) {
    //     div.addClass("error");
    // } else {
    //     div.removeClass("error");
    // }
    // var top = ($(window).height() - div.height()) / 2;
    // var left = ($(window).width() - (div.width() || 80)) / 2;
    // var scrollTop = $(document).scrollTop();
    // var scrollLeft = $(document).scrollLeft();
    // div.css({position: 'absolute', 'top': top + scrollTop, left: left + scrollLeft, visibility: ''}).show();
    // //1秒后隐藏
    // var sec = sec || 3000;
    // div.delay(sec).hide(0);
    if (isError){
        Notification.error(msg);
    }else{
        Notification.success(msg);
    }
}

export const Loading = {
    spinner: null,
    show () {
        if (!this.spinner) {
            //var div = $("<div />").appendTo($("#preloading"));
            //div.addClass('preloading-circle');
            //div.css({top:90, left:($(window).width() - 60) / 2});

            var opts = {
                lines: 13, // The number of lines to draw
                length: 7, // The length of each line
                width: 4, // The line thickness
                radius: 10, // The radius of the inner circle
                corners: 1, // Corner roundness (0..1)
                rotate: 0, // The rotation offset
                color: '#000', // #rgb or #rrggbb
                speed: 1, // Rounds per second
                trail: 60, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: false, // Whether to use hardware acceleration
                className: 'preloading-spinner', // The CSS class to assign to the spinner
                zIndex: 10000
            };
            this.spinner = new window.Spinner(opts).spin(document.getElementById('preloading'));

            var top = 119;
            var left = ($(window).width() - 40) / 2 + 20;
            $('.preloading-spinner').css({top: top, left: left});
        }
        $('#preloading').show();

        var self = this;
        setTimeout(function () {
            self.hideLoading();
        }, 500);
    },
    hide() {
        if (this.spinner) {
            this.spinner.stop();
            delete this.spinner;
        }
        $('#preloading').hide();
    }
}

export function formatStr(str) {
    if (str) {
        var len = arguments.length;
        if (len > 1) {
            var args = arguments;
            str = str.replace(/\{([\d]+)\}/g, function (word, s1) {
                return args[Number(s1)];
            });
        }
        return str;
    }
}

export function adjustWinCenter(div) {
    if (div.length > 0) {
        var top = ($(window).height() - div.height()) / 2;
        var left = ($(window).width() - div.width()) / 2;
        var scrollTop = $(document).scrollTop();
        var scrollLeft = $(document).scrollLeft();
        div.css({position: 'absolute', 'top': top + scrollTop, left: left + scrollLeft, visibility: ''}).show();
    }
}

export function lowIe() {
    var DEFAULT_VERSION = 8;
    var ua = navigator.userAgent.toLowerCase();
    var isIE = ua.indexOf("msie") > -1;
    var safariVersion;
    if (isIE) {
        safariVersion = ua.match(/msie ([\d.]+)/)[1];
        if (parseInt(safariVersion) <= DEFAULT_VERSION) {             // 低于ie8
            return true;
        }
    }
    return false;
}

export function isIeLowVersion() {
    if (window.ActiveXObject) {
        var ua = navigator.userAgent.toLowerCase();
        var version = Number(ua.match(/msie ([\d.]+)/)[1]);
        return version < 10;
    }
    return false;
}

export function isMobile() {
    return !!navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i);
}

export function isRunningInWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent);
}

export function parseUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function () {
            var ret = {},
                seg = a.search.replace(/^\?/, '').split('&'),
                len = seg.length, i = 0, s;
            for (; i < len; i++) {
                if (!seg[i]) {
                    continue;
                }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
        segments: a.pathname.replace(/^\//, '').split('/')
    };
}

export function checkBrowserSupport() {
    if ($.browser.safari && $.browser.version <= "534.57.2" || (!window.WebSocket && !window.MozWebSocket) || isIeLowVersion()){
        return false;
    }
    return true;
}

export function getErrMsg(error, data) {
    var matchlist;
    while (matchlist = /\{([\w]+)\}/g.exec(error)) {
        var fkey = matchlist[0];
        var key = matchlist[1];
        error = error.replace(fkey, Intl.lang(key + "." + data[key]) || data[key]);
    }

    return error;
}
export function getDomain(){
    if ("development" != process.env.NODE_ENV) {
        var HOST_NAME = window.location.host;
        var hlist = HOST_NAME.split('.');
        var MAIN_DOMAIN;
        if (hlist.length == 3) {
            MAIN_DOMAIN = hlist[1] + '.' + hlist[2];
        } else {
            MAIN_DOMAIN = HOST_NAME;
        }
        return MAIN_DOMAIN
    }else{
        return "localhost";
    }
}
export function getURL(){
    var IS_SUPPORT_SSL = true;
    var HOST_NAME = window.location.host;
    var SERVER_DOMAIN = (IS_SUPPORT_SSL ? 'https': 'http') + '://'+HOST_NAME+'/';

    return SERVER_DOMAIN;
}

const CURRENCY_SYMBOL = {};
CURRENCY_SYMBOL[CONST.CURRENCY.BTC] = {sb:'฿', sn:'BTC'};
CURRENCY_SYMBOL[CONST.CURRENCY.ETH] = {sb:'Ξ', sn:'ETH'};
CURRENCY_SYMBOL[CONST.CURRENCY.CNY] = {sb:'￥', sn:'CNY'};
CURRENCY_SYMBOL[CONST.CURRENCY.USD] = {sb:'$', sn:'USD'};
CURRENCY_SYMBOL[CONST.CURRENCY.USDT] = {sb:'$', sn:'USDT'};
export function getCurrencySymbol(currency) {
    if (!CURRENCY_SYMBOL[currency]){
        var currConfig = Product.getSpotCoinCodeMap();
        for (var curr in currConfig){
            var cf = currConfig[curr];
            CURRENCY_SYMBOL[CONST.CURRENCY[curr]] = {sb: cf.Symbol||"", sn:cf.Code};
        }
    }

    return CURRENCY_SYMBOL[currency];

    // var CURRENCY_SYMBOL = {};
    // CURRENCY_SYMBOL[CONST.CURRENCY.BTC] = {sb:'฿', sn:'BTC'};
    // CURRENCY_SYMBOL[CONST.CURRENCY.USD] = {sb:'$', sn:'USD'};
    // CURRENCY_SYMBOL[CONST.CURRENCY.CNY] = {sb:'￥', sn:'CNY'};
    // // CURRENCY_SYMBOL[CONST.CURRENCY.EUR] = {sb:'€', sn:'EUR'};
    // CURRENCY_SYMBOL[CONST.CURRENCY.ETH] = {sb:'Ξ', sn:'ETH'};
    // CURRENCY_SYMBOL[CONST.CURRENCY.OMG] = {sb:'', sn:'OMG'};
    // CURRENCY_SYMBOL[CONST.CURRENCY.NEO] = {sb:'', sn:'NEO'};
    // CURRENCY_SYMBOL[CONST.CURRENCY.BCC] = {sb:'', sn:'BCC'};
    // CURRENCY_SYMBOL[CONST.CURRENCY.WKC] = {sb:'', sn:'WKC'};
    //
    // return CURRENCY_SYMBOL[currency];
}
export function  getRndInt(min, max){
    return (Math.random() * (max - min + 1) + min) | 0;
}

export function md5Pwd(pwd) {
    return IS_MD5_PWD ? md5(pwd) : pwd;
}

//隐藏
export function hideAccount(account){
    //手机：前3位，后两位
    //邮箱 前3位**@
    if (account.indexOf('*')!=-1) return account;

    var mobile = /(\d{3})([\d]+)(\d{2})/;
    var len = account.length;
    var star = '*****';
    if (mobile.test(account)&&account.indexOf('@')==-1) {
        len = len - 5;
        account = account.replace(mobile, '$1' + star.substring(0, len) + '$3');
    }else{
        star = '**';
        var email = /(\w{3})([\w]+)@([^@]+)/;
        if (email.test(account)){
            var list = account.split('@');
            len = len - list[1].length - 3;
            account = account.replace(email, '$1' + star.substring(0, len) + '@$3');
        }
    }
    return account;
}

//分页
//perStart0：每次获取都从0开始
export function Pagination(list, pageSize=10, perStart0=false) {
    const Total = list.length;
    const PageCount = Math.ceil(Total / pageSize);

    return (curPage)=>{
        var startRow = perStart0 ? 0 : (curPage - 1) * pageSize;//开始显示
        var endRow = curPage*pageSize;//结束显示
        endRow = (endRow > Total)? Total : endRow;
        const List = list.slice(startRow, endRow);

        return {Total, PageCount, Page:curPage, PageSize:pageSize, List};
    }
}

//解析IB的时间
export function parseIBTradingHours(tradingHours){
    var dArr = tradingHours.split(";");
    var list = [];
    for (var i=0,l=dArr.length; i<l; i++){
        var item = dArr[i];
        var arr = item.split("-");

        var range = [];
        var begin = arr[0];
        if (begin){
            if (begin.indexOf("CLOSED")==-1){
                var bM = moment(begin+" +0800", "YYYYMMDD:HHmm Z");
                range.push(bM);
            }else{
                var bM = moment(begin.replace(":CLOSED", "")+" +0800", "YYYYMMDD Z");
                range.push(bM);
            }
        }

        var end = arr[1];
        if (end) {
            if (end.indexOf("CLOSED")==-1){
                var eM = moment(end+" +0800", "YYYYMMDD:HHmm Z");
                range.push(eM);
            }else{

            }
        }
        list.push(range);
    }
    return list;
}

//转换为62进制
export function string10to62(number) {
    var chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split(''),
        radix = chars.length,
        qutient = +number,
        arr = [];
    do {
        var mod = qutient % radix;
        qutient = (qutient - mod) / radix;
        arr.unshift(chars[mod]);
    } while (qutient);
    return arr.join('');
}

export function string62to10(number_code) {
    var chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ',
        radix = chars.length,
        number_code = String(number_code),
        len = number_code.length,
        i = 0,
        origin_number = 0;
    while (i < len) {
        origin_number += Math.pow(radix, i++) * chars.indexOf(number_code.charAt(len - i) || 0);
    }
    return origin_number;
}
