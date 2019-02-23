import Intl from "../intl";
import Decimal from "../utils/decimal";
import SysTime from "./system";
import {CONST} from "../public/const";
import {getCurrencySymbol} from "../utils/common";
import Notification from "../utils/notification";
import Net from "../net/net";
import Product from "./product";
import Event from "../core/event";
import moment from "moment/moment";
import WsMgr from '../net/WsMgr';

export default {
    _tradeModel: null,
    _formula: null,
    baseOrders:[], //接口返回的原订单数据
    basePositions:[], //接口返回的原仓位数据

    positions:{},
    positionList:[],

    orderList:[],

    //统计相关
    positionStat:{},
    plTotal:{},
    orderMarginTotal:{},

    positionCodes:[],

    VariableTxtMap:{
        0: 'LAST',
        1: 'MARK',
        2: 'BID',
        3: 'ASK'
    },

    init(tradeModel, formula){
        this._tradeModel = tradeModel;
        this._formula = formula;

        //订单变化
        WsMgr.on('cfd_order', this.onUpdateOrderData.bind(this));
        WsMgr.on('cfd_position', this.onUpdatePositionData.bind(this));
        WsMgr.on('cfd_index', this.onUpdateRank.bind(this));
    },

    loadPosition(){
        Net.httpRequest("cfd/position", "", (data)=>{
            if (data.Status == 0){
                this.basePositions = data.Data && data.Data.List ? data.Data.List : []
                this.buildPosition();
            }
        }, this);
    },
    loadOrders(){
        Net.httpRequest("cfd/orders", "", (data)=>{
            // data = this.makeOrderTestData();
            if (data.Status == 0){
                this.baseOrders = data.Data && data.Data.List ? data.Data.List : []
                this.buildOrders();
            }
        }, this);
    },
    buildPosition(){
        var list = JSON.parse(JSON.stringify(this.basePositions));
        // var oldPositions = this.positions;
        this.positions = {};
        this.positionList = [];

        this.parsePositionList(list, (item)=>{
            this.findPLRelateOrders(item.ID, (attrs)=>{
                Object.assign(item, attrs);
            }, 'position', item);

            this.positions[item.ID] = item;
            this.positionList.push(item);
        });

        this.updatePositionList();
    },
    buildOrders(){
        var list = JSON.parse(JSON.stringify(this.baseOrders));

        this.orders = {};
        this.orderList = [];

        this.parseOrderList(list, (item)=>{
            this.orders[item.ID] = item;
            this.orderList.push(item);
        });

        this.orderList.forEach((item)=>{
            //查找关联的止盈止损单
            if (item.Attempt==CONST.FUT.Action.OPEN){
                this.findPLRelateOrders(item.PID, (attrs)=>{
                    Object.assign(item, attrs);
                }, 'order', item);
            }
        });

        if (this.positionList){
            //查找关联的止盈止损单
            this.positionList.forEach((v)=>this.findPLRelateOrders(v.ID, (attrs)=>{
                Object.assign(v, attrs);
            }, 'position', v));
        }

        this.updateOrderList();
    },
    updatePositionList(){
        if (this.positionList){
            this.calcPositionStat(this.positionList);

            Event.dispatch(Event.EventName.CFD_ORDER_UPDATE, {positions:this.positionList});
        }
    },
    updateOrderList(){
        if (this.orderList){
            this.calcOrderStat(this.orderList);

            Event.dispatch(Event.EventName.CFD_ORDER_UPDATE, {orders:this.orderList});
        }
    },
    onUpdateOrderData(data){
        var isPlOrder = false;
        for (var i=0,l=data.length; i<l; i++){
            var item = data[i];
            var order = Object.assign({}, item);
            var event = order.Event;

            if (event=='Create'){
                var find = -1;
                for (var a=0,al=this.baseOrders.length; a<al; a++){
                    var bOrder = this.baseOrders[a];
                    if (bOrder.ID==order.ID){
                        find = a;
                        Object.assign(bOrder, order);
                        break;
                    }
                }
                if (find<0){
                    this.baseOrders.unshift(order);
                    var textList = this.parseOrderToText(order);
                    Notification.success(Intl.lang('trade.event.order_create', order.PID, textList.join(" ")));
                }
            }else if(event=='Delete'){
                var key = -1;
                var bOrder;
                for (var a=0,al=this.baseOrders.length; a<al; a++){
                    bOrder = this.baseOrders[a];
                    if (bOrder.ID==order.ID){
                        key = a;
                        var result = this.delPLRelateOrder(bOrder.PID, bOrder.ID);
                        if (result) isPlOrder = true;
                        break;
                    }
                }
                if (key>=0){
                    this.baseOrders.splice(key, 1);
                    if (order.hasOwnProperty("Reason") && [1000,1004,1005,1018,1021,1025,1010,1034,2000,2002,2004,2011,2013].indexOf(order.Reason)!=-1){
                        var reason = Intl.lang("server.status."+order.Reason);
                        Notification.error(Intl.lang("trade.event.order_delete", bOrder.PID, reason));
                    }
                }
            }else if(event=='Update'){
                for (var a=0,al=this.baseOrders.length; a<al; a++){
                    bOrder = this.baseOrders[a];
                    if (bOrder.ID==order.ID){
                        Object.assign(bOrder, order);
                        item.full = Object.assign({}, bOrder);
                        break;
                    }
                }
                if (item.full){
                    var fOrder = item.full;
                    if (fOrder.hasOwnProperty("Reason") && fOrder.hasOwnProperty("Filled") && fOrder.hasOwnProperty("FinalPrice") && fOrder.Reason==2007){
                        var textList = this.parsePosOrderToText(fOrder);
                        Notification.success(Intl.lang("trade.event.position_create", fOrder.PID, textList.join(" ")))
                    }
                }
            }
        }
        this.buildOrders();
    },
    onUpdatePositionData(data){
        // if ("development" == process.env.NODE_ENV) console.log(JSON.stringify(data));
        for (var i=0,l=data.length; i<l; i++){
            var item = data[i];
            var order = Object.assign({}, item);
            var event = order.Event;

            // delete order.Event;
            // delete order.Type;
            // delete order.SerialID;

            if (event=='Create'){
                var find = -1;
                for (var a=0,al=this.basePositions.length; a<al; a++){
                    var bOrder = this.basePositions[a];
                    if (bOrder.ID==order.ID){
                        find = a;
                        Object.assign(bOrder, order);
                        break;
                    }
                }
                if (find<0){
                    //仓位通知默认亮灯Index=0
                    if (!order.hasOwnProperty("Index")) order.Index = 0;

                    this.basePositions.unshift(order);
                    //拆分和合并不显示提示
                    if (!order.hasOwnProperty("Reason") || (order.hasOwnProperty("Reason") && [2003,2006].indexOf(order.Reason)==-1)){
                        var textList = this.parsePositionToText(order);
                        Notification.success(Intl.lang('trade.event.position_create', order.ID, textList.join(" ")));
                    }
                }
            }else if(event=='Delete'){
                var find = -1;
                for (var a=0,al=this.basePositions.length; a<al; a++){
                    var bOrder = this.basePositions[a];
                    if (bOrder.ID==order.ID){
                        find = a;
                        break;
                    }
                }
                if (find>=0)this.basePositions.splice(find, 1);
            }else if(event=='Update'){
                for (var a=0,al=this.basePositions.length; a<al; a++){
                    var bOrder = this.basePositions[a];
                    if (bOrder.ID==order.ID){
                        Object.assign(bOrder, order);
                        item.full = Object.assign({}, bOrder);
                        break;
                    }
                }
            }
        }
        this.buildPosition();
    },
    onUpdateRank(data){
        var lastRank;

        for (var di=0,dl=data.length;di<dl;di++){
            var dv = data[di];
            dv.Type = 'Rank';

            var id = dv["ID"];
            var item = this.positions[id];
            if (item){
                item.Index = Number(dv.Star);
                var list = this.positionList;

                var oldRank = this.rankInPosition[item.CID];

                this.rankInPosition[item.CID] = -1;
                list.filter((v)=>v.CID==item.CID).forEach((v, i)=>{
                    this.statPositionRank(v);
                });
                var newRank = this.rankInPosition[item.CID];
                //排名不一样，并且是当前选中的code
                if (oldRank!=newRank && item.Product.Code==this.currCode){
                    lastRank = newRank;
                }
            }
        }

        Event.dispatch(Event.EventName.CFD_ORDERRANK_UPDATE, lastRank);
    },
    //查找关联ID的止盈止损设置订单
    findPLRelateOrders(relateID, callback, parentType, parentItem){
        var attrs = {};
        var orders = this.orderList;

        if (orders){
            for (var i=0,l=orders.length; i<l; i++){
                try{
                    var v = orders[i];
                    //订单的止盈止损才有RID，仓位的止盈止损RID=0
                    var isRidValid = (parentType=='position' && !v.RID) || (parentType=='order' && v.RID);
                    if (v.PID==relateID && isRidValid && [CONST.FUT.Action.TP, CONST.FUT.Action.SL, CONST.FUT.Action.CLOSE].indexOf(v.Attempt)!=-1){
                        if (v.Attempt==CONST.FUT.Action.SL){
                            v.parentType = parentType;
                            v.parentDelegateValue = parentItem.delegateValue;
                            attrs.SL = {
                                Distance: !!v.Relative,
                                Param: Number(v.Constant),
                                Variable: v.Variable
                            }
                            attrs.SLorder = v;
                            if (v.Strategy==CONST.FUT.Strategy.Trail){
                                attrs.SLDesc = Number(v.Constant)+Intl.lang("trade.open.delegateOption2");
                            }else{
                                if (v.Side==CONST.FUT.Side.BUY){
                                    attrs.SLDesc = "ASK" + Intl.lang("common.symbol.ge")
                                }else{
                                    attrs.SLDesc = "BID" + Intl.lang("common.symbol.le")
                                }
                                attrs.SLDesc = attrs.SLDesc + Number(v.Constant)+ (v.Relative?Intl.lang("trade.open.delegateOption2"):'');
                            }
                        }else if(v.Attempt==CONST.FUT.Action.TP){
                            v.parentType = parentType;
                            v.parentDelegateValue = parentItem.delegateValue;
                            attrs.TP = {
                                Distance: !!v.Relative,
                                Param: Number(v.Price)
                            }
                            attrs.TPorder = v;
                            attrs.TPDesc = Number(v.Price) + (v.Relative ? Intl.lang("trade.open.delegateOption2") : '');
                        }
                        // else if(v.Attempt==CONST.FUT.Action.CLOSE){
                        //     v.parentType = parentType;
                        //     attrs.CLOSEorder = v;
                        // }
                        // else if(v.Attempt==CONST.FUT.Action.CLEAR){
                        //     attrs.CLEARorder = v;
                        // }
                    }
                    if (attrs.SL && attrs.TP && attrs.CLOSEorder){
                        break;
                    }
                }catch (e) {
                    console.error(e);
                }
            }
        }
        if (callback) callback(attrs);
    },
    //删除关联ID的止盈或止损单
    delPLRelateOrder(relateID, orderID){
        var posInfo = this.positions[relateID];
        if (posInfo){
            if (posInfo.SLorder && posInfo.SLorder.ID==orderID){
                delete posInfo.SLorder;
                delete posInfo.SL;
                delete posInfo.SLDesc;

                return true;
            }else if(posInfo.TPorder && posInfo.TPorder.ID==orderID){
                delete posInfo.TPorder;
                delete posInfo.TP;
                delete posInfo.TPDesc;

                return true;
            }else if(posInfo.CLOSEorder && posInfo.CLOSEorder.ID==orderID){
                delete posInfo.CLOSEorder;
            }
        }

        return false;
    },
    //公共属性添加
    _addCommonAttrToTradeItem(item, type){
        const {product, contract} = this._tradeModel.getProductByCID(item.CID);
        if (!product) throw new Error("No CFD product with ID "+item.CID);

        item.Product = product;
        item.Contract = contract;
        // item.Con = this.getCon(item.CID);
        item.CName = product.DisplayName;
        item.Currency = item.Contract.Currency;
        item.CurrencyTxt = item.Contract.Coin;
        if (!item.ScaleTxt) item.ScaleTxt = Decimal.toFixed(item.Scale, product.ScaleFixed)+'x';
        item.orderType = type;
        if (type=='order' || type=='history'){
            // item.SideTxt = item.Side==CONST.FUT.Side.BUY ? "BUY" : "SELL";
            item.SideTxt = Intl.lang("trade.side."+ (item.Side==CONST.FUT.Side.BUY ? "BUY" : "SELL"));
        }else{
            item.SideTxt = Intl.lang("trade.side."+ (item.Side==CONST.FUT.Side.BUY ? "LONG" : (item.Side==CONST.FUT.Side.SELL ? "SHORT" : "FLAT")));
        }
    },
    parsePositionList(list, itemCallback){
        if (!list) return [];

        var oldPositionCodes = this.positionCodes;
        this.positionCodes = [];

        var delList = [], addList = [];
        for (var i=0,len=list.length; i<len; i++){
            try{
                var item = list[i];
                // item.ID = item.ID;
                item.CID = Number(item.CID);
                // item.Constant = Number(item.Constant);

                this._addCommonAttrToTradeItem(item, 'position');

                var product = item.Product;
                var contract = item.Contract;

                if (this.positionCodes.indexOf(product.Code)==-1){
                    this.positionCodes.push(product.Code);
                    if (oldPositionCodes.indexOf(product.Code)==-1){
                        addList.push(product.Code);
                    }
                }


                var sb = getCurrencySymbol(contract.Currency);

                item.Force = Decimal.toFixed(item.Force, product.PriceFixed);

                // item.ForceDesc = Decimal.toFixed(item.Force, product.PriceFixed);
                item.ForceDesc = item.Force;
                item.Scale = Decimal.toFixed(item.Scale);

                //开仓费用
                item.OpenFee = Decimal.accSubtr(item.Margin, item.PureMargin);

                //原Margin包括开仓费用 PureMargin不包括，全是保证金
                item.MarginUnit = Decimal.toFixed(Decimal.accDiv(item.PureMargin, item.Volume), contract.CalcFixed);
                item.Margin = Decimal.toFixed(item.PureMargin, contract.CalcFixed);
                // item.RepayUnit = item.toFixed(Decimal.accDiv(item.));
                // item.Repay = Decimal.toFixed(Decimal.accMul(item.RepayUnit, item.Volume), product.CalcFixed);
                //包括资金费用
                item.FeeUnit = Decimal.toFixed(Decimal.accDiv(item.Fee, item.Volume), contract.CalcFixed);
                item.Fee = Decimal.toFixed(item.Fee, contract.CalcFixed);
                //新的保证金是全部的保证金之和
                item.MarginTotal = String(item.Margin);

                if (item.hasOwnProperty("FundFee")){
                    //资金费用
                    item.Swap = sb.sb + Decimal.toFixed(item.FundFee||0, contract.ShowFixed);
                    //手续费
                    if (Number(item.Coin1Fee)==0 && Number(item.Coin2Fee)==0){//BTC
                        item.ChargeFee = item.CoinFee;
                        item.ChargeFeeDesc = Decimal.toFixed(item.ChargeFee, contract.ShowFixed);
                        item.ChargeFeeUnit = sb.sn;
                        if (Number(item.ChargeFee)<Number(item.OriginFee)){
                            item.ChargeFeeOriginDesc = Decimal.toFixed(item.OriginFee, contract.ShowFixed);
                        }
                    }else{ //TD
                        var tdInfo = Product.getCoinInfo(CONST.CURRENCY.TD);
                        var fixed = tdInfo ? tdInfo.ShowDigits : 0;
                        item.ChargeFee = Decimal.accAdd(Decimal.accAdd(item.Coin1Fee, item.Coin2Fee), item.ValueFee);
                        item.ChargeFeeDesc = Decimal.toFixed(item.ChargeFee, fixed);
                        item.ChargeFeeUnit = tdInfo ? tdInfo.Code : '';
                        // if (Number(item.ChargeFee)<Number(item.ValueOriginFee)){
                        item.ChargeFeeOriginDesc = Decimal.toFixed(item.ValueOriginFee, fixed);
                        // }
                    }
                }else{
                    item.Swap = '';
                    item.ChargeFeeDesc = '';
                    item.ChargeFeeUnit = '';
                }

                item.FeeDesc = sb.sb + Decimal.toFixed(item.Fee, contract.ShowFixed);
                item.PriceDesc = Decimal.toFixed(item.Price, product.PriceFixed);
                item.MarginTotalDesc = sb.sb + Decimal.toFixed(item.MarginTotal, contract.ShowFixed);
                // item.Lever = this.formula.leverToDepositRate(item.Scale);
                //翻倍点数
                var marginPips = this._formula.marginPips(item.Price, item.Scale, product.Pip);
                item.MarginPips = marginPips;
                //初始保证金
                item.Deposit = this._formula.deposit(contract.Multiplier, marginPips, item.Volume, contract.CalcFixed); //保证金

                if (item.hasOwnProperty("Operate")) item.OperateDesc = Intl.lang("trade.history.pOperate"+item.Operate);
                if (item.hasOwnProperty("CloseWeight")){
                    item.DealPrice = "";
                    if (Number(item.CloseWeight)){
                        item.DealPrice = Decimal.accDiv(item.CloseWeight, item.Volume, product.PriceFixed);
                    }else if(item.Operate==6){
                        item.DealPrice = Intl.lang("trade.history.noForcePrice");
                    }
                }

                if (item.hasOwnProperty("RealisedPNL") && Number(item.RealisedPNL)!=0){
                    item.Profit = item.RealisedPNL;
                    item.ProfitCalc = sb.sb + Decimal.toFixed(item.Profit, contract.CalcFixed);
                    item.ProfitDesc = sb.sb + Decimal.toFixed(item.Profit, contract.ShowFixed);
                }

                if (itemCallback) itemCallback(item);
            }catch (e){
                console.error(e);
            }
        }

        this.subTicks(oldPositionCodes, addList, delList);

        return list;
    },
    subTicks(oldPositionCodes, addList, delList){
        try{
            if (oldPositionCodes.length){
                oldPositionCodes.forEach(v=>{
                    if (this.positionCodes.indexOf(v)==-1){
                        delList.push(v);
                    }
                });
            }
            if (addList.length){
                WsMgr.subscribeNewTicks(CONST.TRADE_TYPE.CFG, addList);
            }
            if (delList.length){
                this._tradeModel.unsubTicksCodes(delList);
            }
        }catch (e) {
            console.log(e);
        }
    },
    parseOrderList(list, itemCallback, isHistory = false){
        if (!list) return [];

        for (var i=0,len=list.length; i<len; i++){
            try{
                var item = list[i];
                // item.ID = item.ID;
                // item.PID = item.PID;
                item.CID = Number(item.CID);
                item.Constant = Number(item.Constant);
                item.Scale = Number(item.Scale);

                this._addCommonAttrToTradeItem(item, !isHistory ? 'order' : 'history');
                var product = item.Product;
                var contract = item.Contract;
                //保证数据是按原来的
                if (product) item.Constant = Number(Decimal.toFixed(item.Constant, product.PriceFixed));

                item.VolumeDesc = item.Filled + '/'+item.Volume;

                // item.Visible = item.Visible==4294967295 ? -1 : item.Visible;
                // item.VolumeHide = (item.Visible==-1?0:item.Volume-item.Visible) + '/'+(item.Visible==-1?item.Volume:item.Visible);

                item.AttemptName = Intl.lang("trade.order.Action"+item.Attempt);
                //订单类型：限价，市价（正常不出现，因为立即成交），条件(最新)，条件(标记)，止盈，止损，追踪止损
                if (item.Kind==CONST.FUT.Kind.LMT){ //限价
                    // if ((item.Attempt==CONST.FUT.Action.TP || item.Attempt==CONST.FUT.Action.SL) && item.Strategy!=CONST.FUT.Strategy.Trail){
                    //     item.TypeDesc = Intl.lang(item.Passive ? "trade.order.Strategy10_p" : "trade.order.Strategy10");
                    // }else{
                    //     item.TypeDesc = item.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang(item.Passive ? "trade.order.Strategy10_p" : "trade.order.Strategy10"):Intl.lang(item.Strategy==CONST.FUT.Strategy.Line?(item.Passive ? 'trade.order.Strategy11_p':'trade.order.Strategy11'):'trade.order.Strategy12');
                    // }

                    if (item.Strategy==CONST.FUT.Strategy.Immediate){
                        item.TriggerPrice = '';
                    }else if (item.Strategy==CONST.FUT.Strategy.Line){
                        var gl = (item.Side==CONST.FUT.Side.BUY && item.Attempt!=CONST.FUT.Action.TP || item.Side==CONST.FUT.Side.SELL && item.Attempt==CONST.FUT.Action.TP) ?"common.symbol.ge":"common.symbol.le";
                        //历史记录取了相反的方向，因此这里必须相反
                        // if (isHistory) gl = gl=="common.symbol.ge" ? "common.symbol.le" : "common.symbol.ge";
                        item.TriggerPrice = (item.Side==CONST.FUT.Side.BUY ? "ASK" : "BID")+ Intl.lang(gl)+Number(item.Constant)+ (item.Relative?Intl.lang("trade.open.delegateOption2"):'');
                        // if (item.State < CONST.FUT.State.TRIGGERRED) item.PriceDistance = _calcPriceDistance(item);
                    }
                }else{ //市价
                    // if ((item.Attempt==CONST.FUT.Action.TP || item.Attempt==CONST.FUT.Action.SL) && item.Strategy!=CONST.FUT.Strategy.Trail){
                    //     item.TypeDesc = Intl.lang("trade.order.Strategy00");
                    // }else{
                    //     item.TypeDesc = item.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy00'):Intl.lang(item.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy01':'trade.order.Strategy02');
                    // }

                    if (item.Strategy==CONST.FUT.Strategy.Immediate){
                        item.TriggerPrice = '';
                    }else if (item.Strategy==CONST.FUT.Strategy.Line){
                        var gl = (item.Side==CONST.FUT.Side.BUY && item.Attempt!=CONST.FUT.Action.TP || item.Side==CONST.FUT.Side.SELL && item.Attempt==CONST.FUT.Action.TP) ?"common.symbol.ge":"common.symbol.le";
                        // if (isHistory) gl = gl=="common.symbol.ge" ? "common.symbol.le" : "common.symbol.ge";
                        item.TriggerPrice = (item.Side==CONST.FUT.Side.BUY ? "ASK" : "BID")+ Intl.lang(gl)+Number(item.Constant)+ (item.Relative?Intl.lang("trade.open.delegateOption2"):'');
                        // if (item.State < CONST.FUT.State.TRIGGERRED) item.PriceDistance = _calcPriceDistance(item);
                    }
                    // item.DistanceTxt = '';
                }

                if (item.Attempt==CONST.FUT.Action.SL){
                    if (item.Strategy==CONST.FUT.Strategy.Trail) item.TypeDesc = Intl.lang("trade.order.Type6");
                    else item.TypeDesc = Intl.lang("trade.order.Type5");
                }
                else if(item.Attempt==CONST.FUT.Action.TP){
                    item.TypeDesc = Intl.lang("trade.order.Type4");
                    // if (item.Passive){
                    //     item.TypeDesc = Intl.lang("trade.order.Type7", item.TypeDesc);
                    // }else if(item.Visible>=0){
                    //     item.TypeDesc = Intl.lang("trade.order.Type8", item.TypeDesc);
                    // }
                }
                else{
                    var actionDesc = Intl.lang("trade.order.Action"+item.Attempt);
                    if (item.Kind==CONST.FUT.Kind.LMT){
                        // if (item.Passive){
                        //     item.TypeDesc = Intl.lang("trade.order.Type7", actionDesc);
                        // }else if(item.Visible>=0){
                        //     item.TypeDesc = Intl.lang("trade.order.Type8", actionDesc);
                        // }else{
                        item.TypeDesc = Intl.lang("trade.order.Type1", actionDesc);
                        // }
                    }
                    else{
                        if (item.Strategy==CONST.FUT.Strategy.Line){
                            if (item.Variable==CONST.FUT.Variable.MarkPrice){
                                item.TypeDesc = Intl.lang("trade.order.Type3", actionDesc);
                            }else if(item.Variable==CONST.FUT.Variable.LastPrice){
                                item.TypeDesc = Intl.lang("trade.order.Type2", actionDesc);
                            }
                        }else if(item.Strategy==CONST.FUT.Strategy.Immediate){
                            item.TypeDesc = Intl.lang("trade.order.Type0", actionDesc)
                        }
                    }
                }

                if (item.Distance){
                    item.PriceTxt = Number(item.Price) + Intl.lang("trade.open.delegateOption2");
                }else{
                    if (item.Attempt==CONST.FUT.Action.TP && item.Relative){
                        item.PriceTxt = Number(item.Price) + Intl.lang("trade.open.delegateOption2");
                    }else if(item.Attempt==CONST.FUT.Action.SL && item.Strategy==CONST.FUT.Strategy.Trail){
                        item.PriceTxt = Number(item.Constant) + Intl.lang("trade.open.delegateOption2");
                    }
                    else{
                        item.PriceTxt = Number(item.Price);
                    }
                }
                item.OrderPrice = item.TriggerPrice ? item.TriggerPrice : (item.PriceTxt?item.PriceTxt:"");
                //部分成交价
                item.DealPrice = item.Filled > 0 && item.Weight>0 ? Decimal.accDiv(item.Weight, item.Filled, product.PriceFixed) : '';

                item.StateTxt = this.getOrderStateTxt(item);

                item.TimelyDesc = item.Timely==CONST.FUT.Timely.GTC ? 'GTC':(item.Timely==CONST.FUT.Timely.LIFE ? moment.unix(item.Deadline).format("MM-DD HH:mm:ss") : SysTime.ts2Server(item.TimelyParam, "MM-DD HH:mm:ss"));

                // if (item.Attempt == CONST.FUT.Action.OPEN){
                //     //计算订单的保证金
                //     item.Lever = this._formula.leverToDepositRate(item.Scale);
                // }

                item.delegateValue = this._formula.delegateValue(contract.RealMultiplier, item.Price ? item.Price : item.Constant, item.Volume);

                if (itemCallback) itemCallback(item);
            }catch (e){
                console.error(e);
            }
        }

        return list;
    },
    calcPositionStat(positionOrders){
        var plTotal = {};
        var stat = {};
        var defStat = {MarginTotal:0, Deposit:0, Fee:0, ProfitLoss:0, FundFee:0};

        for (var i=0,len=positionOrders.length; i<len; i++){
            try {
                var order = positionOrders[i];
                this._addStatAttrToPosition(order);

                var product = order.Product;
                var contract = order.Contract;

                var pd;
                if (!stat[contract.Currency]){
                    pd = Object.assign({}, defStat);
                    stat[contract.Currency] = pd;
                    plTotal[contract.Currency] = {pl:0, margin:0};
                }else{
                    pd = stat[contract.Currency];
                }

                pd.MarginTotal = Decimal.accAdd(order.MarginTotal, pd.MarginTotal);
                pd.Deposit = Decimal.accAdd(order.Deposit, pd.Deposit);
                pd.Fee = Decimal.accAdd(order.Fee, pd.Fee);
                pd.ProfitLoss = Decimal.accAdd(order.ProfitLoss||0, pd.ProfitLoss);

                pd.FundFee = Decimal.accAdd(order.FundFee||0, pd.FundFee);
            }catch(e){
                console.error(e);
            }
        }
        this.positionStat = stat;

        for (var currency in stat){
            var pd = stat[currency];

            if (!plTotal[currency]){
                plTotal[currency] = {pl:0};
            }
            plTotal[currency].pl = Decimal.accSubtr(pd.ProfitLoss, pd.Fee);
            // plTotal[currency].margin = pd.MarginTotal;
        }
        this.plTotal = plTotal;
    },
    calcOrderStat(orders){
        const _calcPriceDistance = (item)=>{
            if (item.Relative) return;

            var priceInfo = item.Product.price;
            if (item.Side==CONST.FUT.Side.BUY){
                return String(Decimal.accSubtr(priceInfo.ASK, item.Constant));
            }else{
                return String(Decimal.accSubtr(item.Constant, priceInfo.BID));
            }
        }

        var marginTotal = {};
        for (var i=0,l=orders.length; i<l; i++){
            try{
                var item = orders[i];
                item.Price = Number(item.Price);
                item.Constant = Number(item.Constant);

                if (item.Strategy==CONST.FUT.Strategy.Line && item.State < CONST.FUT.State.TRIGGERRED){
                    item.PriceDistance = _calcPriceDistance(item);
                }

                var product = item.Product;
                var contract = item.Contract;
                if (!marginTotal.hasOwnProperty(contract.Currency)){
                    marginTotal[contract.Currency] = 0;
                }

                //直接使用后端的订单的保证金
                item.MarginTotal = item.Margin;
                item.Deposit = item.Margin;

                //委托价值
                var sb = getCurrencySymbol(contract.Currency);
                if (item.parentDelegateValue){
                    item.delegateValueDesc = sb.sb+ Decimal.toFixed(item.parentDelegateValue, contract.ShowFixed);
                }else{
                    item.delegateValueDesc = sb.sb+this._formula.delegateValue(contract.RealMultiplier, item.Price ? item.Price : item.Constant, item.Volume, contract.ShowFixed);
                }

                marginTotal[contract.Currency] = String(Decimal.accAdd(item.MarginTotal, marginTotal[contract.Currency], contract.CalcFixed));

            }catch (e){
                console.error(e);
            }
        }

        this.orderMarginTotal = marginTotal;
    },
    //添加统计的属性到仓位 （盈亏等）随价格变化的
    _addStatAttrToPosition(order){
        var contract = order.Contract;
        var product = order.Product;
        var price = product.price;

        var sb = getCurrencySymbol(contract.Currency);
        //价值
        order.delegateValue = this._formula.delegateValue(contract.RealMultiplier, order.Price, order.Volume);
        order.delegateValueDesc = `${sb.sb}${Decimal.toFixed(order.delegateValue, contract.ShowFixed)}`;

        if (price){
            var askbid = order.Side==CONST.FUT.Side.BUY ? price.ASK : price.BID;
            order.ProfitLoss = this._formula.plVal(order.Side, order.Price, askbid, order.Volume, contract.Multiplier, product.Pip);
        }else{
            order.ProfitLoss = 0;
        }

        order.PlRate = Number(order.MarginTotal)>0 ? this._formula.plRate(order.ProfitLoss, order.MarginTotal) : 0;
        order.ProfitLossDesc = sb.sb+Decimal.toFixed(order.ProfitLoss, contract.ShowFixed)+"("+String(Decimal.toPercent(order.PlRate, 2))+")";
    },

    parseOrderToText(data, isOpenNew){
        if (data.hasOwnProperty("Scale")) data.Scale = Number(data.Scale);
        if (data.hasOwnProperty("Constant")) data.Constant = Number(data.Constant);

        const {product} = this._tradeModel.getProductByCID(data.CID);
        var list = [];
        list.push(Intl.lang(data.Scale>0?"trade.order.preview_main":"trade.order.preview_main2", Number(data.Scale), Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "trade.open.buy" : "trade.open.sell"), Number(data.Volume), product.Code));
        //下单时没有Kind属性
        var isLimit = false;
        if (data.hasOwnProperty("Kind")){
            isLimit = data.Kind==CONST.FUT.Kind.LMT;
        }else{
            isLimit = data.Price != 0;
        }

        if (isLimit){
            list.push(Intl.lang("trade.order.preview_limit_detail", Number(data.Price), data.Distance ? Intl.lang("trade.open.delegateOption2"):''));
            // if (!data.Passive){
            //     if (data.Visible>=0){
            //         list.push(Intl.lang(data.Visible==0?"trade.order.preview_hideDelegate":"trade.order.preview_showDelegate", Number(data.Visible)))
            //     }
            // }else{
            //     list.push(Intl.lang("trade.open.beidong"));
            // }
            list.push(Intl.lang("trade.order.preview_expire"+data.Timely, (data.Timely==CONST.FUT.Timely.DEADLINE ? SysTime.ts2Server(data.TimelyParam, "MM-DD HH:mm:ss") : Number(Decimal.accDiv(data.TimelyParam, 60, 2)))));
            if ((data.Attempt==CONST.FUT.Action.TP || data.Attempt==CONST.FUT.Action.SL) && data.Strategy!=CONST.FUT.Strategy.Trail){
                list.push(Intl.lang("trade.order.Strategy10"));
            }else{
                list.push(data.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy10'):Intl.lang(data.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy11':'trade.order.Strategy12'));
            }
        }else{
            // list.push(Intl.lang("trade.open.condition1"));
            if ((data.Attempt==CONST.FUT.Action.TP || data.Attempt==CONST.FUT.Action.SL) && data.Strategy!=CONST.FUT.Strategy.Trail){
                list.push(Intl.lang("trade.order.Strategy00"));
            }else{
                list.push(data.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy00'):Intl.lang(data.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy01':'trade.order.Strategy02'));
            }
        }

        //触发价
        if (data.Strategy!=CONST.FUT.Strategy.Immediate){
            if(data.Attempt==CONST.FUT.Action.SL && data.Strategy==CONST.FUT.Strategy.Trail){
                list.push(Intl.lang("trade.order.preview_trigger", Number(data.Constant) + Intl.lang("trade.open.delegateOption2")));
            }else{
                list.push(Intl.lang("trade.order.preview_trigger", this.VariableTxtMap[data.Variable]+ Intl.lang((data.Side==CONST.FUT.Side.BUY && data.Attempt!=CONST.FUT.Action.TP || data.Side==CONST.FUT.Side.SELL && data.Attempt==CONST.FUT.Action.TP) ?"common.symbol.ge":"common.symbol.le")+Number(data.Constant)));
            }
        }

        // if (isOpenNew){
        //     //保证金
        //     var con = this.getCon(data.CID);
        //     const sb = getCurrencySymbol(product.Currency);
        //     const {deposit, repay} = this.formula.unitOrderFee(isLimit, data.Side, con, data.Scale, product.price, data.Price, product.TakerFee, false);
        //     var depositTotal = Decimal.accMul(Decimal.accAdd(deposit, repay), data.Volume, product.ShowFixed);
        //     list.push(Intl.lang("trade.order.preview_margin", `${depositTotal} ${sb.sn}`));
        //
        //     //预期强平
        //     var price = data.Side==CONST.FUT.Side.BUY ? product.price.ASK : product.price.BID;
        //     var stat = this.getProductPosStat(data.CID);
        //     if (stat){
        //         var posTotalVolume = stat.volume + data.Volume;
        //         //side, con, delegatePrice, askbid, volume, lever, mark, takerFeeRate, posTotalVolume, risks, scale
        //         var expectForce = this.formula.expectForce(data.Side, this.getCon(data.CID), data.Price, price, data.Volume, data.Scale, product.price.MARK, product.TakerFee, posTotalVolume, product.Risks, product.AvgPriceFixed);
        //         list.push(Intl.lang("trade.order.preview_expectForce", expectForce));
        //     }
        // }

        if (data.SL){
            var info = data.SL;
            list.push(Intl.lang("trade.order.preview_loss",
                Intl.lang(info.Distance ? "trade.open.lossProfitOption1" : "trade.open.lossProfitOption2"),
                Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "common.symbol.le" : "common.symbol.ge"),
                Number(info.Param)));
        }
        if (data.TP){
            var info = data.TP;
            list.push(Intl.lang("trade.order.preview_profit",
                Intl.lang(info.Distance ? "trade.open.lossProfitOption1" : "trade.open.lossProfitOption2"),
                Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "common.symbol.ge" : "common.symbol.le"),
                Number(info.Param)));
        }

        return list;
    },
    //解析仓位数据
    parsePositionToText(data){
        const {product} = this._tradeModel.getProductByCID(data.CID);
        var list = [];
        list.push(Intl.lang("trade.order.preview_position", product.Code, Number(data.Scale), Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "trade.open.buy" : "trade.open.sell"), Number(data.Volume), Decimal.toFixed(Number(data.Price))));

        return list;
    },
    //解析仓位的成交通知数据
    parsePosOrderToText(data){
        const {product} = this._tradeModel.getProductByCID(data.CID);
        var list = [];
        list.push(Intl.lang("trade.order.preview_position2", product.Code, Number(data.Scale), Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "trade.open.buy" : "trade.open.sell"), Number(data.Filled), Decimal.toFixed(Number(data.FinalPrice))));

        return list;
    },
    getOrderStateTxt(item){
        var StateTxt;
        if (item.hasOwnProperty("Filled") && item.hasOwnProperty("Volume") && item.Filled>0 && item.Filled<item.Volume && [CONST.FUT.State.TRIGGERRED,CONST.FUT.State.FILLED].indexOf(item.State)!=-1){
            StateTxt = Intl.lang("trade.order.StatePart");
        }else if (item.hasOwnProperty("Filled") && item.hasOwnProperty("Volume") && item.Filled==item.Volume){
            StateTxt = Intl.lang("trade.order.State5");
        }else if(item.State == CONST.FUT.State.FILLED){
            StateTxt = Intl.lang(item.hasOwnProperty("Reason") && (item.Reason==2013 || item.Reason==2011) ? "trade.order.StateExpireCancel" : "trade.order.StateCancel");
        }else if (item.hasOwnProperty("Reason") && item.State==CONST.FUT.State.TRIGGERRED && item.Reason==2010){
            StateTxt = Intl.lang("trade.order.StateModify");
        }else if(item.State == CONST.FUT.State.WAITING && (item.Attempt==CONST.FUT.Action.TP || item.Attempt==CONST.FUT.Action.SL)){
            StateTxt = Intl.lang("trade.order.State1_tp");
        }
        else{
            StateTxt = Intl.lang("trade.order.State"+item.State);
        }
        return StateTxt;
    },
    loadHistory(page, PageSize, winObj, callback){
        Net.httpRequest("cfd/history", {PageSize:PageSize, Page:page}, (data)=>{
            if (data.Status==0){
                var list = data.Data.List||[];
                list.forEach((v)=>{
                    try{
                        // var product = this._tradeModel.getProductByCID(v.CID);
                        v.CostPrice = Number(v.CostPrice);
                        v.FinalPrice = Number(v.FinalPrice);
                        // v.VolumeDesc = v.XVolume + '/' + (v.Volume - v.Filled + v.XVolume);


                        if (v.Attempt==CONST.FUT.Action.CLEAR){
                            v.TypeDesc = '';
                        }

                    }catch (e){
                        console.error(e);
                    }
                });
                var newList = [];
                this.parseOrderList(list, (item)=>{
                    newList.push(item);
                }, true);
                data.Data.List = newList;

                if (callback) callback(data.Data);
            }
        }, winObj);
    },
    loadPositionHistory(page, PageSize, timeRange, winObj, callback){
        var params = {PageSize:PageSize, Page:page};
        if (timeRange){
            params.BeginTime = timeRange[0];
            params.EndTime = timeRange[1];
            params.ScreeningType = timeRange[2];
        }
        Net.httpRequest("cfd/positionHistory", params, (data)=>{
            if (data.Status==0){
                var list = data.Data.List||[];
                var newList = [];
                this.parsePositionList(list, (item)=>{
                    newList.push(item);
                });
                data.Data.List = newList;

                if (callback) callback(data.Data);
            }
        }, winObj);
    },
    getPosition(PID){
        return this.positions[PID];
    },
    //查出开仓单
    getOpenOrder(PID){
        var row = this.orderList.filter((v)=>v.PID==PID && v.Attempt==CONST.FUT.Action.OPEN);
        return row[0];
    },
    //比如多单的平仓委托(=空单)，触发价是10000，如果委托价是9000，那就是市价卖出的效果；而如果委托价时11000，那就是挂在上面等着卖，这种才可以勾选‘被动’‘隐藏’
    isShowDQETPart(direction, triggerPriceType, triggerPrice, delegatePriceType, delegatePrice){
        //多单 触发价 > 委托价 显示
        //空单 触发价 < 委托价 显示
        if (triggerPriceType==1){ //价格
            if (delegatePriceType==1){
                if (direction==CONST.FUT.Side.BUY){
                    return Number(triggerPrice) > Number(delegatePrice);
                }else{
                    return Number(triggerPrice) < Number(delegatePrice);
                }
            }else if(delegatePriceType==2){
                if (direction==CONST.FUT.Side.BUY){
                    return Number(delegatePrice) < 0;
                }else{
                    return Number(delegatePrice) > 0;
                }
            }
            return false;
        }else if (triggerPriceType==2){ //价距
            if (delegatePriceType==2){
                if (direction==CONST.FUT.Side.BUY){
                    return Number(delegatePrice) < 0;
                }else{
                    return Number(delegatePrice) > 0;
                }
            }
        }
        return true;
    },
    //获取止盈止损允许的值范围（开仓单）
    getPLInputValueRange(type, priceType, direction, product, isQuick){
        if (isQuick) return [-product.PriceMax, product.PriceMax];

        var price = direction==CONST.FUT.Side.BUY ? product.price.BID : product.price.ASK;

        if (type=='SL'){ //止损
            var range = direction==CONST.TRADE.DIRECTION.BID ? [-product.PriceMax, -1*product.MinTick] : [product.MinTick, product.PriceMax];
            if (priceType==1){
                return range;
            }else{
                return direction==CONST.TRADE.DIRECTION.BID ? [product.MinTick, Number(Decimal.accAdd(price, range[1]))] : [Number(Decimal.accAdd(price, range[0])), product.PriceMax];
            }
        }else{
            var range = direction==CONST.TRADE.DIRECTION.ASK ? [-product.PriceMax, -1*product.MinTick] : [product.MinTick, product.PriceMax];
            if (priceType==1){
                return range;
            }else{
                return direction==CONST.TRADE.DIRECTION.ASK ? [product.MinTick, Number(Decimal.accAdd(price, range[1]))] : [Number(Decimal.accAdd(price, range[0])), product.PriceMax];
            }
        }
    },
    clearUserData(){
        if (this.positionCodes.length){
            WsMgr.unsubNewTicks(CONST.TRADE_TYPE.CFG, this.positionCodes);
            this.positionCodes = [];
        }
        this.baseOrders = [];
        this.basePositions = [];
        this.orders = {};
        this.orderList = [];
        this.positions = {};
        this.positionList = [];
        this.orderMarginTotal = {};
        this.plTotal = {};
    }
}
