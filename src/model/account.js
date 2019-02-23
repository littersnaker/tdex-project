//保存用户账号相关数据及业务内容
import history from '../core/history';

import Decimal from '../utils/decimal';
import {CONST} from "../public/const"
import Event from "../core/event";
import Net from "../net/net"
import GlobalStore from '../stores';
import TradeMgr from './trade-mgr';
import FutTradeModel from './fut-trade';
import CfdTradePos from './cfd-order-position';
import WsMgr from '../net/WsMgr';
import {getCurrencySymbol} from '../utils/common'
import Product from './product';
import {IS_SIMULATE_TRADING, IS_ENGINE_TRADING} from '../config'
import Intl from "../intl";
import {setStorage} from "../utils/util";

export default {
    // walletCurrencys: [], //钱包的货币排序
    // statCurrencys:[], //需要资产统计总数
    _isInited: false,
    rechargeBankList: null,
    withdrawalsBankList: null,
    provinceList: null,
    cityMap: null,
    ////类型。1 - 期货 2 - 现货
    WalletMap: {
        [CONST.WALLET.TYPE.FUT]: {},
        [CONST.WALLET.TYPE.SPOT]: {},
        [CONST.WALLET.TYPE.CFD]:{},
    }, //用户钱包信息
    WalletTotal:{}, //总资产折合BTC
    // Assects: null,      // 资产信息
    sysAddressMap: null,
    userAddressMap: null,
    ProductCoins: null,    // 钱包产品列表

    isOpenTDFee: true, //是否启用TD抵扣手续费
    tradeFee: null, //交易手续费折扣

    init() {
        if (this._isInited){
            return;
        }
        //CONST.CURRENCY.BTC, CONST.CURRENCY.ETH
        // var productList = TradeMgr.getProductList();
        // for (var i=0,l=productList.length; i<l; i++){
        //     var product = productList[i];
        //     product = product[0] ? product[0] : product;
        //     if (TradeMgr.isFut(product.Code)) continue;
        //
        //     // var priceInfo = product.price;
        //     const fromCode = product.fromCode;
        //     const toCode = product.toCode;
        //     var fromCurrency = CONST.CURRENCY[fromCode];
        //     var toCurrency = CONST.CURRENCY[toCode];
        //     if (!fromCurrency || !toCurrency) continue;
        //
        //     if (!this.WalletTotal[toCurrency]){
        //         this.WalletTotal[toCurrency] = {TA:0, AA:0, to:toCode};
        //     }
        //     if (this.walletCurrencys.indexOf(toCurrency)==-1){
        //         this.walletCurrencys.push(toCurrency);
        //     }
        //     if (this.walletCurrencys.indexOf(fromCurrency)==-1){
        //         this.walletCurrencys.push(fromCurrency);
        //     }
        // }

        // var map = Product.getCoinCurrencyMap();
        // for (var currency in map){
        //     // if (!this.WalletTotal[currency]){
        //     //     this.WalletTotal[currency] = {TA:0, AA:0, to:toCode};
        //     // }
        //     if (this.walletCurrencys.indexOf(currency)==-1){
        //         this.walletCurrencys.push(currency);
        //     }
        // }

        // Event.addListener(Event.EventName.PRICE_UPDATE, this.calcWalletTotal.bind(this, false));
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onWalletUpdate.bind(this));
        Event.addListener(Event.EventName.FUT_ORDER_UPDATE, this.onWalletUpdate.bind(this));
        Event.addListener(Event.EventName.CFD_ORDER_UPDATE, this.onWalletUpdate.bind(this));
        // Event.addListener(Event.EventName.FUT_ORDERMARGIN_UPDATE, this.onUpdateOrderMargin.bind(this));
        // WsMgr.on('wallet', this.updateWalletInfo.bind(this));
        WsMgr.setAccountModel(this);
        WsMgr.on('wallet', this.updateWalletMap.bind(this));
        WsMgr.on('pay', this.updatePay.bind(this));
        WsMgr.on('user_wallet_freeze', this.onWalletFreeze.bind(this));

        //模拟盘发放模拟金
        if (IS_SIMULATE_TRADING || IS_ENGINE_TRADING){
            //提示领取模拟金
            WsMgr.on("activity_claim", this.onRecvAward.bind(this));
            //用户发放奖励后
            WsMgr.on("user_award", this.onUserAward.bind(this));
        }
        this.loadBalances();

        this._isInited = true;
    },
    onRecvAward(data){
        Event.dispatch(Event.EventName.SIMULATE_RECV, data);
    },
    onUserAward(data){
        var uInfo = GlobalStore.getUserInfo();
        setStorage("simulateMoney_"+uInfo.Uid, 100, true);

        Event.dispatch(Event.EventName.SIMULATE_AWARD);
        console.log(data);
    },
    // 所有余额
    loadBalances(){
        // var balances, tradeBalance;

        // const update = ()=>{
        //     var newList = balances.map((v, i)=>{
        //         // if (v.Type==CONST.WALLET.TYPE.FUT && v.Currency==CONST.CURRENCY.BTC && tradeBalance){
        //         //     return tradeBalance;
        //         // }
        //         return v;
        //     });
        //     this.updateWalletInfo(newList);
        // }

        this._loadBalances((data)=>{
            this.updateWalletInfo(data);
        });

        // this.loadTradeBalance(CONST.WALLET.TYPE.FUT, CONST.CURRENCY.BTC, (data)=>{
        //     tradeBalance = data;
        //     if (balances){
        //         update();
        //     }
        // });
    },
    _loadBalances(callback){
        Net.httpRequest("wallet/balances", {Type:0}, (data)=>{
            if (data.Status==0){
                if (callback) callback(data.Data.List);
            }
        }, this);
    },
    //加载实时的
    loadTradeBalance(Type, Currency, callback){
        Net.httpRequest("wallet/balance", {Type, Currency}, (data)=>{
            if (data.Status==0){
                if (callback) callback(data.Data);
            }
        }, this);
    },
    onWalletUpdate(){
        this.calcWalletTotal();
        this.commonDispatch();
    },
    //初始化钱包信息列表
    updateWalletInfo (list) {
        if (list) {
            list.forEach((walletInfo, i)=>{
                try{
                    var type = walletInfo.Type;
                    var currency = walletInfo.Currency;

                    this.updateCurrencyWallet(walletInfo);

                    if(this.WalletMap[type]) this.WalletMap[type][currency] = walletInfo;
                }catch (e) {
                    console.log(e);
                }
            });

            for (var type in this.WalletMap){
                var info = this.WalletMap[type];
                if (!info[CONST.CURRENCY.BTC]){
                    info[CONST.CURRENCY.BTC] = {Available: 0,
                        Currency: CONST.CURRENCY.BTC,
                        Deposit: 0,
                        Lock: 0,
                        Quantity: 0,
                        Status: 0,
                        Transfer: 0,
                        Type: type,
                        Unconfirm: 0,
                        Withdraw: 0,
                        freeze:0, canUse:0, gross:0, net:0};
                }
            }

            this.onWalletUpdate();
        }
    },
    // TD-Free 金额添加到 TD 上
    // setTdGift(tdFree){
    //     if(!tdFree.Quantity&&!tdFree.Lock) return false;
    //
    //     var list = this.WalletMap;
    //     for (var i in list){
    //         var item = list[i];
    //         if(item.Currency==11){
    //             if(tdFree.Lock){
    //                 item.Lock = Decimal.accAdd(item.Lock, tdFree.Lock);
    //             }
    //             if(tdFree.Quantity){
    //                 item.Gift = tdFree.Quantity;
    //             }
    //         }
    //     }
    //     return list;
    // },
    commonDispatch(){
        // this.calcWalletTotal(true);
        this.loadDiscountFee();

        GlobalStore.updateUserWalletInfo(this.WalletMap);

        Event.dispatch(Event.EventName.WALLET_UPDATE, this.WalletMap);
    },
    //需分开账号
    updateCurrencyWallet(walletInfo){
        //Quantity 数量
        //Unconfirm 未确认数
        //Withdrawals提现冻结数
        //Transfer转账东结数
        //Deposit保证金

        //余额=净资产-盈亏
        //净资产=已用+可用
        //比例=净资产/已用

        // Currency	uint32币种
        // Quantity	float64 总量。包含 Unconfirm
        // Unconfirm	float64币种。未确认量
        // Withdraw	float64提现冻结
        // Transfer	float64转账冻结
        // Deposit	float64保证金冻结
        //净资产 可用+已用+盈亏=净资产

        // var currency = walletInfo.Currency;
        // var oldInfo = this.WalletMap[currency];
        var keyList = ["PL", "Deposit", "Margin", "Transfer", "Withdraw", "Lock", "Unconfirm", "Quantity", "Available"];
        keyList.forEach((v)=>{
            if (!walletInfo.hasOwnProperty(v)) walletInfo[v] = 0;
        });

        // 期货
        var sVal = 0;
        var deposit = walletInfo.Deposit;
        if (walletInfo.Type==CONST.WALLET.TYPE.FUT || walletInfo.Type==CONST.WALLET.TYPE.CFD){
            sVal = Decimal.accSubtr(walletInfo.Deposit, walletInfo.Margin);
            deposit = walletInfo.Margin;
        }
        // 冻结
        walletInfo.freeze = parseFloat(Decimal.accAdd(Decimal.accAdd(Decimal.accAdd(Decimal.accAdd(walletInfo.Transfer, deposit),walletInfo.Withdraw), walletInfo.Lock), walletInfo.Unconfirm));
        //可用
        walletInfo.canUse = parseFloat(Decimal.accAdd(Decimal.accSubtr(walletInfo.Quantity, walletInfo.Unconfirm), sVal));
        //总资产
        walletInfo.gross = parseFloat(Decimal.accAdd(walletInfo.freeze, walletInfo.canUse));
        //净资产net
        if (walletInfo.Type==CONST.WALLET.TYPE.FUT || walletInfo.Type==CONST.WALLET.TYPE.CFD){
            //期货
            // //可用 减去占用的保证金
            // if (walletInfo.hasOwnProperty("Margin") && Number(walletInfo.Margin)>0){
            //     walletInfo.canUse = Math.max(parseFloat(Decimal.accSubtr(Decimal.accAdd(walletInfo.canUse, walletInfo.Deposit), walletInfo.Margin)), 0);
            // }
            //净资产net 盈亏
            walletInfo.net = parseFloat(Decimal.accAdd(walletInfo.gross, walletInfo.PL));
        }else{
            //净资产net
            walletInfo.net = parseFloat(walletInfo.gross);
        }


        // var currency = walletInfo.Currency;
        // if (currency==CONST.CURRENCY.BTC){
        //     var oldInfo = this.WalletMap[currency];
        //     walletInfo.Margin = walletInfo.Margin ? walletInfo.Margin : (oldInfo ? (oldInfo.Margin||0) : 0);
        //     walletInfo.PositionMargin = walletInfo.PositionMargin ? walletInfo.PositionMargin : (oldInfo ? (oldInfo.PositionMargin||0) : 0);
        //     walletInfo.orderMarginTotal = walletInfo.orderMarginTotal ? walletInfo.orderMarginTotal : (oldInfo ? (oldInfo.orderMarginTotal||0) : 0);
        //
        //     walletInfo.PL = walletInfo.PL ? walletInfo.PL : (oldInfo ? (oldInfo.PL||0) : 0);
        //     walletInfo.PL_M = walletInfo.PL_M ? walletInfo.PL_M : (oldInfo ? (oldInfo.PL_M||0) : 0);
        //     //总资产
        //     walletInfo.TA = parseFloat(Decimal.accAdd(walletInfo.Quantity, walletInfo.Deposit));
        //     //可用
        //     walletInfo.AA = parseFloat(Decimal.accSubtr(walletInfo.TA, walletInfo.Margin));
        //     //净NA
        //     walletInfo.NA = parseFloat(Decimal.accAdd(walletInfo.TA, walletInfo.PL));
        //     //冻结
        //     walletInfo.UA = parseFloat(Decimal.accAdd(Decimal.accAdd(walletInfo.Margin, walletInfo.Withdraw), walletInfo.Transfer));
        // }else{
        //     var oldInfo = this.WalletMap[currency];
        //     walletInfo.OrderMargin = walletInfo.OrderMargin ? walletInfo.OrderMargin : (oldInfo ? (oldInfo.OrderMargin||0) : 0);
        //     walletInfo.PL = walletInfo.PL ? walletInfo.PL : (oldInfo ? (oldInfo.PL||0) : 0);
        //     walletInfo.PL_M = walletInfo.PL_M ? walletInfo.PL_M : (oldInfo ? (oldInfo.PL_M||0) : 0);
        //     //冻结
        //     walletInfo.UA = parseFloat(Decimal.accAdd(Decimal.accAdd(Decimal.accAdd(Decimal.accAdd(walletInfo.Deposit, walletInfo.OrderMargin), walletInfo.Withdraw), walletInfo.Transfer), walletInfo.Lock));
        //     //可用
        //     walletInfo.AA = parseFloat(Decimal.accSubtr(walletInfo.Quantity, walletInfo.OrderMargin));
        //     //总资产
        //     walletInfo.TA = parseFloat(Decimal.accAdd(walletInfo.Quantity, walletInfo.UA));
        //     //净NA
        //     walletInfo.NA = parseFloat(Decimal.accAdd(walletInfo.TA, walletInfo.PL));
        // }
        // walletInfo.NA = Decimal.accAdd(Decimal.accAdd(walletInfo.Deposit, walletInfo.Quantity), walletInfo.YK);

        // walletInfo.A_RATE = !walletInfo.UA ? '--' : parseFloat(Decimal.accMul(Decimal.accDiv(walletInfo.NA, walletInfo.UA), 100));
    },
    onWalletFreeze(data){
        //{"11":{"Lock":601010}}
        if (data){
            var list = [];
            for (var key in data){
                var info = data[key];
                var wallet = {Type:CONST.WALLET.TYPE.SPOT, Id:Number(key)};
                Object.assign(wallet, info);
                list.push(wallet);
            }
            if (list.length) this.updateWalletMap(list);
        }
    },
    updateWalletMap(data){
        // {"AboutID":10603266049,"Action":2007,"Coin":1,"Event":"Update","ID":7340033,"Margin":"0.0000365225","NewMargin":"0.0010217137",
        // "NewVolume":"999999.9989782863","OldMargin":"0.0009851912","OldVolume":"999999.9990148088","Type":"Wallet","Volume":"-0.0000365225"}
        // console.log(data);
        //{"spot":{"1":{"Deposit":"0","Quantity":"20","Unconfirm":0}}}
        // console.log("wallet:"+ JSON.stringify(data));
        // if (!this.WalletMap) return;

        // for (var currency in data){
        //     var newInfo = data[currency];
        //     var walletInfo = this.WalletMap[currency];
        //     if (walletInfo){
        //         Object.assign(walletInfo, newInfo);
        //         if (currency!=CONST.CURRENCY.BTC) this.updateCurrencyWallet(walletInfo);
        //     }
        // }
        data.forEach((currencyInfo,i)=>{
            var currency = currencyInfo.Id;
            var type = currencyInfo.Type;

            delete currencyInfo.Id;
            delete currencyInfo.Code;

            currencyInfo.Currency = Number(currency);
            // currencyInfo.Type = type;

            var oldInfo = this.WalletMap[type][currency]||{};
            Object.assign(oldInfo, currencyInfo);

            this.updateCurrencyWallet(oldInfo);

            this.WalletMap[type][currency] = oldInfo;
        });

        this.onWalletUpdate();
    },
    updatePay(data){
        Event.dispatch(Event.EventName.PAY_UPDATE, data);
    },
    calcTradeData(){
        var tradeTypes = [CONST.WALLET.TYPE.FUT, CONST.WALLET.TYPE.CFD];

        tradeTypes.forEach(v=>{
            var walletTypeInfo = this.WalletMap[v];
            if (walletTypeInfo){
                if (v==CONST.WALLET.TYPE.FUT){
                    for (var currency in walletTypeInfo){
                        var walletInfo = walletTypeInfo[currency];
                        if (walletInfo){
                                walletInfo.PositionMargin = walletInfo.Deposit;
                                walletInfo.OrderMargin = FutTradeModel.orderMarginTotal[currency]||0;
                                for (var cid in FutTradeModel.plTotal){
                                    const pl = FutTradeModel.plTotal[cid];
                                    var product = FutTradeModel.productIdMap[cid];
                                    var pc = product.Currency;
                                    if (pc ==currency){
                                        walletInfo.PL = pl ? Number(pl.pl) : 0;
                                    }else{
                                        walletInfo.PL = 0;
                                    }
                                }

                                //暂时一种产品对应一种钱包的货币，产品的逐仓和全仓对应钱包的货币
                                walletInfo.Margin = Number(Decimal.accAdd(walletInfo.OrderMargin, walletInfo.PositionMargin));
                                //全仓方式下 保证金总数需要加上仓位的
                                //                        FutTradeModel.isSharedByCid(cid) ?  : walletInfo.OrderMargin
                                this.updateCurrencyWallet(walletInfo);
                        }
                    }
                }else if(v==CONST.WALLET.TYPE.CFD){
                    for (var currency in walletTypeInfo){
                        var walletInfo = walletTypeInfo[currency];
                        if (walletInfo){
                            walletInfo.OrderMargin = CfdTradePos.orderMarginTotal[currency]||0;
                            walletInfo.PositionMargin = walletInfo.Deposit;

                            var pl = CfdTradePos.plTotal[currency];
                            walletInfo.PL = pl ? Number(pl.pl) : 0;
                            // walletInfo.PositionMargin = pl ? Number(pl.margin) : 0;

                            //暂时一种产品对应一种钱包的货币，产品的逐仓和全仓对应钱包的货币
                            walletInfo.Margin = Number(Decimal.accAdd(walletInfo.OrderMargin, walletInfo.PositionMargin));
                            //全仓方式下 保证金总数需要加上仓位的
                            this.updateCurrencyWallet(walletInfo);
                        }
                    }
                }
            }
        });
    },
    //计算钱包中
    calcWalletTotal() {
        this.calcTradeData();

        //把所有转成btc
        var currencys = [CONST.CURRENCY.BTC];

        var noExchange = 0
        for (var type in this.WalletMap){
            var currencyWalletMap = this.WalletMap[type];

            this.WalletTotal[type] = {};
            for (var currency in currencyWalletMap){
                if (currency==CONST.CURRENCY["TD-Freeze"]) continue;

                var walletInfo = currencyWalletMap[currency];

                currencys.forEach((v)=>{
                    if (!this.WalletTotal[type][v]) this.WalletTotal[type][v] = {Currency:v, gross:0};

                    if (walletInfo.gross > 0){
                        if (currency==v){
                            this.WalletTotal[type][v].gross = parseFloat(Decimal.accAdd(this.WalletTotal[type][v].gross, walletInfo.gross));
                        }else{
                            var hasProduct = false;
                            var newCurrency = currency==CONST.CURRENCY.USDT ? CONST.CURRENCY.USD : currency;
                            // var newCurrency = currency;

                            var from = getCurrencySymbol(newCurrency);
                            var to = getCurrencySymbol(v);
                            if (from && to) {
                                var codeList = [from.sn + to.sn, to.sn + from.sn];
                                for (var i=0,l=codeList.length; i<l; i++){
                                    var code = codeList[i];
                                    var price = TradeMgr.getForwardPrice(code);
                                    if (!price || !Number(price)){
                                        var product = TradeMgr.getProduct(code);
                                        if (product && product.price && product.price.LAST) {
                                            price = product.price.LAST;
                                        }
                                    }

                                    if (price && Number(price)) {
                                        hasProduct = true;
                                        var nGross = i==0 ? Decimal.accMul(walletInfo.gross, price) : Decimal.accDiv(walletInfo.gross, price);
                                        this.WalletTotal[type][v].gross = parseFloat(Decimal.accAdd(this.WalletTotal[type][v].gross, nGross));

                                        break;
                                    }
                                }

                                if (!hasProduct){
                                    noExchange++;
                                }
                            }
                        }
                    }
                });
            }
        }

        if (noExchange){
           this.WalletTotal = {};
           return false;
        }
    },
    getCurrencyWallet(type, currency){
        var info = this.getWalletInfo(type);
        if (info && info[currency]){
            return info[currency]
        }
    },
    getWalletInfo(type) {
        if (this.WalletMap[type]) return this.WalletMap[type];
    },
    getWalletMap(){
        return this.WalletMap;
    },
    getWalletTotal(){
        return this.WalletTotal;
    },
    // 获取银行信息
    getBankInfo: function(bankId){
        return window.BankMap[bankId];
    },
    getWithdrawalsBankList() {
        if (this.withdrawalsBankList == null) {
            var list = [], BankMap = window.BankMap;
            for (var id in BankMap) {
                var item = BankMap[id];
                if ((item.Flag & 1) > 0) {
                    item.id = id;
                    list.push(item);
                }
            }
            this.withdrawalsBankList = list;
        }

        return this.withdrawalsBankList;
    },
    getProvinceList() {
        if (this.provinceList == null) {
            var provincelist = [];
            var cityMap = {};
            let ProvinceMap = window.ProvinceMap
            for (var id in ProvinceMap) {
                var item = ProvinceMap[id];
                var data = {Name: item.Name, Code: id};
                provincelist.push(data);

                if (item.CityMap) {
                    var clist = [];
                    for (var cid in item.CityMap) {
                        clist.push({Name: item.CityMap[cid], Code: cid});
                    }
                    cityMap[id] = clist;
                }
            }

            this.provinceList = provincelist;
            this.cityMap = cityMap;
        }
        return this.provinceList;
    },
    getCityList(province) {
        if (this.cityMap == null) {
            this.getProvinceList();
        }

        return this.cityMap[province];
    },
    //跳转到支付界面
    redirectPay(currency) {
        history.replace('/recharge?currency='+currency);
    },

    // 获取 资产信息
    // getWalletView(listener, winObj) {
    //     var self = this;
    //     Net.httpRequest("wallet/view", "", function (data) {
    //         if (data.Status == 0) {
    //             var info = data.Data;
    //             self.Assects = info;
    //             self.setWalletAddress(info);
    //
    //             if (listener) listener(data);
    //         }
    //     }, winObj);
    // },
    setWalletAddress(data) {
        if (data.SystemAddressList) {
            let sysList = data.SystemAddressList;
            this.setSysAddressList(sysList);
        }
        if (data.UserAddressList) {
            let userList = data.UserAddressList;
            this.setUserAddressList(userList);
        }
    },
    setSysAddressList(sysList) {
        this.sysAddressMap = {};
        for (let i in sysList) {
            let type = sysList[i].Type;
            if(type==2){
                this.sysAddressMap[6] = sysList[i];
            }
            this.sysAddressMap[type] = sysList[i];
        }
    },
    setUserAddressList(userList) {
        this.userAddressMap = {};
        for (let i in userList) {
            let type = userList[i].Type;
            if (!this.userAddressMap[type]) {
                this.userAddressMap[type] = [];
            }
            this.userAddressMap[type].push(userList[i])
        }
    },
    getSysAddressList(type) {
        if (this.sysAddressMap) {

            return type ? this.sysAddressMap[type] : this.sysAddressMap;
        }
    },
    // getSystemCard() {
    //     if (this.Assects) {
    //         return this.Assects.SystemCard ? this.Assects.SystemCard : null;
    //     }
    // },
    getUserAddressList(type) {
        if (this.userAddressMap) {
            return type ? this.userAddressMap[type] : this.userAddressMap;
        }
    },
    // 获取 充值地址
    // walletReqAddress(type, listener, winObj) {
    //     var self = this;
    //     var data = {Type: parseInt(type)};
    //     Net.httpRequest("wallet/reqAddress", data, function (data) {
    //         if (data.Status == 0) {
    //             self.setSysAddressList(data.Data.List);
    //             if (listener) listener(data.Data);
    //         }
    //     }, winObj);
    // },
    // getWalletMap(type){
    //     if(this.Assects){
    //         return type ? this.Assects.WalletMap[type] : this.Assects.WalletMap;
    //     }
    // },
    switchLang(lang, listener, winObj){
        var self = this;

        var data = {"Lang":lang};
        Net.httpRequest("user/switchLang", data, function(data){
            if (listener) listener(data);
        }, winObj);
    },

    loadProductCoins(params, listener){
        var list = Product.getCoinList();
        if (list.length){
            this.ProductCoins = list;
            if (listener) listener({List: this.ProductCoins});
        }
    },
    loadUserVip(callback, winObj){
        Net.httpRequest("user/vip", null, data =>{
            if (data.Status == 0){
                if (callback)callback(data.Data);
            }
        }, winObj);
    },
    getProductCoins(currency){
        if(this.ProductCoins){
            return currency ? this.ProductCoins[currency] : this.ProductCoins;
        }
    },
    clearUserData(){
        this.WalletMap[CONST.WALLET.TYPE.FUT] = {};
        this.WalletMap[CONST.WALLET.TYPE.SPOT] = {};

        TradeMgr.clearUserData();
        this._isInited = false;
    },

    filterProducts(pList, bit){ // type 1:recharge, 2:with, 3:transfer
        if(pList){
            var newPlist = [];
            for(var i in pList){
                if(pList[i].Op & bit){
                    newPlist.push(pList[i]);
                }
            }
            return newPlist;
        }
    },
    //未开启使用TD抵扣手续费， 已开启但没有TD 0.10
    //开启并有赠送的TD 0.00
    //开启并只有正常TD 0.05
    loadDiscountFee(){
        var isOpen = this.isOpenTDFee;
        var spotWallet = this.WalletMap[CONST.WALLET.TYPE.SPOT];

        var data = {maker:{base:'0.10'}, taker:{base:'0.10'}};
        if (spotWallet){
            var tdf = spotWallet[CONST.CURRENCY["TD-Freeze"]];
            var td = spotWallet[CONST.CURRENCY.TD];
            if (isOpen && tdf && tdf.TA>0){
                data.maker.discount = '0.00';
                data.taker.discount = '0.00';
            }else if(isOpen && td && td.TA>0){
                data.maker.discount = '0.05';
                data.taker.discount = '0.05';
            }
        }
        this.tradeFee = data;
    },
    getDiscountFee(){
        return this.tradeFee;
    }
}
