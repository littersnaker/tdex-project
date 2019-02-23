import createWs from './ws';
import {WS_NEW_URL} from '../config';
import {isEmptyObject} from '../utils/util';
import TradeMgr from '../model/trade-mgr';
import Event from '../core/event';
import Notification from '../utils/notification';
import Intl from '../intl';
import {CONST} from "../public/const";

export default {
    clientId: new Date().getTime(),
    eventNames: ['open', 'close', 'error', 'reopen', 'wallet', 'online', 'pay',
        'forward', 'kline',
        //现货交易事件
        'tick', 'depth','trade', 'orders',
        //期货交易事件
        'tick_fut', 'depth_fut', 'trade_fut', 'orders_fut', 'contract', 'futures',
        'futures_index', 'futures_order', 'futures_position',
        //挖矿精灵事件
        'mining_open', 'mining_close', 'mining_autoclose',
        //模拟本金发送后 通知领取模拟金
        'user_award',  'activity_claim',
        //用户信息
        'user_message',
        //增加一个 USER_WALLET_FREEZE，用于更新未解锁的 TD、TD赠送(明明钱包更新接口可以做的，又搞多一个)
        'user_wallet_freeze',
        //
        'user_vip',
        //cfd交易事件
        'tick_cfd', 'kline_cfd', 'contract_cfd', 'cfd_index', 'cfd_order', 'cfd_position'
    ],
    eventMap: {},
    tickKeyPart: '_MARKET_TICKER',
    klineKeyPart: "_KLINE_",
    depthKeyPart: "_DEPTH_",      //深度
    tradeKeyPart: "_TRADE_DATA",  //最新成交
    accountKeyPart:"ACCOUNT_INFO_UPDATE",
    forwardKeyPart:"_FORWARD_TRADE",    //汇率等
    contractKeyPart: "_CONTRACT_DATA",
    newTickKey: "ticker",
    newKlineKey: "kline",
    newContractKey:"contract",
    newAccountKey: "user",

    // futuresDataKey: "ALL_FUTURES_DATA",
    //汇率换算用
    forwardCodes:["BTCUSD", "ETHUSD", "USDCNH", "USDTCNY"],
    maxDepth: 30,
    maxVolume: 46,
    unsubKlineData: null, //订阅前先退订
    unsubAllKlinesData:[], //多个订阅k线数据 (首页用到)
    unsubDepthData: null,
    unsubTradeData: null,
    // unsubAccountData: null,
    unsubContractData: null,

    SpotTradeModel: null,     //现货
    futSpotTradeModel: null, //期货
    accountModel:null, //
    authModel: null,
    isReconing: false,
    isOpened: false,

    isLogined: false,
    accountParam: {"uid": "", "time":0, "token":"", "version": process.env.REACT_APP_API_VERSION},
    klineStypeMap:{}, //type: ASK|BID|LAST
    // klineStypes: ["ASK", "BID", "LAST"],
    // secCountMap: {}, //计算每秒钟接收数据

    tickKeyMap:{
        'ask': 'ASK',
        'bid': 'BID',
        'close': 'CLOSE',
        'high': 'HIGH',
        'last': 'LAST',
        'low': 'LOW',
        'time': 'LastModify',
        'open': 'OPEN',
        'vol': ['VOL', 'VOL_24h'],
        'meanPrice': 'MEAN', //最近一小时的分钟均价的均价
    },
    connect(){
        if (this.ws) return;

        // this.SpotTradeModel = SpotTradeModel;

        var ws = createWs(WS_NEW_URL);
        if (ws){
            ws.on('open', this._onOpon.bind(this));
            ws.on('close', this._onClose.bind(this));
            ws.on('message', this._onMessage.bind(this));
            ws.on('error', this._onError.bind(this));
            ws.on('reconnect', this._onReconnect.bind(this));
            ws.doOpen();

            console.log("websocket doOpen");
        }
        this.ws = ws;
        // this.secPrint();
    },
    isSupport(){
        return !!this.ws;
    },
    // secPrint(){
    //      setInterval(()=>{
    //          console.log("ws receive: "+JSON.stringify(this.secCountMap));
    //          this.secCountMap = {};
    //     }, 1000);
    // },
    setSpotTradeModel(SpotTradeModel) {
        this.SpotTradeModel = SpotTradeModel;
    },
    setFutSpotTradeModel(futSpotTradeModel) {
        this.futSpotTradeModel = futSpotTradeModel;
    },
    setAccountModel(accountModel){
        this.accountModel = accountModel;
    },
    _onOpon(){
        // console.log('WsMgr.onOpen');
        this.isOpened = true;

        // var code = TradeMgr.getCurrCode();
        // if (code){
            //请求期货列表
            // this.subscribeFuturesData();

        this.reqAllTick();
        this.subscribeForward();
        this.subscribeNewContracts();

        if (this.accountParam.uid) this.loginNewWs();
        // this.subscribeKline(code, '1MIN');

        //重连成功，刷新交易信息及账户余额信息
        if (this.isReconing){
            var model = TradeMgr.getCurrModel();
            if (model) model.subscribeWs(true);

            if (this.accountParam.uid){
                TradeMgr.reload();
                if (this.accountModel)this.accountModel.loadBalances();
            }
            this.isReconing = false;
            Notification.success(Intl.lang("error.websocket.reconOK"));
        }
        // }

        Event.dispatch(Event.EventName.NETWORK_UPDATE, {open:true});
        this._onCallEvent('open');
    },
    isOpen(){
        return this.isOpened;
    },
    _onClose(){
        console.log('close');

        Event.dispatch(Event.EventName.NETWORK_UPDATE, {open:false});
        this._onCallEvent('close');
    },
    _onReconnect(){
        if (!this.isReconing) Notification.error(Intl.lang("error.websocket.recon"));

        this.isReconing = true;
        this._reset();

        console.log('reconnecting');
    },
    _onError(err){
        console.log(err);

        this._reset();

        this._onCallEvent('error', err);
    },
    _onMessage(data){
        // if (window.location.search.indexOf("debug")!=-1){
        //     return;
        // }
        if (typeof(data)!='object'){
            console.log(data)
            return;
        }
        if (data.status && data.status!="success"){
            // console.error(data);

            var subbed = data.subbed;
            if (subbed && subbed.indexOf(this.accountKeyPart)!=-1 && data.msg && data.msg.toLowerCase().indexOf("token")!=-1){
                // this.subscribeAccountError();
            }else{
                console.log(data);
            }
            return;
        }
        //新协议
        if (data.event && data.event=="error"){
            if (data.channel="login" && data.error_code && ["40003", "40004"].indexOf(data.error_code)!=-1){
                this.loginError();
                return;
            }

            console.log(data);
            return;
        }

        //新协议
        var table = data.table;
        if (table){
            if (table==`cfd/${this.newTickKey}`){
                if (!data.data) return;

                var newData = data.data.filter(v=>v && v.symbol).map(v=>{
                    var tick = this._parseTickData(v);
                    tick.Code = v.symbol;
                    tick.TradeType = CONST.TRADE_TYPE.CFG;
                    return tick;
                });
                this._onCallEvent('tick_cfd', newData);
            }else if(table.indexOf(`cfd/${this.newKlineKey}`)!=-1){
                var list = data.data;
                if (!list) return;

                var period = table.replace(`cfd/${this.newKlineKey}/`, '');
                list.forEach(v=>{
                    if (!v) return;
                    var newData = {data:v.data};
                    newData.symbol = `cfd/${v.symbol}`;
                    newData.period = period;
                    newData.stype = "LAST";
                    this._onCallEvent('kline_cfd', newData);
                });
            }else if(table==`cfd/${this.newContractKey}`){
                var list = data.data;
                if (!list) return;

                this._onCallEvent('contract_cfd', list);
            }else if(table==this.newAccountKey){
                var list = data.data;
                list.forEach(info=>{
                    var event = info.event.toLowerCase();
                    //console.log(data);
                    //console.log(JSON.stringify(data));
                    if (this.eventNames.indexOf(event)!=-1){
                        var evtData = info.data ? info.data : null;
                        if (evtData){
                            try{
                                var jsonData = JSON.parse(evtData);
                                this._onCallEvent(event, jsonData);
                            }catch (e){
                                this._onCallEvent(event, evtData);
                            }
                        }
                        else{
                            console.error(info);
                        }
                    }else{
                        console.error("ws account Event " + event + " not use");
                    }

                })
            }

            return;
        }

        var ch = data.ch;
        if (ch){
            // if (!this.secCountMap[ch]){
            //     this.secCountMap[ch] = 1;
            // }else{
            //     this.secCountMap[ch] += 1;
            // }
            if (ch.indexOf(this.tickKeyPart)!=-1){
                if (!data.ticker) return;

                var symbol = ch.replace(this.tickKeyPart, "");

                var tick = data.ticker;
                var newTick = this._parseTickData(tick);
                newTick.symbol = symbol;
                var newData = {};
                newData[symbol] = newTick;

                if (data.stype){
                    this.klineStypeMap[symbol] = data.stype;
                }

                if (TradeMgr.isFut(symbol)){
                    this._onCallEvent('tick_fut', newData);
                }else{
                    this._onCallEvent('tick', newData);
                }
            }else if(ch.indexOf(this.forwardKeyPart)!=-1){
                if (!data.trade || !data.trade.LAST_PRICE) return;

                var newData = {last: data.trade.LAST_PRICE};
                var symbol = ch.replace(this.forwardKeyPart, '');
                newData.symbol = symbol;

                this._onCallEvent('forward', newData);
            }else if(ch.indexOf(this.depthKeyPart)!=-1){
                if (!data.depth) return;
                //console.log(data);
                var symbol = ch.split(this.depthKeyPart)[0];
                var depth = data.depth;
                var newDepth = {};

                var keyMap = {"depthask":{"pkey":"ASK", "vkey":"AVOL"}, "depthbid":{"pkey":"BID", "vkey":"BVOL"}};
                // var maxVol = 0;
                for (var key in keyMap){
                    var keyInfo = keyMap[key];
                    if (depth[key]){
                        var lists = depth[key].split(',');
                        for (var i=0,l=this.maxDepth; i<l; i++){
                            var v = lists[i];
                            if (v){
                                var pv = v.split('=');
                                if (pv[0] && pv[1]){
                                    newDepth[keyInfo.pkey+(i+1)] = pv[0];
                                    newDepth[keyInfo.vkey+(i+1)] = pv[1];
                                    // maxVol = Math.max(maxVol, Number(pv[1]));
                                    continue;
                                }
                            }
                            newDepth[keyInfo.pkey+(i+1)] = 0;
                            newDepth[keyInfo.vkey+(i+1)] = 0;
                        }
                    }else{
                        for (var i=0,l=this.maxDepth; i<l; i++){
                            newDepth[keyInfo.pkey+(i+1)] = 0;
                            newDepth[keyInfo.vkey+(i+1)] = 0;
                        }
                    }
                }
                var newData = {};
                // newDepth.VOL_MAX = maxVol;
                newData[symbol] = newDepth;
                if (TradeMgr.isFut(symbol)){
                    this._onCallEvent('depth_fut', newData);
                }else{
                    this._onCallEvent('depth', newData);
                }
                //console.log(newData);
            }else if(ch.indexOf(this.klineKeyPart)!=-1){
                if (!data.kline) return;

                var newData = {data:data.kline};
                var info = ch.split(this.klineKeyPart);
                if (data.stype){
                    this.klineStypeMap[info[0]] = data.stype;
                }
                newData.symbol = info[0];
                newData.period = info[1];
                newData.stype = this.klineStypeMap[info[0]];

                // if (data.kline.length>100) return;

                //time,open,close,low,high,vol
                this._onCallEvent('kline', newData);
            }else if(ch.indexOf(this.tradeKeyPart)!=-1){
                if (!data.trade) return;

                var newData = {data:data.trade};
                var symbol = ch.replace(this.tradeKeyPart, '');
                newData.symbol = symbol;

                if (TradeMgr.isFut(symbol)){
                    this._onCallEvent('trade_fut', newData);
                }else{
                    this._onCallEvent('trade', newData);
                }
            }else if(ch.indexOf(this.accountKeyPart)!=-1){
                // console.log(data);
                var event = data.event.toLowerCase();
                //console.log(data);
                //console.log(JSON.stringify(data));
                if (this.eventNames.indexOf(event)!=-1){
                    var evtData = data.content ? data.content.Data : null;
                    if (!evtData){
                        evtData = data.content ? data.content : "";
                        //if (!evtData) return;

                        this._onCallEvent(event, evtData);
                    }
                    else{
                        try{
                            var jsonData = JSON.parse(evtData);
                            this._onCallEvent(event, jsonData);
                        }catch (e){
                            this._onCallEvent(event, evtData);
                        }
                    }
                }else{
                    console.error("ws account Event " + event + " not use");
                }
            }else if(ch.indexOf(this.contractKeyPart)!=-1){
                if (!data.contract) return;

                var newData = {data:data.contract};
                delete newData.symbol;
                if (!isEmptyObject(newData)){
                    var symbol = ch.replace(this.contractKeyPart, '');
                    newData.symbol = symbol;

                    this._onCallEvent('contract', newData);
                }
            }
            // else if(ch == this.futuresDataKey){
            //     this._onCallEvent('futures', data);
            // }
        }else if (data.rep){
            // if (!this.secCountMap[data.rep]){
            //     this.secCountMap[data.rep] = 1;
            // }else{
            //     this.secCountMap[data.rep] += 1;
            // }
            if (data.rep == "All_MARKET_TICKER"){
                var tickers = data.tickers;
                if (!tickers) return;

                var newData = {};
                var newFutData = {};
                for (var i=0,l=tickers.length; i<l; i++){
                    var tick = tickers[i];
                    var newTick = this._parseTickData(tick);
                    if (TradeMgr.isFut(tick.symbol)){
                        newFutData[tick.symbol] = newTick
                    }else{
                        newData[tick.symbol] = newTick;
                    }
                    this.subscribeTick(tick.symbol);
                }
                if (!isEmptyObject(newData)) this._onCallEvent('tick', newData);
                if (!isEmptyObject(newFutData)) this._onCallEvent('tick_fut', newFutData);
            }
            else if(data.rep.indexOf(this.klineKeyPart)!=-1){
                if (!data.kline) return;

                var newData = {data:data.kline};
                var info = data.rep.split(this.klineKeyPart);
                // this.subscribeKline(info[0], info[1]);
                if (data.stype){
                    this.klineStypeMap[info[0]] = data.stype;
                }
                newData.symbol = info[0];
                newData.period = info[1];
                newData.stype = this.klineStypeMap[info[0]];

                this._onCallEvent('kline', newData);
            }
        }
    },
    _parseTickData(tick){
        var newTick = {};
        for (var key in tick){
            var newKey = this.tickKeyMap[key];
            if (newKey){
                var t = typeof(newKey);
                if (t=='string'){
                    newTick[newKey] = tick[key];
                }else if(t=='object'){
                    newKey.forEach(v=>{
                        newTick[v] = String(Number(tick[key]));
                    });
                }
            }
        }
        return newTick;
    },
    _reset(){
        this.unsubKlineData = null; //订阅前先退订
        this.unsubDepthData = null;
        this.unsubTradeData = null;
        this.unsubAccountData = null;
        this.unsubContractData = null;
        this.isOpened = false;
    },
    on(name, handler){
        if (this.eventNames.indexOf(name)!=-1){
            if (!this.eventMap[name]){
                this.eventMap[name] = [handler];
            }else if(this.eventMap[name].indexOf(handler)==-1){
                this.eventMap[name].push(handler);
            }
        }
    },
    off(name, handler){
        var handlers = this.eventMap[name];
        if (handlers){
            var i = handlers.indexOf(handler);
            if (i!=-1) handlers.splice(i);
        }
    },
    _onCallEvent(name, data){
        if (this.eventMap[name]){
            var list = this.eventMap[name];
            for (var i=0,l=list.length; i<l; i++){
                // var startTime = new Date().getTime();
                list[i](data);
                // var useTime = new Date().getTime()-startTime;
                // console.log("call "+name+" "+useTime+"ms: "+(name=='contract' ? JSON.stringify(data) : ''));
            }
        }
    },
    subscribeTick(code){
        if (!this.ws) return;

        this.ws.emit({"id": this.getClientId(), "sub": code + this.tickKeyPart});
    },
    subscribeNewTicks(tradeType, codeList){
        if (!this.ws) return;

        var codes = codeList.map(v=>{
            var type = this.getType(tradeType);
            return `${type}/${this.newTickKey}:${v}`
        });
        this.ws.emit({"op":"subscribe", "args": codes});
    },
    unsubNewTicks(tradeType, codeList){
        if (!this.ws) return;

        var codes = codeList.map(v=>{
            var type = this.getType(tradeType);
            return `${type}/${this.newTickKey}:${v}`
        });

        this.ws.emit({"op":"unsubscribe", "args": codes});
    },
    //订阅产品列表变化
    subscribeNewContracts(){
        if (!this.ws) return;

        this.ws.emit({"op":"subscribe", "args": ["cfd/"+this.newContractKey]});
    },
    unsubNewContracts(){
        if (!this.ws) return;

        this.ws.emit({"op":"unsubscribe", "args": ["cfd/"+this.newContractKey]});
    },
    getType(tradeType){
        var map = {
            [CONST.TRADE_TYPE.CFG]:'cfd',
            [CONST.TRADE_TYPE.FUT]:'futures',
            [CONST.TRADE_TYPE.SPOT]:'spot',
        }
        return map[Number(tradeType)];
    },
    // subscribeFuturesData(){
    //     if (!this.ws) return;
    //
    //     this.ws.emit({"id": this.getClientId(), "sub": this.futuresDataKey})
    // },
    getKlineStype(code){
        return this.klineStypeMap[code];
    },
    // getKlineStypeList(){
    //     return this.klineStypes;
    // },
    reqAllTick(){
        if (!this.ws) return;

        this.ws.emit({"id": this.getClientId(), "req": "All_MARKET_TICKER"});
    },
    ////req:$symbol_SWITCH_%type        type= BID|ASK|LAST
    //切换k线数据类型
    switchKlineStype(info, type){
        if (!this.ws || !type) return;

        const {entry, symbol} = info;
        if (this.klineStypeMap[symbol]==type) return;

        type = type.toUpperCase();
        var reqType = symbol + "_SWITCH_" + type;
        this.ws.emit({"id": this.getClientId(), "req": reqType});

        this.klineStypeMap[symbol] = type;
    },
    //订阅单个
    subscribeKline(info, period, cnt){ //唯一
        if (!this.ws) return;

        const {prefix, entry, symbol} = info;
        if (this.unsubKlineData){
            this.ws.emit(this.unsubKlineData);
            this.unsubKlineData = null;
        }

        if (entry==CONST.TRADE_TYPE.CFG){
            var data = {"op": "subscribe", "args": [`${prefix}${this.newKlineKey}/${period}:${symbol}`]};
            this.ws.emit(data);

            var newData = JSON.parse(JSON.stringify(data));
            newData.op = "unsubscribe";
            this.unsubKlineData = newData;
        }else{
            var subKey = symbol + this.klineKeyPart + period;
            //1MIN, 5MIN, 15MIN, 30MIN, 60MIN, DAY, WEEK
            var data = {"id": this.getClientId(), "sub": subKey, cnt};
            this.ws.emit(data);

            var newData = JSON.parse(JSON.stringify(data));
            newData.unsub = data.sub;
            delete newData.sub;
            this.unsubKlineData = newData;
        }
    },
    unsubKline(info, period){
        if (!this.ws) return;

        if (this.unsubKlineData){
            this.ws.emit(this.unsubKlineData);
            this.unsubKlineData = null;
        }

        // const {prefix, entry, symbol} = info;
        // if (entry==CONST.TRADE_TYPE.CFG){
        //     var data = {"op": "unsubscribe", "args": [`${prefix}${this.newKlineKey}/${period}:${symbol}`]};
        //     this.ws.emit(data);
        // }else{
        //
        // }
    },
    //订阅多个
    subscribeAllKline(codes, period, cnt){
        if (!this.ws) return;

        codes.forEach((code)=>{
            var subKey = code + this.klineKeyPart + period;
            var data = {"id": this.getClientId(), "sub": subKey};
            if (cnt) data.cnt = cnt;
            this.ws.emit(data);

            var newData = JSON.parse(JSON.stringify(data));
            newData.unsub = data.sub;
            delete newData.sub;
            this.unsubAllKlinesData.push(newData);
        });
    },
    unsubAllKline(){
        if (!this.ws) return;

        this.unsubAllKlinesData.forEach((v)=>{
            this.ws.emit(v);
        });
        this.unsubAllKlinesData = [];
    },
    reqKline(code, period, from, to){
        if (!this.ws) return;

        var subKey = code + this.klineKeyPart + period;

        var data = {"id": this.getClientId(), "req": subKey};

        // var showCount = 500;
        // if (!from || !to){
        //     if (period.indexOf('MIN')!=-1){
        //         var num = parseInt(period.replace('MIN', ''));
        //         to = new Date().getTime();
        //         from = new Date().getTime() - showCount*num*60*1000;
        //     }else if(period == 'DAY'){
        //         to = new Date().getTime();
        //         from = new Date().getTime() - showCount*num*24*60*60*1000;
        //     }else if(period == 'WEEK'){
        //         to = new Date().getTime();
        //         from = new Date().getTime() - showCount*num*7*24*60*60*1000;
        //     }
        //     if (from && to){
        //         from = parseInt(from/1000);
        //         to = parseInt(to/1000);
        //     }
        // }
        data.from = from;
        data.to = to;
        // data.cnt = showCount;

        this.ws.emit(data);
    },
    subscribeDepth(code, depthNum){ //每次都唯一
        if (!this.ws) return;

        var type = depthNum!==undefined ? "DATA" + depthNum : "DATA";
        var subKey = code + this.depthKeyPart +type;

        if (this.unsubDepthData && this.unsubDepthData.unsub == subKey) return;

        this._unsubDepth();
        //DATA, DATA1, DATA2, DATA3, DATA4, DATA5


        var data = {"id": this.getClientId(), "sub": subKey, "cnt": this.maxDepth};

        //console.log(data);
        this.ws.emit(data);

        var newData = JSON.parse(JSON.stringify(data));
        newData.unsub = data.sub;
        delete newData.sub;
        this.unsubDepthData = newData;
    },
    unsubDepth(code){
        if (!this.ws) return;

        if (this.unsubDepthData && this.unsubDepthData.unsub.indexOf(code)!=-1) this._unsubDepth();
    },
    _unsubDepth(){
        if (this.unsubDepthData){ //有订阅先退订
            this.ws.emit(this.unsubDepthData);

            this.unsubDepthData = null;
        }
    },
    subscribeForward(){
        if (!this.ws) return;

        for (var i=0,l=this.forwardCodes.length; i<l; i++){
            this.ws.emit({"id": this.getClientId(), "sub": this.forwardCodes[i] + this.forwardKeyPart});
        }
    },
    subscribeTrade(code){
        if (!this.ws) return;

        var subKey = code + this.tradeKeyPart;
        if (this.unsubTradeData && this.unsubTradeData.unsub == subKey) return;

        this._unsubTrade();

        //1MIN, 5MIN, 15MIN, 30MIN, 60MIN, DAY, WEEK
        var data = {"id": this.getClientId(), "sub": subKey, "cnt":this.maxVolume};

        //console.log(data);
        this.ws.emit(data);

        var newData = JSON.parse(JSON.stringify(data));
        newData.unsub = data.sub;
        delete newData.sub;
        this.unsubTradeData = newData;
    },
    unsubTrade(code){
        if (!this.ws) return;

        if (this.unsubTradeData && this.unsubTradeData.unsub.indexOf(code)!=-1){
            this._unsubTrade();
        }
    },
    _unsubTrade(){
        if (this.unsubTradeData){
            this.ws.emit(this.unsubTradeData);

            this.unsubTradeData = null;
        }
    },
    loginNewWs(){
        // this.ws.emit({"op": "login", "args": [String(this.accountParam.uid), "", this.accountParam.token, String(this.accountParam.time), String(this.accountParam.version)]});
        this.ws.emit({"op": "login", "args": [String(this.accountParam.uid), "", this.accountParam.token, String(this.accountParam.time), String(this.accountParam.version)]});

        this.isLogined = true;
    },
    logoutNewWs(){
        if (this.isLogined){
            this.isLogined = false;

            this.ws.emit({"op": "logout", "args": [String(this.accountParam.uid), ""]});
        }
    },
    loginError(){
        this.isLogined = false;

        if (this.authModel){
            this.authModel.loadUserToken();
        }
    },
    // subscribeAccount(){
        // this.unsubscribeAccount();
        //
        // this.accountParam.id = this.getClientId();
        // this.accountParam.sub = this.accountKeyPart;
        // this.ws.emit(this.accountParam);
        //
        // var data = this.accountParam;
        // var newData = JSON.parse(JSON.stringify(data));
        // newData.unsub = data.sub;
        // delete newData.sub;
        // this.unsubAccountData = newData;

        // this.loginNewWs();
    // },
    // subscribeAccountError(){
    //     // if (this.unsubAccountData){
    //     //     this.unsubAccountData = null;
    //     // }
    //     if (this.authModel){
    //         this.authModel.loadUserToken();
    //     }
    // },
    subscribeContract(code){
        if (!this.ws) return;

        var subKey = code + this.contractKeyPart;
        if (this.unsubContractData && this.unsubContractData.unsub == subKey) return;

        this._unsubContract();

        //1MIN, 5MIN, 15MIN, 30MIN, 60MIN, DAY, WEEK
        var data = {"id": this.getClientId(), "sub": subKey};

        this.ws.emit(data);

        var newData = JSON.parse(JSON.stringify(data));
        newData.unsub = data.sub;
        delete newData.sub;
        this.unsubContractData = newData;
    },
    unsubContract(code){
        if (!this.ws) return;

        if (this.unsubContractData && this.unsubContractData.unsub.indexOf(code)!=-1) this._unsubContract();
    },
    _unsubContract(){
        if (this.unsubContractData){
            this.ws.emit(this.unsubContractData);

            this.unsubContractData = null;
        }
    },
    // unsubscribeAccount(){
    //     if (this.unsubAccountData){
    //         this.ws.emit(this.unsubAccountData);
    //         this.unsubAccountData = null;
    //     }
    // },
    afterLogined(authModel, token, time, uid){
        if (this.accountParam.token!=token){
            this.authModel = authModel;
            this.updateToken(token, time);
            // this.accountParam.mytradeid = mytradeid;
            this.accountParam.uid = uid;

            //更新上面数据时不重新订阅
            if (this.isOpen() && !this.isLogined){
                this.loginNewWs();
            }
        }
    },
    updateToken(token, time){
        this.accountParam.token = token;
        this.accountParam.time = Number(time);
    },
    logout(){
        this.logoutNewWs();

        //this.unsubscribeAccount();
        this.accountParam = {"uid": "", "time":0, "token":""};
    },
    getClientId(){
        this.clientId++;
        return String(this.clientId);
    }
};
