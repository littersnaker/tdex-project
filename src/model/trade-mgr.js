import SpotTradeModel from './spot-trade';
import FutTradeModel from './fut-trade';
import CfdTradeModel from './cfd-trade';
import history from '../core/history';
import Event from "../core/event";
import WsMgr from "../net/WsMgr";
import Decimal from "../utils/decimal";
import {CONST} from "../public/const";
import {SpotProduct, FutProduct, CfdProduct} from "../model/product";

export default {
    initedCount: 0,
    currProduct: null,
    // currCode: null,
    coinList: null, //虚拟币列表

    _forwardMap:{},
    exchangeRateMap:{"CNY":{}}, //汇率（人民币）
    tradeTypeList: [CONST.TRADE_TYPE.CFG, CONST.TRADE_TYPE.FUT, CONST.TRADE_TYPE.SPOT],
    // clientFutCodes: ['BTCUSD'], //前端记录的期货code列表(备用)
    // currDepth: 6,

    init(appModel, callback){
        this.appModel = appModel;

        //初始化完（加载产品列表成功后），再进行其他处理
        this.onInited = this.onInited.bind(this, callback);

        SpotTradeModel.init(appModel, this, this.onInited);
        FutTradeModel.init(appModel, this, this.onInited);
        CfdTradeModel.init(appModel, this, this.onInited);

        WsMgr.on('forward', this.onUpdateForward.bind(this));
    },

    onInited(callback){
        this.initedCount++;
        if (this.initedCount >=3){
            if (callback) callback();

            Event.dispatch(Event.EventName.PRODUCT_UPDATE);
        }
    },
    onUpdateForward(data){
        var symbol = data.symbol;
        var last = data.last;
        this._forwardMap[symbol] = last;

        if (this._forwardMap["USDCNH"]>0){
            var rateMap = {};
            rateMap["USD"] = this._forwardMap["USDCNH"];
            rateMap["USDT"] = this._forwardMap["USDCNH"];

            if (this._forwardMap["BTCUSD"]>0){
                rateMap["BTC"] = Decimal.accMul(this._forwardMap["BTCUSD"], this._forwardMap["USDCNH"]);
            }
            if(this._forwardMap["ETHUSD"]>0){
                rateMap["ETH"] = Decimal.accMul(this._forwardMap["ETHUSD"], this._forwardMap["USDCNH"]);
            }
            this.exchangeRateMap["CNY"] = rateMap;
        }

        Event.dispatch(Event.EventName.EXCHANGERATE_UPDATE, this.exchangeRateMap);
    },
    //汇率
    getForwardPrice(code){
        var price = this._forwardMap[code];
        if (price){
            return price
        }
    },
    //价格对应相应的currencyCode的，转换成人民币
    calcCurrencyCodeToCny(currencyCode, price){
        var rateMap = this.exchangeRateMap["CNY"];
        if (rateMap){
            if (currencyCode=="BTC" && rateMap[currencyCode]){
                return Decimal.accMul(price, rateMap[currencyCode], 2);
            }else if (currencyCode=="ETH" && rateMap[currencyCode]){
                return Decimal.accMul(price, rateMap[currencyCode], 2);
            }else if((currencyCode =='USDT' || currencyCode=='USD') && rateMap[currencyCode]){
                return Decimal.accMul(price, rateMap[currencyCode], 2);
            }
        }
    },
    model(tradeType){
        switch (tradeType){
            case CONST.TRADE_TYPE.FUT:
                return FutTradeModel;
            case CONST.TRADE_TYPE.SPOT:
                return SpotTradeModel;
            case CONST.TRADE_TYPE.CFG:
                return CfdTradeModel;
        }
    },
    // getTypeList(){
    //     var markets = SpotTradeModel.getMarketList();
    //     var types = FutTradeModel.getTypeList();
    //     return types.concat(markets);
    // },
    getProductList(){
        var spots = SpotTradeModel.getProductList();
        var futs = FutTradeModel.getProductList();

        return futs.concat(spots);
    },
    getCodeList(){
        var codes = FutTradeModel.getCodeList();
        return codes.concat(SpotTradeModel.getUseCodeList());
    },
    isFut(code){
        var product = FutTradeModel.getProduct(code);
        return !!product;
    },
    isSpot(code){
        var product = SpotTradeModel.getProduct(code);
        return !!product;
    },
    isCfd(code){
        var product = CfdTradeModel.getProduct(code);
        return !!product;
    },
    //TODO: 不同类型的code可能相等
    getProduct(code, trade_type){
        if (trade_type) {
            var product = this.model(trade_type).getProduct(code);
            if (product){
                if (trade_type==CONST.TRADE_TYPE.FUT) return product[0];
                else return product;
            }
        }

        var product = FutTradeModel.getProduct(code);
        if (product) return product[0];
        product = SpotTradeModel.getProduct(code);
        if (product) return product;
        product = CfdTradeModel.getProduct(code);
        if (product) return product;
    },
    btnSelectProduct(product){
        //点击切换code按钮时的统一调用
        var tradeType = this.selectProduct(product);

        var path;
        if (tradeType==CONST.TRADE_TYPE.FUT){
            path = "trade";
        }else if(tradeType==CONST.TRADE_TYPE.SPOT){
            path = "exchange";
        }else if (tradeType==CONST.TRADE_TYPE.CFG){
            path = "cfd";
        }
        if (path){
            history.push(`${path}/${product.Code}`);
        }
    },
    selectProduct(product){
        this.currProduct = product;
        var code = product.Code;

        var tradeType = this.getProductTradeType(product);
        if (tradeType){
            switch (tradeType){
                case CONST.TRADE_TYPE.FUT:
                    FutTradeModel.selectCode(code);
                    break;
                case CONST.TRADE_TYPE.SPOT:
                    SpotTradeModel.selectCode(code);
                    break;
                case CONST.TRADE_TYPE.CFG:
                    CfdTradeModel.selectCode(code);
                    break;
            }
            return tradeType;
        }
    },
    setCurrProduct(product){
        this.currProduct = product;
    },
    getProductTradeType(product){
        if (product instanceof FutProduct){
            return CONST.TRADE_TYPE.FUT
        }else if(product instanceof SpotProduct){
            return CONST.TRADE_TYPE.SPOT
        }else if(product instanceof CfdProduct){
            return CONST.TRADE_TYPE.CFG
        }
    },
    isFutByProduct(product){
        return this.getProductTradeType(product)==CONST.TRADE_TYPE.FUT;
    },
    getTradeTypeList(){
        return this.tradeTypeList;
    },
    getListByTradeType(tradeType){
        var model = this.model(tradeType);
        if (model) return model.getProductList();
        return [];
    },
    getCurrModel(){
        if (this.currProduct){
            var tradeType = this.getProductTradeType(this.currProduct);
            if (tradeType) return this.model(tradeType);
        }
    },
    // getProduct(code){
    //     var product = FutTradeModel.getProduct(code);
    //     if (product) return product[0];
    //     return SpotTradeModel.getProduct(code);
    // },
    // getType(code){
    //     var product = this.getProduct(code);
    //     if (product) return product.Type;
    // },
    // getCurrCode(isFut){
    //     if (isFut===false){
    //         var currCode = SpotTradeModel.getCurrCode();
    //         this.currCode = currCode;
    //     }
    //     return this.currCode;
    // },
    // getCurrDepth(){
    //     if (this.isFut(this.currCode)){
    //         return FutTradeModel.getCurrDepth()
    //     }else{
    //         return SpotTradeModel.getCurrDepth();
    //     }
    // },
    // getTypeCodes(type){
    //     if (type=="fut"){
    //         return FutTradeModel.getCodeList();
    //     }else{
    //         return SpotTradeModel.getUseCodeList();
    //     }
    // },
    // getSelectedProduct(productList, code){
    //     for (var i in productList){
    //         var v = productList[i];
    //         if (Array.isArray(v)){
    //             if (v[0] && v[0].Code == code){
    //                 return v[0];
    //             }
    //         }else{
    //             if (v.Code == code) {
    //                 return v;
    //             }
    //         }
    //     }
    // },
    //获取type的默认code
    // defaultProduct(productList, type){
    //     for(var i in productList){
    //         var v = productList[i];
    //         var info = v[0] ? v[0] : v;
    //         if(info.Type==type){
    //             return info;
    //         }
    //     }
    // },
    // isFut(code){
    //     // var pathName = window.location.pathname;
    //     // if (pathName.indexOf('/exchange')!=-1){
    //     //     return false;
    //     // }
    //     var product = FutTradeModel.getProduct(code);
    //     if (product) return true;
    //     else{
    //         var product = SpotTradeModel.getProduct(code);
    //         if (product) return false;
    //     }
    //     return this.clientFutCodes.indexOf(code)!=-1 ? true : false;
    // },
    // isCfd(code){
    //     return !!CfdTradeModel.getProduct(code);
    // },

    clearUserData(){
        SpotTradeModel.clearUserData();
        FutTradeModel.clearUserData();
        CfdTradeModel.clearUserData();
    },
    reload(){
        if (this.currProduct instanceof FutProduct){
            FutTradeModel.loadTradeData();
        }
    }
}
