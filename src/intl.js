import Cookies from './utils/cookie';
// import request from './net/request';
import Event from './core/event';
import {getParameterByName} from './utils/util'
// import {CDN_HOST, IS_ENGINE_TRADING} from './config';

export default {
    _isInited: false,
    ckey:'lang',
    supports: ['zh-cn', 'en-us'], //,
    chartLangMap: { //k线对应的语言
        'zh-cn': 'zh',
        'en-us': 'en',
        'ja-jp': 'ja',
        'zh-tw': 'zh_TW'
    },
    supportMap:{},
    langPacket:{},
    // productPacket:null,
    futProductPacket: {},
    loadedCount: 0,
    initLoad: 1,
    curLang: null,
    init: function(callback){
        if (this._isInited) return;

        //工程盘暂时不开日文
        if (process.env.NODE_ENV=="production") this.supports = ['zh-cn', 'en-us'];

        for (var i=0,len=this.supports.length; i<len; i++){
            this.supportMap[this.supports[i]] = true;
        }

        var langParam = getParameterByName("lang");

        var lang = (typeof(ElectronExt)=='object' && ElectronExt.lang) ? ElectronExt.lang() : (langParam ? langParam : Cookies.get(this.ckey));
        var userLang = lang || this.getDefaultLang();

        this.setLang(userLang, callback);

        this._isInited = true;
    },
    lang: function(k, ...params){
        let {key, value} = this._lang(this.curLang, k, ...params);
        if (value){
            return value;
        }

        if (this.curLang!='zh-cn'){
            let {key, value} = this._lang('zh-cn', k, ...params);
            if (value) return value;
        }

        return key;
    },
    _lang(lang, k, ...params){
        var key,defaultKey;
        var kt = typeof(k);
        if (kt=="string"){
            key = k;
        }else if(kt=="object"){
            key = k.key;
            defaultKey = k.def;
        }

        var value = '';
        var langData = this.langPacket[lang];
        if (langData){
            if (key && langData.hasOwnProperty(key)){
                value = langData[key];
            }else if(defaultKey && langData.hasOwnProperty(defaultKey)){
                value = langData[defaultKey];
            }
            if (value){
                var len = params.length;
                if (len > 0){
                    value = value.replace(/\{([\d]+)\}/g, function(word, s1){
                        return params[s1?Number(s1)-1:0];
                    });
                }
            }
        }
        return {key, value};
    },
    //k线语言
    getChartLang: function(){
        return this.chartLangMap[this.curLang];
    },
    setLang: function(lang, callback){
        if (this.curLang == lang) return;

        this.curLang = this.supportMap[lang] ? lang : this.supports[0];
        Cookies.set(this.ckey, this.curLang, { expires: 365 });

        var newCallback = ()=>{
            if (callback) callback();
            Event.dispatch(Event.EventName.LANG_SELECT, self.curLang);
            if (typeof(ElectronExt)=='object' && ElectronExt.changeLanguage)ElectronExt.changeLanguage(self.curLang);
        }

        var self = this;
        this.loadFile(function () {
            newCallback();
        }, newCallback);
    },
    isInited: function(){
        return this._isInited && this.loadedCount>=this.initLoad;
    },
    getLang: function(){
        return this.curLang;
    },
    getSupports: function(){
        return this.supports;
    },
    loadedFile: function (callback) {
        this.loadedCount++;
        this.checkLoadComplete(callback);
    },
    checkLoadComplete: function (callback) {
        if (this.loadedCount >= this.initLoad){
            if (callback) callback();
        }
    },
    loadClientLangFile: function (callback) {
        var self = this;

        // if (typeof(ElectronExt)=='undefined'){
        var lang = self.curLang;
        import('./intl/'+lang+'.json').then((obj)=>{
            self.langPacket[lang] = obj;
            self.loadedFile(callback);
        });
    },
    loadFile: function(callback, cdFunc){
        if (this.curLang && !this.langPacket[this.curLang]){
            if (this.curLang != 'test'){
                var self = this;
                if (this.supports.indexOf(this.curLang)!=-1){
                    this.loadedCount = 0;

                    this.loadClientLangFile(callback);
                    // this.loadServerLangFile(callback);
                    // this.loadFutLangFile(callback);
                }
            }
            else this.langPacket[this.curLang] = {};

            //TODO:lang.js product.js
        }else{
            if(cdFunc) cdFunc();
        }
    },
    getDefaultLang: function(){
        var language = navigator.appName == 'Netscape' ? navigator.language : navigator.browserLanguage;
        if (language.indexOf('en') > -1) return 'en-us';
        else if(language.indexOf('jp')>-1 || language.indexOf('ja')>-1 ) return 'ja-jp';
        else return 'zh-cn';
    }
};
