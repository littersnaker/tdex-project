import events from 'events'
const emitter = new events.EventEmitter;
emitter.setMaxListeners(22);

export default {
    EventName: {
        LOGIN_SUCCESS: 'LoginSucess', //登陆成功
        PRICE_UPDATE: "PriceUpdate", //价格更新
        DEPTH_UPDATE: "DepthUpdate", //价格深度更新
        TRADE_UPDATE: "TradeUpdate", //成交订单簿更新
        PRODUCT_UPDATE: 'ProductUpdate', //产品更新
        // PRODUCT_PRICE_UPDATE: "ProductPriceUpdate",
        // PRODUCT_DEPTH_UPDATE: "ProductDepthUpdate",
        // PRODUCT_TRADE_UPDATE: "ProductTradeUpdate",
        PRODUCT_SELECT: "ProductSelect", //选中产品
        ORDER_UPDATE: 'OrderUpdate',  //现货订单更新
        // FUT_ORDERMARGIN_UPDATE: 'FutOrderMarginUpdate', //订单保证金改变
        PRICE_SELECT: 'PriceSelect',//选中价格
        NEWMAIL_UPDATE: 'MailNewUpdate', //新邮件数目改变
        LANG_SELECT: 'LangSelect', //选择语言
        WALLET_UPDATE: 'WalletUpdate', //钱包更新,
        WALLET_TOTAL_UPDATE: 'WallletTotalUpdate', //钱包计算出来的总数更新
        PAY_UPDATE: 'PayUpdate', //支付状态改变
        TRADE_EVENT_UPDATE: 'TradeEventUpdate', //交易事件更新
        // FUT_PRODUCT_PRICE_UPDATE: "FutProductPriceUpdate",
        // FUT_PRODUCT_DEPTH_UPDATE: "FutProductDepthUpdate",
        // FUT_PRODUCT_TRADE_UPDATE: "FutProductTradeUpdate",
        FUT_ORDER_UPDATE: 'FutOrderUpdate', //期货订单更新
        FUT_ORDERRANK_UPDATE: 'FutOrderRankUpdate', //期货减仓排名变化通知
        NETWORK_UPDATE: 'NetworkUpdate', //网络状态改变
        SETTING_UPDATE: 'SettingUpdate', //设置改变
        //LOGIN_SUCCESS: 'LoginSuccess',
        CHANGE_VOLUME: 'ChangeVolume', //修改交易量
        VERSION_UPDATE: 'VersionUpdate', //桌面版的版本更新
        SET_SHARED: 'SetShared', //设置是全仓还是逐仓
        SET_MERGED: 'SetMerged', //设置自动合并仓位
        EXCHANGERATE_UPDATE: 'ExchangeRateUpdate', //汇率变化
        MINING_UPDATE: 'MiningUpdate', //挖矿精灵变化
        SIMULATE_AWARD: 'SimulateAward', //用户发放奖励后通知
        SIMULATE_RECV: 'SimulateRecv', //提示领取奖励
        IS_ONEKEY_TRADE: 'IsOneKeyTrade', //是否一键交易
        MESSAGE_NOTE: 'MessageNote', // 消息标记全部已读
        MESSAGE_REMARK: 'MessageRemark', // 消息标记已读
        MSG_TRANSFER_OVER: 'MsgTransferComplete',   // 转帐交易完成
        FAVORITE_UPDATE: 'FavoriteUpdate', //自选的更新
        CFD_ORDER_UPDATE: 'CfdOrderUpdate', //cfd订单更新
        CFD_ORDERRANK_UPDATE: 'CfdOrderRankUpdate', //期货减仓排名变化通知
        MARGIN_CURRENCY_UPDATE: 'MarginCurrencyUpdate', //保证金货币类型改变
    },
    winList: [],
    unUseIndexs: [],
    // winMap:{},
    eventMap: {},
    winCount: 0,
    timerMap:{},
    timeoutMap:{},
    getWinKey: function(winObj){
        var ind = this.winList.indexOf(winObj);
        if (ind!=-1){
            return ind;
        }else{
            if (this.unUseIndexs[0]){
                ind = this.unUseIndexs.shift();
                if (this.winList[ind]==null){
                    this.winList[ind] = winObj;
                    return ind;
                }
            }
            return this.winList.push(winObj) - 1;
        }
    },
    findWinKey: function(winObj){
        var ind = this.winList.indexOf(winObj);
        return ind;
    },
    addListener(name, listener, obj){
        if (obj) {
            var key = this.getWinKey(obj);
            if (!this.eventMap[key]) {
                this.eventMap[key] = [];
            }
            this.eventMap[key].push({name: name, listener: listener});
        }
        emitter.on(name, listener);
        console.log("add event "+name+":"+emitter.listenerCount(name));
    },
    //只监听一次的
    addOnce(name, listener, obj){
        var newListener = (data)=>{
            if (listener) listener(data);
            this.removeListener(name, newListener);
        };

        this.addListener(name, newListener, obj);
    },
    dispatch(name, data){
        //console.log(name+" dispatch");
        emitter.emit(name, data);
    },
    removeListener(name, listener){
        console.log("remove event1 "+name);
        emitter.removeListener(name, listener);
    },
    removeListeners(obj){
        var key = this.findWinKey(obj);
        if (key >= 0){
            var list = this.eventMap[key];
            if (list){
                for (var i=0,len=list.length; i<len; i++){
                    var item = list[i];
                    emitter.removeListener(item.name, item.listener);
                    console.log("remove event2 "+item.name+":"+emitter.listenerCount(item.name));
                }
                delete this.eventMap[key];
                this.winList[key] = null;
                this.unUseIndexs.push(key);
            }
        }
    },
    setTimer: function(callback, interval, winObj, isTimeout){
        var timer;
        if (!isTimeout) {
            timer = setInterval(callback, interval);
            this.timerMap[timer] = winObj;
        }else{
            timer = setTimeout(callback, interval);
            this.timeoutMap[timer] = winObj;
        }

        return timer;
    },
    clearTimer: function(timer, isTimeout){
        if (!isTimeout){
            clearInterval(timer);
            delete this.timerMap[timer];
        }else{
            clearTimeout(timer);
            delete this.timeoutMap[timer];
        }
    },
    clearAllTimer:function(winObj){
        for (var timer in this.timerMap){
            if (this.timerMap[timer] == winObj){
                clearInterval(timer);
                delete this.timerMap[timer];
            }
        }

        for (var timer in this.timeoutMap){
            if (this.timeoutMap[timer] == winObj){
                clearTimeout(timer);
                delete this.timeoutMap[timer];
            }
        }
    }
};
