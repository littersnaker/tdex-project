//cfd差价合约相关
import Decimal from '../utils/decimal';
import Event from '../core/event';

import WsMgr from '../net/WsMgr';
import {parseIBTradingHours} from "../utils/common"
import {CONST} from "../public/const"
import SysTime from "./system";
import Product, {CfdProduct} from "./product"
import AuthModel from "./auth";
import CfdFormula from "./cfd-formula";
import CfdOrderPos from "./cfd-order-position";
import Intl from "../intl";

export default {
    _appModel: null,
    _mgr: null,
    _productMap:{}, //code(有月份，唯一)对应的产品 1:1
    _symbolProductMap: {}, //symbol对应的产品列表 1:n
    _groupProducts: {}, //按类型分的产品列表
    _marginCurrencyCodes:{},//保证金货币类型对应的code列表
    _cidProductMap: {}, //产品ID的关联
    _priceMap:{}, //价格

    _myFavKey: 'cfd_favs',
    _myFavCodes: [],
    _loadedMyFav: false,
    _defFavCodes: [], //默认的自选

    _currCode: null,
    // _myCode: 'code',

    _defGroupSort: ["0", "2", "1", "3", "4"],
    _myGroupSort: null,
    _myGroupSortKey: 'cfd_gps',

    _setting: null,
    defaultSetting:{},
    formVar:{
        tabKey:"cfdTab",
        leverKey: "cfdLv",
        volumeKey: "cfdVol",
    },

    defaultPrices: {"ASK":0,"BID":0,"CLOSE":0,"HIGH":0,"LAST":0,"LOW":0,"OPEN":0,"VOL":0,"LastModify":0,"MEAN":0,"LAST_CHANGED": 0,
        "MARK":0, "INDEX":0, "change":0, "chg":0, "MID":0},

    rangePricePoint: 100, //止盈止损 触发价 滑点
    rangeTriggerPricePoint:200,  //触发价滑点
    rangeDelegatePricePoint:20, //委托价滑点

    _subTickGroupMap: {"0":[], "1":[]}, //保持tick订阅的所有group
    _contractCurrencyMap: {}, //合约的货币类型
    _currency: null, //默认的账户类型
    _crKey: 'cfd_cr',

    _isInitedListener:false,

    showMenuProduct: null, //菜单中点击子菜单用到

    init(appModel, mgr, initCallback){
        this._appModel = appModel;
        this._mgr = mgr;

        // this.initLoadSetting();

        //登录后加载订单等交易数据
        AuthModel.registerCfdTrade(this);

        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLang.bind(this));

        //加载产品列表
        this.initProductList(initCallback);

        CfdOrderPos.init(this, CfdFormula);
    },
    //公式
    formula: CfdFormula,
    // initLoadSetting(){
    //     if (this.setting) return;
    //
    //     var setting = AuthModel.loadPreference('cfd-setting', {});
    //     //defaultSetting新增属性时
    //     this.setting = Object.assign({}, this.defaultSetting, setting);
    // },
    initProductList(initCallback){
        this.adjustProductListData(Product.getCfdProductList());

        this.initSocketListener();

        if (initCallback) initCallback();
    },
    initSocketListener(){
        if (!this._isInitedListener){
            WsMgr.on('tick_cfd', this.onUpdatePrice.bind(this));
            WsMgr.on('contract_cfd', this.onUpdateProduct.bind(this));

            this._isInitedListener = true;

            // this.onUpdateProduct([{"Contracts":[{"Currency":1,"MaxAskPosition":25223,"MaxBidPosition":25223,"MaxVolume":0}],"Event":"Update","Month":"201903","Platform":1,"Symbol":"BCHUSD","Type":"Contract"}]);
        }
    },
    //调整产品列表数据
    adjustProductListData(data, isUpdate){
        var oldProductMap = this._productMap;

        this._productMap = {};
        this._groupProducts = {};
        // this._productList = [];
        this._symbolProductMap = {};
        this._marginCurrencyCodes = {};

        data.sort((a, b)=>{
            return a.Symbol <= b.Symbol ? -1 : 1;
        });

        for (var i=0,len=data.length; i<len; i++){
            var pitem = data[i];
            this.updateProduct(pitem, oldProductMap);
        }
        this.updateProductName();

        if (!AuthModel.checkUserAuth()) this.initMyFavCodes();
        else{
            if (isUpdate){
                this.initMyFavCodes();
                CfdOrderPos.buildPosition();
                CfdOrderPos.buildOrders();
            }
        }

        if (isUpdate && this._currCode) Event.dispatch(Event.EventName.PRODUCT_UPDATE);
    },
    updateProduct(pitem, oldProductMap){
        try{
            var symbol = pitem.Symbol;
            if (!symbol) return;

            var code = symbol + (pitem.Month ? `_${pitem.Month}` : '');

            var npitem = oldProductMap[code];
            if (npitem){
                npitem.update(pitem);
                //npitem = Object.assign(npitem, pitem);
            }else{
                npitem = new CfdProduct(pitem);
            }

            //前端先添加隐藏的属性
            if (!npitem.hasOwnProperty("Hide")){
                npitem.Hide = 0;
            }

            npitem.MinTick = Decimal.toFixed(pitem.MinTick);
            npitem.Group = String(pitem.Group);
            npitem.Code = code;
            // npitem.DisplayName = pitem.Name;
            npitem.PriceFixed = Decimal.getDotDigit(npitem.MinTick);
            npitem.VolFixed = 0;
            // npitem.VolumeMax = 1000000;
            if (pitem.MaxScale){
                npitem.LeverMax = Number(pitem.MaxScale);
            }else if(pitem.ATRLever && pitem.LeverCap){
                npitem.LeverMax = Math.min(pitem.ATRLever, pitem.LeverCap);
            }

            npitem.ScaleFixed = 2;
            npitem.UnitPrice = Decimal.digit2Decimal(Decimal.getDotDigit(npitem.MinTick));
            npitem.PriceMaxPoint = 1000000;
            npitem.PriceMax = 1000000;

            if (pitem.TradingHours){
                npitem.TradingDateTime = parseIBTradingHours(pitem.TradingHours);
            }
            // npitem.Name = code;
            // npitem.QueryCode = `${CONST.CODE.CFG}-${code}`;

            var contracts = pitem.Contracts;
            //测试
            // if (symbol=='DX') contracts.push({Coin: "ETH", Currency: 2, Multiplier: 0.000002, Margin: 0.0002});

            //注意：这里的Multiplier实际上是每点价值，
            contracts.forEach((v, i)=>{
                if (v.ID){
                    this._cidProductMap[v.ID] = {product: npitem, contract:v};
                    console.log(npitem.Name);
                }
                v.CalcFixed = 8;
                var coinInfo = Product.getCoinInfo(v.Currency);
                v.ShowFixed = coinInfo.ShowDigits;
                v.RealMultiplier = Decimal.accDiv(v.Multiplier, npitem.Pip);

                if (v.hasOwnProperty("MaxAskPosition") && v.hasOwnProperty("MaxBidPosition")){
                    v.VolumeMax = Math.min(Number(v.MaxAskPosition), Number(v.MaxBidPosition));
                }else{
                    v.VolumeMax = 1000000;
                }
                // if (!v.ID) v.ID = 1; //测试
                if (!this._contractCurrencyMap[v.Currency]){
                    this._contractCurrencyMap[v.Currency] = v.Coin;
                }
                if (!this._marginCurrencyCodes[v.Currency]){
                    this._marginCurrencyCodes[v.Currency] = [];
                }
                this._marginCurrencyCodes[v.Currency].push(code);
            });

            if (!npitem.price){
                var price = Object.assign({}, this.defaultPrices);
                npitem.price = price;
                this._priceMap[code] = price;
            }else{
                Object.assign(npitem.price, this._priceMap[code]);
            }

            this._productMap[code] = npitem;
            // this._productList.push(npitem);

            if (!npitem.Hide){
                var group = npitem.Group;

                if (!this._groupProducts[group]){
                    this._groupProducts[group] = [npitem];
                }else{
                    this._groupProducts[group].push(npitem);
                }
            }
            if (!this._symbolProductMap[symbol]){
                this._symbolProductMap[symbol] = [npitem];
            }else{
                this._symbolProductMap[symbol].push(npitem);
            }

            // if (pitem.Favorites){
            //     this._defFavCodes.push(code);
            // }
        }catch(e){
            console.log(pitem);
            console.error(e);
        }
    },
    //名字的显示
    updateProductName(){
        for (var code in this._productMap){
            var v = this._productMap[code];
            var products = this._symbolProductMap[v.Symbol];
            var name = Intl.getLang()=="zh-cn" ? v.Name : v.Symbol;
            if (products.length>1){
                v.DisplayName = v.Month ? name + '_' + v.Month.substr(-2) : name;
            }else{
                v.DisplayName = name;
            }
        }
    },
    onChangeLang(){
        this.updateProductName();

        Event.dispatch(Event.EventName.PRODUCT_UPDATE);

        CfdOrderPos.buildPosition();
        CfdOrderPos.buildOrders();
    },
    onUpdatePrice(data){
        if (this.testNoPrice) return;
        //self.isLoadingPrice = false;
        if (typeof data == "string") data = JSON.parse(data);

        var lastPriceUpdated = false;
        var priceUpdateMap = {};

        for (var i=0,l=data.length; i<l; i++){
            var v = data[i];
            if (!v) continue;

            var code = v.Code;
            var info = this._priceMap[code];
            var product = this._productMap[code];
            if (!info) continue;

            var oldLast = info.LAST;
            Object.assign(info, v);

            info.ASK = Number(info.ASK)<=0 ? 0 : Decimal.toFixed(info.ASK, product.PriceFixed);
            info.BID = Number(info.BID)<=0 ? 0 : Decimal.toFixed(info.BID, product.PriceFixed);

            var chgPrice;
            if (!info.LAST || !Number(info.LAST)){
                //中间价
                info.MID = Decimal.accMul(Math.floor(Decimal.accDiv(Decimal.accAdd(info.ASK, info.BID), Decimal.accMul(2, product.MinTick))), product.MinTick);
                chgPrice = info.MID;
            }else{
                chgPrice = info.LAST;
            }

            if (chgPrice && Number(chgPrice)>0){
                if(info.OPEN && Number(info.OPEN)>0){
                    info.CLOSE = info.OPEN;
                }
                else if (info.CLOSE && Number(info.CLOSE)>0){
                    if (!info.OPEN || Number(info.OPEN)<=0){
                        info.OPEN = info.CLOSE;
                    }
                }

                //涨跌额
                info.change = Decimal.accSubtr(chgPrice, info.CLOSE, (chgPrice).toString().indexOf('.')>0?(chgPrice).toString().length-(chgPrice).toString().indexOf('.')-1:0);
                //涨跌幅
                info.chg = Number(info.CLOSE)>0 ? Decimal.accMul(Decimal.accDiv(info.change, info.CLOSE), '100', 2) : 0;
            }

            //最新价有改变
            var isLastChange = Number(Decimal.accSubtr(info.LAST, oldLast));
            info.LAST_CHANGED = isLastChange;

            if (isLastChange){
                lastPriceUpdated = true;
            }

            priceUpdateMap[code] = info;
        }

        Event.dispatch(Event.EventName.PRICE_UPDATE, priceUpdateMap);

        //最新价更新，部分订单要重新计算
        if (lastPriceUpdated){
            CfdOrderPos.updateOrderList();
            CfdOrderPos.updatePositionList();
        }

    },
    //ws的产品列表通知更新
    onUpdateProduct(list){
        for (var i=0,l=list.length; i<l; i++){
            var product = list[i];
            var event = product.Event;
            product.Month = product.Month ? product.Month : "";
            var code = product.Symbol+(product.Month?"_"+product.Month:"");
            // code = code.replace(".", "_");
            delete product.Platform;
            delete product.Type;
            delete product.Event;

            if (event=='Create'){
                if (!this._productMap[code]){
                    Product.loadCfdProductList((data)=>{
                        this.adjustProductListData(data, true);
                    });
                    break;
                }
            }else if(event=='Update'){
                var oldProduct = this._productMap[code];
                if (oldProduct){
                    // var codes = code.split("_");
                    // product.Symbol = codes[0];
                    // product.Month = codes[1]||"";

                    var oldList = Product.getCfdProductList();
                    if (oldList) {
                        var index = oldList.findIndex(v => v.Symbol == product.Symbol && v.Month == product.Month);
                        if (index > -1){
                            var item = oldList[index];
                            if (product.Contracts){
                                product.Contracts.forEach(v=>{
                                    for (var m=0,ml=item.Contracts.length; m<ml; m++){
                                        var contract = item.Contracts[m];
                                        if (contract.Currency==v.Currency){
                                            delete v.MaxVolume;
                                            Object.assign(contract, v);
                                            break;
                                        }
                                    }
                                });

                                delete product.Contracts;
                            }

                            Object.assign(item, product);

                            this.adjustProductListData(oldList, true);
                        }
                    }
                }
            }else if(event=='Delete'){
                if (this._productMap[code]){
                    var oldProduct = this._productMap[code];
                    if (oldProduct){
                        // var codes = code.split("_");
                        // product.Symbol = codes[0];
                        // product.Month = codes[1]||"";
                        var oldList = Product.getCfdProductList();
                        if (oldList){
                            var index = oldList.findIndex(v=>v.Symbol==product.Symbol && v.Month==product.Month);
                            if (index > -1){
                                var item = oldList[index];
                                item.Hide = 1;
                                // oldList.splice(index, 1);
                                this.adjustProductListData(oldList, true);
                            }
                        }
                    }
                }
            }
        }
    },
    selectCode(code, updateMgr){
        if (updateMgr){
            var product = this.getProduct(code);
            if (product)this._mgr.setCurrProduct(product);
        }
        if (this._currCode!=code){
            if (this._currCode){
                var groups = this._getSubTickGroups();
                var product = this.getProduct(this._currCode);
                if (groups && product && groups.indexOf(product.Group)==-1){
                    WsMgr.unsubNewTicks(CONST.TRADE_TYPE.CFG, [this._currCode]);
                }
            }
            // else{
            //     this.subscribeWs();
            // }
            // this.saveSetting(this._myCode, code);

            WsMgr.subscribeNewTicks(CONST.TRADE_TYPE.CFG, [code]);
        }

        this._currCode = code;

        Event.dispatch(Event.EventName.PRODUCT_SELECT, code);
    },
    unselectCode(){
        // WsMgr.unsubNewContracts();
        if (this._currCode) WsMgr.unsubNewTicks(CONST.TRADE_TYPE.CFG, [this._currCode]);

        this._currCode = null;
    },
    //断线重连需重新订阅
    subscribeWs(isReconn){
        //订阅产品列表变化
        // WsMgr.subscribeNewContracts();

        if (isReconn){
            //以下只是断线重连才处理
            var codes = [];
            var groups = this._getSubTickGroups();
            groups.forEach((v)=>{
                var products = this.getProductsByGroup(v);
                products.forEach((pv)=>{
                    var code = pv.Code;
                    if (codes.indexOf(code)==-1){
                        codes.push(code);
                    }
                });
            });
            if (this._currCode && codes.indexOf(this._currCode)==-1){
                codes.push(this._currCode);
            }

            if (CfdOrderPos.positionCodes.length){
                CfdOrderPos.positionCodes.forEach(v=>{
                    if (codes.indexOf(v)==-1) codes.push(v);
                })
            }

            if (codes.length) WsMgr.subscribeNewTicks(CONST.TRADE_TYPE.CFG, codes);
        }
    },
    getCurrCode(){
        return this._currCode;
    },
    loadTradeData(){
        this.initMyFavCodes();

        CfdOrderPos.loadPosition();
        CfdOrderPos.loadOrders();
    },
    getProduct(code){
        return this._productMap[code];
    },
    getProductList(){
        return Object.values(this._productMap);
    },
    getCodeList(){
        return Object.keys(this._productMap);
    },
    isLoadedMyFav(){
        return this._loadedMyFav;
    },
    initMyFavCodes(){
        if (AuthModel.checkUserAuth()){
            AuthModel.loadUserFav((data)=>{
                this._loadedMyFav = true;
                if (data){
                    var list = [];
                    var delList = [];
                    var addList = [];
                    data.forEach(v=>{
                        if (this._productMap[v]){
                            if (list.indexOf(v)==-1) list.push(v);
                        }else{
                            delList.push(v);

                            var index = v.indexOf("_");
                            if (index!=-1){
                                var symbol = v.substr(0, index);
                                var sbList = this._symbolProductMap[symbol];
                                if (sbList){
                                    sbList.forEach(sbItem=>{
                                        if (list.indexOf(sbItem.Code)==-1 && !sbItem.Hide){
                                            list.push(sbItem.Code);
                                            addList.push(sbItem.Code);
                                        }
                                    });
                                }
                            }
                        }
                    });
                    this._myFavCodes = list;

                    if (delList.length) AuthModel.removeUserFav(delList);
                    if (addList.length) AuthModel.addUserFav(addList);

                }else{
                    this._myFavCodes = [].concat(this._defFavCodes);
                }
                Event.dispatch(Event.EventName.FAVORITE_UPDATE, 0);
            });
        }else{
            this._myFavCodes = [].concat(this._defFavCodes);
        }
    },
    addMyFavorite(code){
        if (this._myFavCodes.indexOf(code)==-1){
            this._myFavCodes.unshift(code);

            if (AuthModel.checkUserAuth()){
                if (!AuthModel.favs){
                    AuthModel.addUserFav(this._myFavCodes);
                }else{
                    AuthModel.addUserFav([code]);
                }
            }

            Event.dispatch(Event.EventName.FAVORITE_UPDATE, 1);
        }
    },
    removeMyFavorite(code){
        var ind = this._myFavCodes.indexOf(code);
        if (ind!=-1){
            this._myFavCodes.splice(ind, 1);

            if (AuthModel.checkUserAuth()){
                if (!AuthModel.favs){
                    AuthModel.addUserFav(this._myFavCodes);
                }else{
                    AuthModel.removeUserFav([code]);
                }
            }

            Event.dispatch(Event.EventName.FAVORITE_UPDATE, 2);
        }
    },
    _getSubTickGroups(){
        var aList = this._subTickGroupMap["0"];
        var bList = this._subTickGroupMap["1"];

        return [].concat(aList).concat(bList);
    },
    _getSubTickCodeMap(groups){
        var codeMap = {};
        groups.forEach(v=>{
            var products = this.getProductsByGroup(v);
            products.forEach(pv=>{
                if (!codeMap[pv.Code]){
                    codeMap[pv.Code] = 1;
                }else{
                    codeMap[pv.Code] += 1;
                }
            })
        });
        return codeMap;
    },
    //需要判断订阅时是否已有订阅
    subscribeTicksByGroup(group, isMenu){
        var key = String(isMenu?"1":"0");

        var realCodes = [];
        var groups = this._getSubTickGroups();
        if (groups.indexOf(group)==-1){
            var products = this.getProductsByGroup(group);
            var codeMap = this._getSubTickCodeMap(groups);
            realCodes = products.filter(v=>!codeMap[v.Code]).map(v=>v.Code);
            this._subTickGroupMap[key].push(group);
        }else{
            var aList = this._subTickGroupMap[key];
            if (aList.indexOf(group)==-1) aList.push(group);
        }
        // console.log("sub", this._subTickGroupMap[key]);

        // realCodes.push("aaaaa");
        if (realCodes.length) WsMgr.subscribeNewTicks(CONST.TRADE_TYPE.CFG, realCodes);
    },
    //需要判断退订时是否订阅过多次
    unsubTicksByGroup(group, isMenu){
        var key = String(isMenu?"1":"0");

        var revertKey = key=="0" ? "1" : "0";

        var realCodes = [];
        var aList = this._subTickGroupMap[revertKey];
        var bList = this._subTickGroupMap[key];
        if (aList.indexOf(group)==-1){
            var groups = this._getSubTickGroups();
            var index = bList.indexOf(group);
            if (index!=-1){
                var products = this.getProductsByGroup(group);
                var codeMap = this._getSubTickCodeMap(groups);
                //只订阅了一次，并且不是当前打开的code
                realCodes = products.filter(v=>codeMap[v.Code]==1 && v.Code!=this._currCode && CfdOrderPos.positionCodes.indexOf(v.Code)==-1).map(v=>v.Code);

                bList.splice(index, 1);
            }
        }else{
            var index = bList.indexOf(group);
            if (index!=-1){
                bList.splice(index, 1);
            }
        }
        // console.log("unsub", this._subTickGroupMap[key]);

        if (realCodes.length){
            WsMgr.unsubNewTicks(CONST.TRADE_TYPE.CFG, realCodes);
            realCodes.forEach((v)=>{
                var info = this._priceMap[v];
                Object.assign(info, this.defaultPrices);
            });
        }
    },
    unsubTicksCodes(codes){
        var groups = this._getSubTickGroups();
        var codeMap = this._getSubTickCodeMap(groups);
        var list = [];
        codes.forEach(v=>{
            if (!codeMap[v] && v!=this._currCode){
                list.push(v);
            }
        });
        if (list.length) WsMgr.unsubNewTicks(CONST.TRADE_TYPE.CFG, list);

    },
    searchFilter(filter, product){
        return product.Code.indexOf(filter.toUpperCase())!=-1 || product.Name.indexOf(filter)!=-1
    },
    getMyFavProducts(){
        return this._myFavCodes.filter(v=>!!this._productMap[v]).map((v)=>this._productMap[v]);
    },
    getMyFavCodes(){
        return this._myFavCodes;
    },
    isMyFavorite(symbol){
        return this._myFavCodes.indexOf(symbol)!=-1;
    },
    getMyGroupSort(){
        if (!this._myGroupSort){
            var sort = this.loadSetting(this._myGroupSortKey);
            if (sort){
                //防止有新增的group
                this._defGroupSort.reduce((coll, item)=>{
                    if (coll.indexOf(item)==-1) coll.push(item);
                    return coll;
                }, sort);

                this._myGroupSort = sort;
            }else{
                this._myGroupSort = [].concat(this._defGroupSort);
            }
        }
        return this._myGroupSort;
    },
    saveMyGroupSort(sort){
        this._myGroupSort = sort;

        this.saveSetting(this._myGroupSortKey, sort);
    },
    getGroupProducts(){
        return this._groupProducts;
    },
    getProductsByGroup(group){
        if (group==0){
            return this.getMyFavProducts();
        }else{
            return this._groupProducts[group];
        }
    },
    getProductByCID(cid){
        return this._cidProductMap[cid];
    },
    getCurrencyMap(){
        return this._contractCurrencyMap;
    },
    getCurrency(){
        if (!this._currency){
            this._currency = AuthModel.loadPreference(this._crKey, CONST.CURRENCY.BTC);
        }
        return this._currency;
    },
    getCurrencySymbol(currency){
        var sb = this._contractCurrencyMap[currency];
        if (sb) return sb;
    },
    checkSupportCurrency(code, currency){
        var codes = this._marginCurrencyCodes[currency];
        if (codes && codes.indexOf(code)!=-1) return true;
        return false;
    },
    getSymbolProducts(symbol){
        return this._symbolProductMap[symbol];
    },
    setCurrency(currency){
        this._currency = currency;

        AuthModel.savePreference(this._crKey, currency);

        Event.dispatch(Event.EventName.MARGIN_CURRENCY_UPDATE, currency);
    },
    initLoadSetting(){
        if (this._setting) return;

        var setting = AuthModel.loadPreference('cfd-setting', {});
        //defaultSetting新增属性时
        this._setting = Object.assign({}, this.defaultSetting, setting);
    },
    saveSetting(key, value){
        this.initLoadSetting();

        if (typeof(value)=="object" || this._setting[key]!=value){
            this._setting[key] = value;

            AuthModel.savePreference('cfd-setting', this._setting);
        }
    },
    getProductContract(product, currency){
        var contracts = product.Contracts;
        var contract = contracts.filter(v=>v.Currency==currency);
        if (contract.length) return contract[0];
    },
    getTradingTimeStatus(product){
        if (product && product.Group==2) return {status: true, time:[]};

        var info = {status: false, time:[]};
        var tradingDateTime = product.TradingDateTime;
        if (tradingDateTime){
            var now = SysTime.getServerTimeStamp();

            var prevStartTime = 0;
            var prevEndTime = 0;
            for (var i=0,l=tradingDateTime.length; i<l; i++){
                var dt = tradingDateTime[i];
                if (dt && dt.length==2){
                    var startTime = dt[0].unix();
                    var endTime = dt[1].unix();
                    if (now >=startTime && now<=endTime){
                        info.status = true;
                        info.time = [startTime, endTime];
                        return info;
                    }
                    //获取下次开始时间
                    if (now>prevEndTime && now < startTime){
                        info.status = false;
                        info.time = [startTime, endTime];
                        return info;
                    }
                    prevStartTime = startTime;
                    prevEndTime = endTime;
                }
            }
        }
        return info;
    },
    getLeverOptions(product){
        var options = [1,2,3,5,10,15,20];
        if (product){
            var max = product.LeverMax;
            if (max > 50){
                var count = 1;
                var scale = 50;
                var points = 9 - Math.ceil(max/scale);
                if (points < options.length){
                    options = [1,5,10,20];
                }

                while (max > scale){
                    options.push(scale);
                    scale = (++count)*50;
                }
                options.push(max);
            }else if(max > 20){
                options.push(max);
            }else{
                while (options[options.length-1]>=max){
                    options.pop();
                }
                options.push(max);
            }
        }
        return options;
    },
    checkFormData(formData, canUse, product, contract){
        var result = {ok:true, error:[]};
        if (formData.Volume<=0){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Volume"));
            return result;
        }
        if (canUse<=0){
            result.ok = false;
            result.error.push(Intl.lang("server.status.1010"));
            return result;
        }

        if (formData.Price){
            // const {product, contract} = this.getProductByCID(formData.CID);
            if (product && contract){
                //orderFee(isLmt, side, volume, lever, multiplier, pip, feePoint, priceInfo, delegatePrice, scale)
                var total = this.formula.orderFee(formData.Price>0, formData.Side, formData.Volume, formData.Scale, contract.Multiplier, product.Pip, product.Fee, product.price, formData.Price)
                if (total && Number(total)>0){
                    if (canUse < total){
                        result.ok = false;
                        result.error.push(Intl.lang("trade.openError.feeNotEnough", Decimal.format(total, contract.ShowFixed)+ ' '+contract.Coin, Decimal.format(canUse, contract.ShowFixed)+ ' '+contract.Coin));
                        return result;
                    }
                }
            }
        }

        if (!formData.Scale){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Scale"));
            return result;
        }

        if (formData.SL){
            this.checkFormDataSL(formData, result);
            if (!result.ok) return result;
        }
        if (formData.TP){
            this.checkFormDataTP(formData, result);
            if (!result.ok) return result;
        }

        //入市的
        if (!formData.Better){
            this.checkFormDataEntry(formData, result);
            if (!result.ok) return result;
        }

        return result;
    },
    checkFormDataEntry(formData, result){
        result = result || {ok:true, error:[]};
        if (formData.Price===null){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Price"));
            return result;
        }
        if (formData.Constant===null){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Constant"));
            return result;
        }
        if (formData.TimelyParam===null){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.TimelyParam"));
            return result;
        }
    },
    checkFormDataSL(formData, result){
        result = result || {ok:true, error:[]};
        if (isNaN(formData.SL.Param) || !formData.SL.Param){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.SLParam"));
            return result;
        }
        if (formData.Side==CONST.FUT.Side.BUY){
            if (formData.SL.Distance && formData.SL.Param>=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slbuy1"));
            }else if(!formData.SL.Distance && formData.SL.Param >= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slbuy0"));
            }
        }else{
            if (formData.SL.Distance && formData.SL.Param<=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slsell1"));
            }else if(!formData.SL.Distance && formData.SL.Param <= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slsell0"));
            }
        }
        return result;
    },
    checkFormDataTP(formData, result){
        result = result || {ok:true, error:[]};
        if (isNaN(formData.TP.Param) || !formData.TP.Param){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.TPParam"));
            return result;
        }
        if (formData.Side==CONST.FUT.Side.BUY){
            if (formData.TP.Distance && formData.TP.Param<=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpbuy1"));
            }else if(!formData.TP.Distance && formData.TP.Param <= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpbuy0"));
            }
        }else{
            if (formData.TP.Distance && formData.TP.Param>=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpsell1"));
            }else if(!formData.TP.Distance && formData.TP.Param >= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpsell0"));
            }
        }
        return result
    },
    loadSetting(key){
        this.initLoadSetting();

        return this._setting[key] || this.defaultSetting[key];
    },
    mgr(){
        return this._mgr;
    },
    clearUserData(){
        this._loadedMyFav = false;
        this._myFavCodes = [];
        CfdOrderPos.clearUserData();
    }
}
