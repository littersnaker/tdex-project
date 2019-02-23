//保存交易相关数据及业务内容
// import SWsMgr from '../net/SWsMgr'
//现货交易
// import Intl from '../intl';
import Decimal from '../utils/decimal';
import Event from '../core/event';

// import Net from '../net/net';
import WsMgr from '../net/WsMgr';
// import {PRODUCT_URL} from '../config';
import {getCurrencySymbol} from "../utils/common"
// import {isEmptyObject} from "../utils/util";
import Product,{SpotProduct} from "./product"
import {CONST} from "../public/const"

export default {
    appModel: null,
    _mgr: null,
    //最小买卖数量
    minQuantity:{"CNY": 1},
    defaultPrices: {"ASK":0,"BID":0,"CLOSE":0,"HIGH":0,"LAST":0,"LOW":0,"OPEN":0,"VOL":0,"LastModify":0,"MEAN":0,"LAST_CHANGED": 0, "VOL_24h":0,
        "ASK1":0,"ASK2":0,"ASK3":0,"ASK4":0,"ASK5":0,"ASK6":0,"ASK7":0,"ASK8":0,"ASK9":0,"ASK10":0,"ASK11":0,"ASK12":0,"ASK13":0,"ASK14":0,"ASK15":0,"ASK16":0,"ASK17":0,"ASK18":0,"ASK19":0,"ASK20":0,
        "ASK21":0,"ASK22":0,"ASK23":0,"ASK24":0,"ASK25":0,"ASK26":0,"ASK27":0,"ASK28":0,"ASK29":0,"ASK30":0,
        "AVOL1":0,"AVOL2":0,"AVOL3":0,"AVOL4":0,"AVOL5":0,"AVOL6":0,"AVOL7":0,"AVOL8":0,"AVOL9":0,"AVOL10":0,"AVOL11":0,"AVOL12":0,"AVOL13":0,"AVOL14":0,"AVOL15":0,"AVOL16":0,"AVOL17":0,"AVOL18":0,"AVOL19":0,"AVOL20":0,
        "AVOL21":0,"AVOL22":0,"AVOL23":0,"AVOL24":0,"AVOL25":0,"AVOL26":0,"AVOL27":0,"AVOL28":0,"AVOL29":0,"AVOL30":0,
        "BID1":0,"BID2":0,"BID3":0,"BID4":0,"BID5":0,"BID6":0,"BID7":0,"BID8":0,"BID9":0,"BID10":0,"BID11":0,"BID12":0,"BID13":0,"BID14":0,"BID15":0,"BID16":0,"BID17":0,"BID18":0,"BID19":0,"BID20":0,
        "BID21":0,"BID22":0,"BID23":0,"BID24":0,"BID25":0,"BID26":0,"BID27":0,"BID28":0,"BID29":0,"BID30":0,
        "BVOL1":0,"BVOL2":0,"BVOL3":0,"BVOL4":0,"BVOL5":0,"BVOL6":0,"BVOL7":0,"BVOL8":0,"BVOL9":0,"BVOL10":0,"BVOL11":0,"BVOL12":0,"BVOL13":0,"BVOL14":0,"BVOL15":0,"BVOL16":0,"BVOL17":0,"BVOL18":0,"BVOL19":0,"BVOL20":0,
        "BVOL21":0,"BVOL22":0,"BVOL23":0,"BVOL24":0,"BVOL25":0,"BVOL26":0,"BVOL27":0,"BVOL28":0,"BVOL29":0,"BVOL30":0},
    productMap:{}, //所有产品, code与产品1:1关系 <k, v>=><code, product>
    codeList: [], //所有产品code列表
    useCodeList:[], //正在使用的产品code列表
    productList:[],
    tradeMap:{},
    currCode: null,
    marketList:[],
    // exchangeRateMap:{}, //btc2cny eth2cny
    // forwardMap:{},

    depthMap: {},
    currDepth: 8,

    //_apiProductData: null,

    init(appModel, mgr, callback){
        this.appModel = appModel;
        this._mgr = mgr;
        // this._apiProductData = Object.assign(defaultProduct, data||{});

        var currConfig = Product.getSpotCoinCodeMap();
        for (var curr in currConfig){
            if (currConfig[curr]) this.minQuantity[curr] = Number(currConfig[curr].MinTrade);
            CONST.CURRENCY[curr] = currConfig[curr].Id;
        }

        var products = Product.getSpotProductCodeMap();
        var codeList = Object.keys(products);
        if (codeList[0]){
            var firstProduct = products[codeList[0]];
            if (firstProduct && firstProduct.Sort){
                codeList.sort((a, b)=>{
                    return products[a].Sort < products[b].Sort ? -1 : 1;
                });
            }
        }
        this.codeList = codeList;
        this.useCodeList = codeList.filter((v)=>products[v].Closed!="1");

        var marketConf = Product.getSpotMarketCodeMap();
        var mList = Object.keys(marketConf);
        if (mList[0]){
            var firstMarket = marketConf[mList[0]];
            if (firstMarket && firstMarket.Sort){
                mList.sort((a, b)=>{
                    return marketConf[a].Sort < marketConf[b].Sort ? -1 : 1;
                });
            }
        }
        this.marketList = [];
        for (var i=0,l=mList.length; i<l; i++){
            this.marketList.push(marketConf[mList[i]]);
        }

        this.initProducts();

        WsMgr.on('tick', this.onUpdatePrice.bind(this));
        WsMgr.on('depth', this.onUpdateDepth.bind(this));
        WsMgr.on('trade', this.onUpdateTrade.bind(this));

        //挖矿精灵
        WsMgr.on('mining_open', this.onUpdateMiningData.bind(this, 'open'));
        WsMgr.on('mining_close', this.onUpdateMiningData.bind(this, 'close'));
        WsMgr.on('mining_autoclose', this.onUpdateMiningData.bind(this, 'autoclose'));
        // WsMgr.on('forward', this.onUpdateForward.bind(this));
        WsMgr.setSpotTradeModel(this);

            // SWsMgr.on('Spot', this.onUpdatePrice.bind(this));
            // SWsMgr.init();
        //过滤不开放的产品
        this.marketList = this.marketList.filter((mv)=>{
            var len = 0;
            this.useCodeList.forEach((uv)=>{
                if (this.productMap[uv].Type==mv.Code){
                    len++;
                    return;
                }
            });
            return len>0;
        });

        // this.currCode = this.useCodeList[0];
        //
        // var depthList = this.getDepthList(this.currCode);
        // if (depthList) this.currDepth = depthList[0];

        if (callback) callback();

        WsMgr.on('orders', this.onUpdateOrders.bind(this));
    },
    initProducts: function(){
        var products = Product.getSpotProductCodeMap();
        this.productList = [];

        this.codeList.forEach((v, i)=>{
            var product = products[v];
            var nameList = product.Name.split('/');
            product.fromCode = nameList[0];
            product.toCode = nameList[1];
            product.Type = product.toCode;
            product.DisplayName = product.Name;
            // product.QueryCode = `${CONST.CODE.SPOT}-${product.Name}`;

            var info = Object.assign({}, this.defaultPrices);
            info.change = 0;
            info.chg = 0;
            product.price = info;

            var sProduct = new SpotProduct(product);
            this.productMap[v] = sProduct;

            if (sProduct.Closed!="1") this.productList.push(sProduct);

            var priceFixed = product.PriceFixed;
            var list = [];
            var count = 3;
            while (count > 0 && priceFixed>=0){
                list.push(priceFixed);
                priceFixed--;
                count--;
            }
            this.depthMap[v] = list;

            //市场类型
            // var toCode = v.substr(3,3);
            // for (var j=0,l=this.marketList.length; j<l;j++){
            //     if (this.marketList[j].ClientCode)
            // }
            // if (this.marketList.indexOf(toCode)==-1){
            //     this.marketList.push(toCode);
            // }
        });


    },
    onUpdatePrice(data){
        //self.isLoadingPrice = false;
        if (typeof data == "string") data = JSON.parse(data);

        var priceUpdateMap = {};
        for (var key in data){
            var name = key;

            var product = this.productMap[name];
            if (!product) continue;

            var info = product.price;
            if (!info) continue;

            var oldLast = info.LAST;

            var newInfo = data[key];
            for (var nk in newInfo){
                try{
                    if (["LastModify", "symbol"].indexOf(nk)==-1) newInfo[nk] = String(Decimal.toFixed(newInfo[nk]))
                }catch (e) {
                    console.error(e);
                }
            }

            Object.assign(info, newInfo);

            info.ASK = Number(info.ASK)<=0 ? 0 : info.ASK;
            info.BID = Number(info.BID)<=0 ? 0 : info.BID;

            info.VOL_24h = Decimal.toFixed(!isNaN(info.VOL) ? info.VOL : 0, product.VolFixed);

            if (info.LAST && Number(info.LAST)>0){
                if(info.OPEN && Number(info.OPEN)>0){
                    info.CLOSE = info.OPEN;
                }
                else if (info.CLOSE && Number(info.CLOSE)>0){
                    if (!info.OPEN || Number(info.OPEN)<=0){
                        info.OPEN = info.CLOSE;
                    }
                }

                //涨跌额
                info.change = Decimal.accSubtr(info.LAST, info.CLOSE, (info.LAST).toString().indexOf('.')>0?(info.LAST).toString().length-(info.LAST).toString().indexOf('.')-1:0);
                //涨跌幅
                info.chg = Number(info.CLOSE)>0 ? Decimal.accMul(Decimal.accDiv(info.change, info.CLOSE), '100', 2) : 0;
            }

            info.LAST_CHANGED = Number(Decimal.accSubtr(info.LAST, oldLast));
            // console.log("last upate:", info.LAST, oldLast);

            priceUpdateMap[name] = info;

            // console.log(JSON.stringify(info));
            // Event.dispatch(Event.EventName.PRODUCT_PRICE_UPDATE, product);
        }

        Event.dispatch(Event.EventName.PRICE_UPDATE, priceUpdateMap);
    },
    // onUpdateForward(data){
    //     var symbol = data.symbol;
    //     var last = data.last;
    //     this.forwardMap[symbol] = last;
    //
    //     if (this.forwardMap["USDCNH"]>0){
    //         this.exchangeRateMap["USDT"] = this.forwardMap["USDCNH"];
    //
    //         if (this.forwardMap["BTCUSD"]>0){
    //             this.exchangeRateMap["BTC"] = Decimal.accMul(this.forwardMap["BTCUSD"], this.forwardMap["USDCNH"]);
    //         }
    //         if(this.forwardMap["ETHUSD"]>0){
    //             this.exchangeRateMap["ETH"] = Decimal.accMul(this.forwardMap["ETHUSD"], this.forwardMap["USDCNH"]);
    //         }
    //     }
    // },
    onUpdateDepth(data){
        if (typeof data == "string") data = JSON.parse(data);

        var priceUpdateMap = {};
        for (var key in data){
            var name = key;

            var product = this.productMap[name];
            if (!product) continue;

            var info = product.price;
            if (!info) continue;

            Object.assign(info, data[key]);
            priceUpdateMap[name] = info;
        }

        Event.dispatch(Event.EventName.DEPTH_UPDATE, priceUpdateMap);
    },
    onUpdateTrade(data){
        var code = data.symbol;
        var map = {};
        var list = data.data.map((v)=>Object.assign({LastPrice:0, Volume:0, Side:"0", Time:"0"},v));
        map[code] = list;

        //this.tradeMap[code] = data.data;
        var tList = this.tradeMap[code];
        if(tList){
            var newList = list.concat(tList);
            newList.splice(WsMgr.maxVolume);
            map[code] = newList;
            this.tradeMap[code] = newList;
        }else{
            this.tradeMap[code] = list;
        }

        Event.dispatch(Event.EventName.TRADE_UPDATE, map);
    },
    onUpdateMiningData(type, data){
        if (data && data.Type=='spot'){
            Event.dispatch(Event.EventName.MINING_UPDATE, {Event:type, Msg:data.Msg});
        }
    },
    onUpdateOrders(){
        Event.dispatch(Event.EventName.ORDER_UPDATE);
    },
    getTradeInfo(code){
        return this.tradeMap[code];
    },
    changeDepthSubscribe(depth){
        if (this.currDepth != depth){
            this.currDepth = parseInt(depth);
            WsMgr.subscribeDepth(this.currCode, this.currDepth);
        }
    },
    getUseCodeList(){
        return this.useCodeList;
    },
    getMarketList(){
        return this.marketList;
    },
    getCurrCode(){
        return this.currCode;
    },
    getCurrDepth(){
        return this.currDepth;
    },
    getProduct(code){
        return this.productMap[code];
    },
    getTradeMap(){
        return this.tradeMap;
    },
    getProducts(){
        return this.productMap;
    },
    getPrice(code){
        return this.productMap[code].price;
    },
    selectCode(code, updateMgr){
        try{
            if (updateMgr){
                var product = this.getProduct(code);
                if (product)this._mgr.setCurrProduct(product);
            }

            this.currCode = code;
            var depthList = this.getDepthList(code);
            if (depthList && depthList.indexOf(this.currDepth)==-1){
                this.currDepth = depthList[0];
            }

            if (this.currCode && this.currDepth!==null){
                this.subscribeWs();

                Event.dispatch(Event.EventName.PRODUCT_SELECT, code);
            }
        }catch (e){
            console.error(e);
        }
    },
    unselectCode(){
        WsMgr.unsubDepth(this.currCode);
        WsMgr.unsubTrade(this.currCode);
    },
    subscribeWs(){
        if (this.currCode && this.currDepth!==null){
            WsMgr.subscribeDepth(this.currCode, this.currDepth);
            WsMgr.subscribeTrade(this.currCode);
        }
    },
    getProductList: function () {
        return this.productList;
    },
    getMarketInfo: function (code) {
        var marketConf = Product.getSpotMarketCodeMap();
        return marketConf[code];
    },
    getMinQuantity(code){
        return this.minQuantity[code];
    },
    getDepthList(code){
        return this.depthMap[code];
    },
    getOrderCode(rid, currency){
        var from = getCurrencySymbol(rid);
        var to = getCurrencySymbol(currency);
        if (from && to) return from.sn + to.sn;
    },
    calcPriceToCny(code, price){
        if (!price && price<=0) return;

        var info = this.getProduct(code);
        var toCode = info.toCode;
        return this._mgr.calcCurrencyCodeToCny(toCode, price);
    },

    //以最近一小时的分钟均价的均价为基准，限价±10%。
    //您委托的价格已超出最新均价10%/-10%以上
    checkDelegateAvgPrice(delegatePrice, priceInfo){
        var mean = priceInfo.MEAN;
        if (mean){
            var offset = Decimal.accMul(mean, 0.1);
            var max = Number(Decimal.accAdd(mean, offset));
            var min = Number(Decimal.accSubtr(mean, offset));
            if (delegatePrice<=max && delegatePrice>=min){
                return true;
            }
        }
        return false;
    },
    // reqProductList(listener){
    //     // var self = this;
    //     Net.httpRequest(PRODUCT_URL, {Device:"WEB"}, function (data) {
    //         var info;
    //         if (data.Status==0){
    //             info = data.Data;
    //         }
    //         if (listener) listener(info);
    //     }, this, 'get');
    // },
    // apiProduct(){
    //     return this._apiProductData;
    // },
    clearUserData(){

    }
    // getVolFixed(code){
    //     var priceInfo = this.getPriceInfo(code);
    //     if (priceInfo){
    //         var fromCode = priceInfo.fromCode;
    //         var minQ = this.minQuantity[fromCode];
    //         var strMinQ = String(minQ);
    //         return strMinQ.indexOf(".")==-1 ? 0 :strMinQ.length - strMinQ.indexOf(".") - 1;
    //     }
    // }
}
