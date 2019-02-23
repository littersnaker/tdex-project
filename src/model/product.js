import Net from '../net/net';
import {IS_CLOSE_EXCHANGE} from '../config';
// import {PRODUCT_LIST_URL, PRODUCT_URL} from "../config";

export default {
    _coinCurrencyMap: {}, //虚拟币currency对应
    _coinCodeMap: {},    //虚拟币code对应
    _coinList: [],

    _spotMarketCodeMap:{}, //市场
    _spotProductCodeMap:{}, //(k,v)=(产品code,产品数据)
    // _spotCoinCodeMap: {}, //

    // _futProductIdMap:{},
    _futProductList: [],

    //
    _cfdProductList: [],

    _reqCount: 0,

    _vipList:null, // Vip等级列表

    init(callback){
        this._loadComplete = this._loadComplete.bind(this, callback);

        this._loadProductCoins(this._loadComplete);
        this._loadSpotProductList(this._loadComplete);
        this._loadFutProductList(this._loadComplete);
        this.loadCfdProductList(this._loadComplete);
        this.loadProductVip(this._loadComplete, this);
    },
    _loadComplete(callback){
        this._reqCount++;

        if (this._reqCount == 5){
            // for (var code in this._spotCoinCodeMap){
            //     var info = this._spotCoinCodeMap[code];
            //     var newInfo = this._coinCodeMap[code];
            //     if (newInfo) Object.assign(info, newInfo);
            // }

            if (callback) callback();
        }
    },
    //请求虚拟币数据
    _loadProductCoins(callback){
        Net.httpRequest("product/coins", "", (data)=>{
            if (data.Status == 0) {
                var info = data.Data;
                if(info){
                    var list = data.Data.List;
                    list.forEach((v)=>{
                        this._coinCurrencyMap[v.Id] = v;
                        this._coinCodeMap[v.Code] = v;
                    });
                    this._coinList = list;
                }
                if (callback) callback(info);
            }
        }, this);
    },
    //请求现货产品数据
    _loadSpotProductList(callback){
        // var self = this;
        Net.httpRequest("product/spots", "",  (data)=>{
            if (data.Status==0){
                var info = data.Data;
                if (info){
                    var list = info.List||[];
                    list.sort((a, b)=>{
                        return a.Sort < b.Sort ? -1 : 1;
                    });
                    var productMap = {};
                    var marketMap = {};
                    list.forEach(v=>{
                        if (IS_CLOSE_EXCHANGE){
                            v.Closed = 1;
                        }
                        productMap[v.Code] = v;
                        var market = v.Name.split("/")[1];
                        if (!marketMap[market]){
                            marketMap[market] = {
                                Code: market,
                                Name: market,
                                Sort: v.Sort,
                            }
                        }
                    });
                    this._spotProductCodeMap = productMap;
                    this._spotMarketCodeMap = marketMap;
                    // if (info.currency){
                    //     this._spotCoinCodeMap = info.currency;
                    // }
                }
                if (callback) callback(info);
            }
        }, this, 'post');
    },
    //请求期货产品数据
    _loadFutProductList(callback){
        Net.httpRequest("product/futures", "", (data)=>{
            if (data.Status==0){
                var info = data.Data;
                if (info){
                    var list = info.List;
                    if (list){
                        list.sort((a, b)=>{
                            var ac = a.Code;
                            var bc = b.Code;
                            if (ac < bc) return -1;
                            else{
                                return a.ID < b.ID ? -1 : 1;
                            }
                        });

                        // list.forEach((v)=>{
                        //     if (typeof(v.Risks)=='string') v.Risks = JSON.parse(v.Risks);
                        //
                        //     this._futProductIdMap[v.ID] = v;
                        // });
                        this._futProductList = list;
                    }
                }
                if (callback) callback(info);
            }
        }, this, 'post');
    },
    loadCfdProductList(callback){
        Net.httpRequest("cfd/contracts", "", (data)=>{
            if (data.Status==0){
                var info = data.Data;
                if (info){
                    var list = info;
                    this._cfdProductList = list;
                    if (callback) callback(list);
                }
                // if (callback) callback(info);
            }
        }, this, 'post');
    },
    //Vip
    loadProductVip(callback, winObj){
        if (this._vipList){
            if (callback) callback(this._vipList);
        }else{
            Net.httpRequest("product/vip", "", (data)=> {
                if (data.Status == 0) {
                    var info = data.Data;
                    if (info){
                        this._vipList = info.List;
                        if (callback) callback(this._vipList);
                    }
                }
            }, winObj);
        }
    },
    getSpotMarketCodeMap(){
        return this._spotMarketCodeMap;
    },
    getSpotProductCodeMap(){
        return this._spotProductCodeMap;
    },
    getSpotCoinCodeMap(){
        return this._coinCodeMap;
    },
    // getFutProductIdMap(){
    //     return this._futProductIdMap;
    // },
    getFutProductList(){
        return this._futProductList;
    },
    getCfdProductList(){
        return this._cfdProductList;
    },
    getCoinList(){
        return this._coinList;
    },
    getCoinCurrencyMap(){
        return this._coinCurrencyMap;
    },
    getCoinInfo(currency){
        return this._coinCurrencyMap[currency];
    },
    getVipList(){
        return this._vipList;
    }
}

class BaseProduct{
    constructor(options) {
        for (var key in options){
            this[key] = options[key];
        }
    }

    update(options){
        for (var key in options){
            this[key] = options[key];
        }
    }
}

export class SpotProduct extends BaseProduct{
    constructor(options) {
        super(options);
    }
}

export class FutProduct extends BaseProduct{
    constructor(options) {
        super(options);
    }
}

export class CfdProduct extends BaseProduct{
    constructor(options) {
        super(options);
    }
}
