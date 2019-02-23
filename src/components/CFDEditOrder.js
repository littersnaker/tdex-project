import React from 'react';
import PureComponent from '../core/PureComponent';

import 'react-datepicker/dist/react-datepicker.css';
import Intl from '../intl';
import Net from "../net/net";
import PopDialog from "../utils/popDialog";
import Notification from "../utils/notification";
import AccountModel from "../model/account";
import Decimal from "../utils/decimal";
import {CONST} from "../public/const";
import {SingleSelect, SelectOption} from "./SingleSelect";
import CfdTradeModel from "../model/cfd-trade";
import CfdPosOrder from "../model/cfd-order-position";
import OptionsNumberInput from "./OptionsNumberInput"
import DelegrateQtyExpireTimePart from './DelegrateQtyExpireTimePart';
import {Confirm} from './Common';

export default class CFDEditOrder extends PureComponent {
    close(){
        if (this.props.close){
            this.props.close();
        }
    }
    render(){
        const {option, data, pn} = this.props;
        const row = data[0];
        const product = row.Product;

        return <section className="ft-trade-easy-panel shadow-w futures-bg-primary" style={{minWidth: "320px"}}>
            <header className="dialog-head tc lh-25">
                <i className="iconfont icon-close transit fem875" onClick={this.close.bind(this)}></i>
            </header>
            {option == 'conditionClose' &&
            <ConditionClose row={row} product={product} pn={pn} onClose={this.close.bind(this)} />
            }
            {option=='splitPosition' &&
            <SplitPosition row={row} product={product} pn={pn} onClose={this.close.bind(this)} />
            }
            {option=='adjustLever' &&
            <AdjustLever row={row} product={product} pn={pn} onClose={this.close.bind(this)} />
            }
            {option=='addDeposit' &&
            <AdjustDeposit row={row} product={product} pn={pn} onClose={this.close.bind(this)}/>
            }
            {option=='adjustForce' &&
            <AdjustForce row={row} product={product} pn={pn} onClose={this.close.bind(this)}/>
            }
            {(option == 'setSL' || option == 'editSL') &&
            <EditSL row={row} product={product} pn={pn} option={option} onClose={this.close.bind(this)}/>
            }
            {(option=='setTP' || option=='editTP') &&
            <EditTP row={row} product={product} pn={pn} option={option} onClose={this.close.bind(this)} />}
        </section>
    }
}

//设置止损 编辑止损
//还没有仓位的，按下单方式修改
//有仓位的，按新的方式修改
class EditSL extends PureComponent{
    constructor(props) {
        super(props);

        const {row} = this.props;
        // const {Product} = this.props.row;
        // this.leverOptions = CfdTradeModel.getLeverOptions(Product);

        this.lossOptionsMap = {
            "1": "trade.open.condition1",
            // "2": "trade.open.condition2",
            "3": "trade.editOrder.lossOption3",
            // "4": "trade.editOrder.lossOption4",
        };

        this.lossOptions = Object.keys(this.lossOptionsMap);

        var state = {triggerPrice:"", triggerPoint:"", loss:0, delegatePriceType:0, delegatePrice:"",delegatePoint:""};


        var order = row;
        if (order.SL){ //已有止损设置
            var slOrder = order.SLorder;
            if (slOrder.Strategy==CONST.FUT.Strategy.Line && slOrder.Kind==CONST.FUT.Kind.MKT){
                state.loss = 1;
            }else if(slOrder.Strategy==CONST.FUT.Strategy.Line && slOrder.Kind==CONST.FUT.Kind.LMT){
                state.loss = 2;
            }else if(slOrder.Strategy==CONST.FUT.Strategy.Trail && slOrder.Kind==CONST.FUT.Kind.MKT){
                state.loss = 3;
            }else if(slOrder.Strategy==CONST.FUT.Strategy.Trail && slOrder.Kind==CONST.FUT.Kind.LMT){
                state.loss = 4;
            }
            var nOrder = this.getDefaultValue(order, state.loss);

            this._changeLoss(state.loss);
            if ([3, 4].indexOf(Number(state.loss))!=-1){
                state.triggerPoint = Number(order.SL.Param);
            }else{
                state.triggerPrice = order.SL.Distance ? Number(Decimal.accAdd(order.Price,order.SL.Param)) : Number(order.SL.Param);
            }
            state.delegatePriceType = slOrder.Distance ? 2 : 1;
            state.delegatePrice = !slOrder.Distance ? Number(slOrder.Price) : nOrder.delegatePrice; //限价（委托价）
            state.delegatePoint = slOrder.Distance ? Number(slOrder.Price): nOrder.delegatePoint; //限价（委托价） 距离点数
        }


        this.state = state;
    }
    val(){
        var {triggerPrice, triggerPoint, loss, delegatePriceType,delegatePrice,delegatePoint} = this.state;
        var formData = {};
        var data = {};

        var row = this.props.row;

        loss = Number(loss);
        if ([1, 3].indexOf(loss)!=-1){ //市价
            data.Price = 0;
            data.Distance = false;
        }else{
            data.Price = Number(delegatePriceType==1 ? delegatePrice : delegatePoint); //委托价
            data.Distance = delegatePriceType==2;
        }
        data.Strategy = [3, 4].indexOf(loss)!=-1 ? CONST.FUT.Strategy.Trail : CONST.FUT.Strategy.Line;
        data.Variable = CONST.FUT.Variable.LastPrice;
        //取消
        if (row.SL){
            if ([3, 4].indexOf(loss)!=-1 && triggerPoint==="" || [1, 2].indexOf(loss)!=-1 && triggerPrice===""){
                this.props.pn.cancelOrders([row.SLorder], ()=>{
                    this.props.onClose();
                });
                return;
            }
        }
        data.Constant = [3, 4].indexOf(loss)!=-1 ? Number(triggerPoint) : Number(triggerPrice);

        data.Relative = false; //追踪的，不用设Relative为true，所以全部为false

        if (loss==1){
            if (data.Constant<=0){
                Notification.error(Intl.lang("trade.openError.Constant"));
                return;
            }
        }else if(loss==2){
            if (data.Constant<=0){
                Notification.error(Intl.lang("trade.openError.Constant"));
                return;
            }

            if (delegatePriceType==1 && data.Price<=0){
                Notification.error(Intl.lang("trade.openError.Price"));
                return;
            }else if(delegatePriceType==2 && (!data.Price || isNaN(data.Price))){
                Notification.error(Intl.lang("trade.openError.PriceDistance"));
                return;
            }
        }else if(loss==3){
            if (!data.Constant || isNaN(data.Constant)){
                Notification.error(Intl.lang("trade.openError.Constant"));
                return;
            }
        }else if(loss==4){
            if (!data.Constant || isNaN(data.Constant)){
                Notification.error(Intl.lang("trade.openError.Constant"));
                return;
            }
            if (!data.Price || isNaN(data.Price)){
                Notification.error(Intl.lang("trade.openError.Price"));
                return;
            }
        }

        var dqPart = this.refs.delegrateQtyExpireTimePart;
        if (dqPart){
            var timeData = dqPart.val();
            if (timeData) Object.assign(data, timeData);

            if (data.TimelyParam===null){
                Notification.error(Intl.lang("trade.openError.TimelyParam"));
                return;
            }
            if (data.Visible===null){
                Notification.error(Intl.lang("trade.openError.Visible"));
                return;
            }
        }
        if (row.SL){ //setup修改订单
            var row = row.SLorder;
            formData.CID = row.CID;
            formData.ID = row.ID;
            var options = {};
            for (var key in data){
                options[key] = data[key];
            }
            formData.Options = options;
            formData.ApiName = "cfd/setup";
        }else{//调用setsl
            formData.CID = row.CID;
            formData.ID = row.ID; //仓位ID
            formData.Visible = -1;
            delete data.Relative;

            Object.assign(formData, data);
            formData.ApiName = "cfd/setsl";
        }

        return formData;
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm){
            this.props.onClose();
            return;
        }

        var formData = this.val();
        if (formData && formData.ApiName){
            var apiName = formData.ApiName;
            delete formData.ApiName;
            if (apiName=='cfd/replace'){
                // FutTradeModel.replace(formData, (data)=>{
                //     if (data.Status==0){
                //         this.props.onClose();
                //     }
                // }, this);
            }else{
                Net.httpRequest(apiName, formData, (data)=>{
                    if (data.Status==0){
                        this.props.onClose();
                    }
                }, this);
            }
        }
    }

    onChangeLossPrice(value) {
        if (this.state.triggerPrice!=value)this.setState({triggerPrice: value});
    }
    onChangeLossPoint(value){
        if (this.state.triggerPoint!=value)this.setState({triggerPoint: value});
    }
    onChangeLoss(val){
        // var val = e.target.value;

        if (val!=this.state.loss){
            var data = {loss: val};
            this._changeLoss(val);
            if (val==2){
                data.delegatePriceType = this.delegatePriceOptions[0];
            }else if(val==4){
                data.delegatePriceType = this.delegatePriceOptions[0];
            }
            Object.assign(data, this.getDefaultValue(this.props.row, val));

            this.setState(data);
        }
    }
    _changeLoss(loss){
        if (loss==2){
            this.delegatePriceOptions = [1,2];
        }else if(loss==4){
            this.delegatePriceOptions = [2];
        }else{
            this.delegatePriceOptions = [];
        }
    }
    //row是原来开仓时的订单,止损设置方向相反
    getDefaultValue(row, condition){
        var data = {};
        var side = row.Side==CONST.FUT.Side.BUY ? CONST.FUT.Side.SELL : CONST.FUT.Side.BUY;

        var newPrice = side==CONST.FUT.Side.BUY ? row.Product.price.BID : row.Product.price.ASK;

        //买单 触发价>=price 卖单 触发价<=price
        var point = Decimal.accMul(CfdTradeModel.rangeTriggerPricePoint, row.Product.UnitPrice);
        if (side==CONST.FUT.Side.SELL){
            point = -1*point;
        }
        data.triggerPoint = String(point);
        data.triggerPrice = String(Decimal.accAdd(newPrice, point));

        if (condition==2){
            var range = Decimal.accMul(CfdTradeModel.rangeDelegatePricePoint, row.Product.UnitPrice);
            if (side==CONST.FUT.Side.BUY){
                range = -1*range;
            }
            data.delegatePrice = String(Decimal.accAdd(data.triggerPrice, range));
            data.delegatePoint = String(range);
        }else{
            var range = Decimal.accMul(CfdTradeModel.rangeDelegatePricePoint, row.Product.UnitPrice);
            if (side==CONST.FUT.Side.BUY){
                range = -1*range;
            }
            data.delegatePrice = String(Decimal.accAdd(newPrice, range));
            data.delegatePoint = String(range);
        }

        return data;
    }
    getTriggerInputValueRange(direction, priceType){
        return CfdPosOrder.getPLInputValueRange('SL', priceType, direction, this.props.row.Product)
    }
    onChangeDelegatePriceType(value){
        // e.stopPropagation();
        //
        // var value = e.target.value;
        this.setState({delegatePriceType: value});
    }
    onChangeDelegatePrice(value){
        this.setState({delegatePrice: value});
    }
    onChangeDelegatePoint(value){
        this.setState({delegatePoint: value});
    }
    render(){
        const {option, row, product} = this.props;
        const {triggerPrice,triggerPoint, loss, delegatePriceType,delegatePrice,delegatePoint} = this.state;

        const volume = row.Volume;
        const min = product.MinTick;

        const isLimit = [2, 4].indexOf(Number(loss))!=-1;

        const revertSide = row.Side==CONST.FUT.Side.BUY ? CONST.FUT.Side.SELL : CONST.FUT.Side.BUY;
        //比如多单的平仓委托(=空单)，触发价是10000，如果委托价是9000，那就是市价卖出的效果；而如果委托价时11000，那就是挂在上面等着卖，这种才可以勾选‘被动’‘隐藏’
        const isShow = loss==2 && !isNaN(triggerPrice) && !isNaN(delegatePrice) && CfdPosOrder.isShowDQETPart(revertSide, 1, triggerPrice, delegatePriceType, delegatePriceType==1?delegatePrice:delegatePoint)
            || loss==4 && !isNaN(triggerPoint) && !isNaN(delegatePoint) && CfdPosOrder.isShowDQETPart(revertSide, 2, triggerPoint, delegatePriceType, delegatePoint);

        const isTrail = [3, 4].indexOf(Number(loss))!=-1;

        const range = this.getTriggerInputValueRange(row.Side, isTrail?1:2);
        // const realRow = relateRow || row;
        return <div className="ft-easy-dialog-detail">
            <div className="tc">
                <h3>{Intl.lang("trade.contextMenu."+option)}</h3>
                <h5>{`#${row.ID}`}</h5>
            </div>
            <div className="mt-20 easy-dialog-center">
                <div className="mt-10 ft-order-box">
                    <div>{Intl.lang("trade.editOrder.delegateType")}</div>
                    <SingleSelect className="w-140 fl" value={loss} onChange={this.onChangeLoss.bind(this)}>
                        {this.lossOptions.map((v, i)=>{
                            return <SelectOption value={v} key={i}>{Intl.lang(this.lossOptionsMap[v])}</SelectOption>
                        })}
                    </SingleSelect>
                </div>
                <div className="mt-10 ft-order-box">
                    <div>{Intl.lang(!isTrail?"trade.history.TriggerPrice_O":"trade.editOrder.point")}</div>
                    {!isTrail &&
                    <OptionsNumberInput className="slider-number-box ver-md" value={triggerPrice} isRequire={false} step={Number(product.UnitPrice)} min={range[0]} max={range[1]} onChange={this.onChangeLossPrice.bind(this)}/>}
                    {isTrail &&
                    <OptionsNumberInput className="slider-number-box ver-md" value={triggerPoint} isRequire={false} step={Number(product.UnitPrice)} min={range[0]} max={range[1]} onChange={this.onChangeLossPoint.bind(this)} />}
                </div>
            </div>
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
            </div>
        </div>
    }
}

class EditTP extends PureComponent{
    constructor(props) {
        super(props);

        var row = this.props.row;

        var hasPosition = row.hasOwnProperty("PID") ? !!CfdPosOrder.getPosition(row.PID) : true; //是否已触发在仓位栏
        var relateRow;
        if (row.hasOwnProperty("PID")){
            if (hasPosition) relateRow = CfdPosOrder.getPosition(row.PID);
            else relateRow = CfdPosOrder.getOpenOrder(row.PID);
        }
        var realRow = relateRow||this.props.row;
        var state = {hasPosition, realRow};
        if (hasPosition){
            var order = realRow;
            if (order.TP){ //已有止盈设置
                // var slOrder = order.TPorder;
                state.profit = !order.TP.Distance ? 2 : 1;
                state.profitPrice = order.TP.Param;
            }else{
                state.profit = 2;
                state.profitPrice = "";
                // state.profitPrice = this.defaultProfitPriceInputValue(state.profit, row.Side, '');
            }
        }

        this.state = state;
    }
    defaultProfitPriceInputValue(profit, direction, price){
        const row = this.props.row;

        var range = Number(Decimal.accMul(row.Product.UnitPrice, CfdTradeModel.rangePricePoint));
        if (direction==CONST.TRADE.DIRECTION.ASK){//买单 止盈>最新价
            range = -1*range;
        }
        if (profit==1){
            return range;
        }else{
            var side = row.Side==CONST.FUT.Side.BUY ? CONST.FUT.Side.SELL : CONST.FUT.Side.BUY;
            var newPrice = side==CONST.FUT.Side.BUY ? row.Product.price.BID : row.Product.price.ASK;

            return Number(Decimal.accAdd(price||newPrice, range));
        }
    }
    val(){
        var formData = {};
        var {hasPosition, realRow} = this.state;
        var lpPart = this.refs.FutLossProfitPart;
        var data = {}, val;
        if (lpPart){
            val = lpPart.val();
        }else{
            val = {
                TP: {
                    Distance:  this.state.profit == 2 ? false : true,
                    Param: Number(this.state.profitPrice)
                }
            }
        }

        if (val){
            if (realRow.TP){
                if (hasPosition){
                    if (this.state.profitPrice==="" || (val && !val.TP.Param)){
                        this.props.pn.cancelOrders([realRow.TPorder], ()=>{
                            this.props.onClose();
                        });
                        return;
                    }
                }
                //取消
                // if (realRow.SL){
                //     if ([3, 4].indexOf(loss)!=-1 && triggerPoint==="" || [1, 2].indexOf(loss)!=-1 && triggerPrice===""){
                //         FutTradeModel.cancelOrders([realRow.SLorder], ()=>{
                //             this.props.onClose();
                //         });
                //         return;
                //     }
                // }
            }

            data.Price = val.TP.Param;
            data.Relative = val.TP.Distance;
        }
        if (hasPosition){ //有仓位的
            var dqPart = this.refs.delegrateQtyExpireTimePart;
            if (dqPart){
                var timeData = dqPart.val();
                if (timeData) Object.assign(data, timeData);

                if (data.TimelyParam===null){
                    Notification.error(Intl.lang("trade.openError.TimelyParam"));
                    return;
                }
                if (data.Visible===null){
                    Notification.error(Intl.lang("trade.openError.Visible"));
                    return;
                }
            }

            // var dqPart = this.refs.delegrateQtyExpireTimePart;
            // if (dqPart){
            //     var timeData = dqPart.val();
            //     if (timeData) Object.assign(data, timeData);
            // }
            if (realRow.TP){ //setup修改订单
                var row = realRow.TPorder;
                formData.CID = row.CID;
                formData.ID = row.ID;
                var options = {};
                for (var key in data){
                    options[key] = data[key];
                }
                formData.Options = options;
                formData.ApiName = "cfd/setup";
            }else{//调用setsl
                formData.CID = realRow.CID;
                formData.ID = realRow.ID; //仓位ID
                formData.Visible = -1;
                formData.Strategy = CONST.FUT.Strategy.Immediate;
                // formData.Variable = CONST.FUT.Variable.LastPrice;

                Object.assign(formData, data);
                formData.ApiName = "cfd/settp";
            }
        }else{
            var newFormData = Object.assign({}, realRow, val);
            if (!hasPosition){
                const {ok, error} = CfdTradeModel.checkFormDataTP(newFormData);
                if (!ok){
                    error.forEach((v, i)=>{
                        Notification.error(v);
                    });
                    return;
                }
            }

            if (realRow.TP){//调用setup修改订单
                var row = realRow.TPorder;
                formData.CID = row.CID;
                formData.ID = row.ID;
                var options = {};
                for (var key in data){
                    options[key] = data[key];
                }
                formData.Options = options;
                formData.ApiName = "cfd/setup";
            }else{ //调用relace去设置
                Object.assign(formData, realRow);
                formData.TP = val.TP;
                formData.ApiName = "cfd/replace";
            }
        }

        return formData;
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm){
            this.props.onClose();
            return;
        }

        var formData = this.val();
        if (formData && formData.ApiName){
            var apiName = formData.ApiName;
            delete formData.ApiName;
            if (apiName=='cfd/replace'){
                FutTradeModel.replace(formData, (data)=>{
                    if (data.Status==0){
                        this.props.onClose();
                    }
                }, this);
            }else{
                Net.httpRequest(apiName, formData, (data)=>{
                    if (data.Status==0){
                        this.props.onClose();
                    }
                }, this);
            }
        }
    }

    onChangeProfit(profit){
        if (this.state.profit!=profit){
            this.setState({profit});
        }
    }

    onChangeProfitPrice(profitPrice){
        if (profitPrice!=this.state.profitPrice){
            this.setState({profitPrice});
        }
    }

    render(){
        const {option, row, product} = this.props;
        const {hasPosition, realRow, profit, profitPrice} = this.state;
        const volume = realRow.Volume;

        const profitOptions = hasPosition ? [2] : [1,2];

        var profitRange = profitRange = [0, product.PriceMax];
        profitRange = CfdPosOrder.getPLInputValueRange('TP', profit, row.Side, product, false);


        return <div className="ft-easy-dialog-detail">
            <div className="tc">
                <h3>{Intl.lang("trade.contextMenu."+option)}</h3>
                <h5>{`#${realRow.ID}`}</h5>
            </div>
            <div className="mt-20 easy-dialog-center">
                <div className="mt-10 ft-order-box">
                    <div>{Intl.lang("trade.editOrder.delegateType")}</div>
                    <SingleSelect className="w-140 fl" value={profit} onChange={this.onChangeProfit.bind(this)}>
                        {profitOptions.map((v, i)=>{
                            return <SelectOption value={v} key={i}>{Intl.lang("trade.open.lossProfitOption"+v)}</SelectOption>
                        })}
                    </SingleSelect>
                </div>
                <div className="mt-10 ft-order-box">
                    <div>{Intl.lang("trade.open.delegatePrice2")}</div>
                    <OptionsNumberInput className="slider-number-box ver-md" value={profitPrice} isRequire={false} step={Number(product.UnitPrice)} min={profitRange[0]} max={profitRange[1]} onChange={this.onChangeProfitPrice.bind(this)}/>
                </div>
                <div className="mt-10 ft-order-box">
                    <div className="easy-dialog-special">
                        <DelegrateQtyExpireTimePart quickDisable={true} hideBeidongOption={true} hideQtyOption={true} volume={volume} ref="delegrateQtyExpireTimePart" order={realRow.TPorder} isSimple={true}/>
                    </div>
                </div>
            </div>
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
            </div>
        </div>
    }
}

class ConditionClose extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;

        var range = Decimal.accMul(CfdTradeModel.rangePricePoint, product.UnitPrice);
        this.state = {
            closePositionPrice: row.TPorder ? Number(row.TPorder.Price) : Number(row.Side==CONST.FUT.Side.BUY ? Decimal.accAdd(product.price.BID, range) : Decimal.accSubtr(product.price.ASK, range)) //平仓价格
        };
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm){
            this.props.onClose();
            return;
        }

        const {closePositionPrice} = this.state;
        var {row} = this.props;

        if (!row.TPorder){
            var orderData = {CID:row.CID, ID:row.ID, Price:Number(closePositionPrice), Distance: false, Strategy: CONST.FUT.Strategy.Immediate};
            if (this.refs.delegrateQtyExpireTimePart){
                var val = this.refs.delegrateQtyExpireTimePart.val();
                Object.assign(orderData, val);
                if (!orderData.Price){
                    Notification.error(Intl.lang("trade.openError.closePrice"));
                    return;
                }
                if (orderData.TimelyParam===null){
                    Notification.error(Intl.lang("trade.openError.TimelyParam"));
                    return;
                }
                // if (orderData.Visible===null){
                //     Notification.error(Intl.lang("trade.openError.Visible"));
                //     return;
                // }
            }

            // var formData = {List:[orderData]};
            formData = orderData;

            var apiName = "cfd/settp"
            Net.httpRequest(apiName, formData, (data)=>{
                if (data.Status==0){
                    this.props.onClose();

                    // var Result = data.Data.Result;
                    // //{"Status":0,"Data":{"Result":{"58518994945":{"Code":0,"Error":""},"58586103809":{"Code":0,"Error":""}}}}
                    // // var errs = [];
                    // for (var pid in Result){
                    //     var info = Result[pid];
                    //     if (info && info.Code>0){
                    //         // errs.push()
                    //         Notification.error(Intl.lang("trade.error.closePosition", pid, Intl.lang("server.status."+info.Code)+ (info.Error && "production" !== process.env.NODE_ENV ? ','+info.Error : '')));
                    //     }
                    // }
                    // if (errs[0]) Notification.error(errs.join(";\n"));
                    // FutTradeModel.loadPosition();
                }
            }, this);
        }else{
            var order = row.TPorder;
            if (closePositionPrice===""){
                this.props.pn.cancelOrders([order], ()=>{
                    this.props.onClose();
                });
                return;
            }
            var Options = {
                Price: Number(closePositionPrice)
            }
            if (this.refs.delegrateQtyExpireTimePart){
                var val = this.refs.delegrateQtyExpireTimePart.val();
                Object.assign(Options, val);
                if (Options.TimelyParam===null){
                    Notification.error(Intl.lang("trade.openError.TimelyParam"));
                    return;
                }
                if (Options.Visible===null){
                    Notification.error(Intl.lang("trade.openError.Visible"));
                    return;
                }
            }

            var formData = {
                CID: Number(order.CID),
                ID: order.ID,
                Target:CONST.FUT.Target.ORDER,
                Options
            }

            Net.httpRequest("cfd/setup", formData, (data)=>{
                if (data.Status==0) {
                    this.props.onClose();
                }
            }, this);
        }
    }

    onChangeClosePositionPrice(value) {
        this.setState({closePositionPrice: value});
    }

    render(){
        const {row, product, isSimple} = this.props;
        const {closePositionPrice} = this.state;

        var isShow = true;
        var buySell;
        var colorName, tradeType, btnClass;
        var titleTxt = Intl.lang("trade.history.pOperate2");
        var side = row.Side==CONST.FUT.Side.BUY ? CONST.FUT.Side.SELL : CONST.FUT.Side.BUY;
        const min = product.MinTick;

        var profitRange = [0, product.PriceMax];
        profitRange = CfdPosOrder.getPLInputValueRange('TP', 2, row.Side, product, false);

        if (side==CONST.FUT.Side.SELL){
            colorName =  'psell';
            tradeType = Intl.lang("trade.order.Strategy10")+Intl.lang("trade.sell")+Intl.lang("trade.order.Action2")
            buySell = Intl.lang("trade.sell");
            btnClass = "btn-sell";
        }else{
            colorName =  'pbuy';
            tradeType = Intl.lang("trade.order.Strategy10")+Intl.lang("trade.buy")+Intl.lang("trade.order.Action2")
            buySell = Intl.lang("trade.buy");
            btnClass = "btn-buy";
        }

        if (row.Side==CONST.FUT.Side.BUY){
            if (Number(closePositionPrice) <= Number(product.price.BID)){
                isShow = false;
            }
        }else{
            if (Number(closePositionPrice) >= Number(product.price.ASK)){
                isShow = false;
            }
        }

        var subTitle1 = Intl.lang("trade.preview.open1", `<span class="txt">${buySell}</span>`, `<span class="txt">${Intl.lang("trade.editOrder.closePosPrice")}</span>`, `<span class="txt"> ${row.Volume}</span>`, product.DisplayName);

        return <div className="ft-easy-dialog-detail">
            <div className={"tc "+colorName}>
                <h3>{titleTxt}</h3>
                <h5>{`#${row.ID}`}</h5>
                <div className="mt-15 lh-24">
                    <p className="fs16"><span className="txt">{tradeType}</span></p>
                    <p className="c-d mt-5" dangerouslySetInnerHTML={{__html:subTitle1}}></p>
                </div>
            </div>
            <div className="mt-20 easy-dialog-center">
                <div>
                    <div>{Intl.lang("trade.editOrder.closePosPrice")}</div>
                    <OptionsNumberInput className="slider-number-box ver-md" value={closePositionPrice} isRequire={false}
                                        step={Number(product.UnitPrice)} min={profitRange[0]} max={profitRange[1]}
                                        onChange={this.onChangeClosePositionPrice.bind(this)}/>
                </div>
                {isShow && <div className="mt-10 ft-order-box">
                    <div className="easy-dialog-special">
                        <DelegrateQtyExpireTimePart quickDisable={true} hideBeidongOption={true} hideQtyOption={true} volume={row.Volume} ref="delegrateQtyExpireTimePart" order={row.CLOSEorder} isSimple={true}/>
                    </div>
                </div>}
            </div>
            {/*<NotShowDialogCheckbox />*/}
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className={"btn "+btnClass} onClick={(e)=>this.onConfirm(e, true)}>{titleTxt}</button>
            </div>
        </div>
    }
}

class SplitPosition extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;

        this.state = {
            volume: row.Volume,      //持仓量
            splitVolume: 1, //拆分数量
        };
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm){
            this.props.onClose();
            return;
        }

        var {row} = this.props;
        var {splitVolume, volume} = this.state;
        if (Number(splitVolume)<=0 || Number(splitVolume)>=Number(volume)){
            Notification.error(Intl.lang("trade.openError.SplitVolume"));
            return;
        }

        const _reqSplit = ()=>{
            Net.httpRequest("cfd/split", {CID:row.CID, ID:row.ID, Volume:Number(splitVolume)}, (data)=>{
                if (data.Status==0){
                    this.props.onClose();
                    // FutTradeModel.loadPosition();
                }
            }, this);
        }

        if (row.TP || row.SL){
            PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("Recharge.note")} content={Intl.lang("trade.split.tip")}
                                    yestxt={Intl.lang("trade.editOrder.confirm")} notxt={Intl.lang("common.cancel")} callback={()=>{
                _reqSplit();
            }} cancel={()=>{
                this.props.onClose();
            }}/>, "alert_panel");
        }else{
            _reqSplit();
        }
    }

    onChangeSplitVolume(value){
        this.setState({splitVolume: value});
    }

    render() {
        const {row, product, isSimple} = this.props;
        const {volume, splitVolume} = this.state;

        return <div className="ft-easy-dialog-detail">
            <div className="tc">
                <h3>{Intl.lang("trade.history.pOperate9")}</h3>
                <h5>{`#${row.ID}`}</h5>
            </div>
            <div className="mt-20 easy-dialog-center lh-25">
                <p><span>{Intl.lang("trade.editOrder.orderVol")}</span><span>{volume}</span></p>
            </div>
            <div className="mt-20 easy-dialog-center">
                <div>
                    <div>{Intl.lang("trade.editOrder.splitVol")}</div>
                    <OptionsNumberInput className="slider-number-box ml-10" value={splitVolume}
                                        step={1} min={1} max={volume-1}
                                        onChange={this.onChangeSplitVolume.bind(this)}/>
                </div>
            </div>
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
            </div>
            {/*<div className="mt-20 c-8 fs11">{Intl.lang("Recharge.note")+Intl.lang("common.symbol.colon")+ Intl.lang("trade.split.tip")}</div>*/}
        </div>
    }
}

class AdjustLever extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;
        this.leverOptions = CfdTradeModel.getLeverOptions(product);

        this.state = {
            lever: row.Scale,
            deposit: row.MarginTotal,
            marginPip: CfdTradeModel.formula.marginPips(row.Price, row.Scale, product.Pip),
            force: row.ForceDesc,
            depositChange: 0
        };
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm){
            this.props.onClose();
            return;
        }

        const {row} = this.props;
        var {lever} = this.state;
        if (Number(lever)<this.leverOptions[0] || Number(lever)>this.leverOptions[this.leverOptions.length-1]){
            Notification.error(Intl.lang("trade.openError.Scale"));
            return;
        }

        var formData = {CID:row.CID, ID:row.ID, Target:CONST.FUT.Target.POSITION, Options:{Scale:Number(lever)}};
        Net.httpRequest("cfd/setup", formData, (data)=>{
            if (data.Status==0){
                this.props.onClose();
                // FutTradeModel.loadPosition();
            }
        }, this);
    }

    onChangeLever(val){
        if (this.state.lever!=val){
            if (isNaN(val)) return;

            this.setState({lever:val});

            if (Number(val)>=this.leverOptions[0] && Number(val)<=this.leverOptions[this.leverOptions.length-1]){
                const {row, product} = this.props;
                const contract = row.Contract;
                //multiplier, volume, avgPrice, lever, pip, scale
                var initMarginOld = CfdTradeModel.formula.leverDeposit(contract.Multiplier, row.Volume, row.Price, row.Scale, product.Pip);
                // var add = Decimal.accSubtr(row.MarginTotal, initMarginOld);
                // var mp = CfdTradeModel.formula.marginPips(row.Price, row.Scale, product.Pip);
                // var force = CfdTradeModel.formula.getForceClosePrice(row.Side, row.Price, add, row.Volume, contract.Multiplier, mp, row.OriginFee, row.FundFee, product.Pip, product.PriceFixed);

                var newMarginPip = CfdTradeModel.formula.marginPips(row.Price, val, product.Pip);
                var initMarginNew = CfdTradeModel.formula.deposit(contract.Multiplier, newMarginPip, row.Volume);
                var depositChange = Decimal.accSubtr(initMarginNew, initMarginOld);
                var deposit = Decimal.accAdd(row.MarginTotal, depositChange, contract.ShowFixed);

                var force;
                if (Number(depositChange)>0){
                    force = CfdTradeModel.formula.getForceClosePrice(row.Side, row.Price, depositChange, row.Volume, contract.Multiplier, newMarginPip, row.OriginFee, row.FundFee, product.Pip, product.PriceFixed);
                }else{
                    force = CfdTradeModel.formula.getForceClosePrice(row.Side, row.Price, 0, row.Volume, contract.Multiplier, newMarginPip, row.OriginFee, row.FundFee, product.Pip, product.PriceFixed);
                    //针对取出初始保证金的情况
                    if (row.Side==CONST.FUT.Side.BUY){
                        var marketPrice = product.price.ASK;
                        var maxForce = Decimal.accSubtr(marketPrice, Decimal.accMul(Math.abs(Decimal.accSubtr(row.Price, marketPrice)), CfdTradeModel.formula.limitSecurity), product.PriceFixed);
                        if (Number(force) > Number(maxForce)){
                            this.setState({deposit:"--", depositChange:"--", force:"--"});
                            return;
                        }
                    }else{
                        var marketPrice = product.price.BID;
                        var minForce = Decimal.accAdd(marketPrice, Decimal.accMul(Math.abs(Decimal.accSubtr(row.Price, marketPrice)), CfdTradeModel.formula.limitSecurity), product.PriceFixed);
                        if (Number(force)<Number(minForce)){
                            this.setState({deposit:"--", depositChange:"--", force:"--"});
                            return;
                        }
                    }
                }
                this.setState({deposit, depositChange, force});
            }
        }
    }

    render(){
        const {row, product, isSimple} = this.props;
        const {lever, deposit, force, depositChange, marginPip} = this.state;

        const contract = row.Contract;

        const depositChangeFixed = Decimal.toFixed(depositChange, contract.ShowFixed);

        return <div className="ft-easy-dialog-detail">
            <div className="tc">
                <h3>{Intl.lang("trade.contextMenu.adjustLever")}</h3>
                <h5>{`#${row.ID}`}</h5>
            </div>
            <div className="mt-20 easy-dialog-center lh-25">
                <p><span>{Intl.lang("trade.editOrder.scaleOld")}</span><span>{Intl.lang("trade.preview.lever", row.Scale)}</span></p>
            </div>
            <div className="mt-20 easy-dialog-center">
                <div>
                    <div>{Intl.lang("trade.editOrder.scaleNew")}</div>
                    <OptionsNumberInput value={lever} options={this.leverOptions} labelFormat="%sx" step={0.01} unit="x" className="slider-number-box ver-md" min={this.leverOptions[0]} max={this.leverOptions[this.leverOptions.length-1]} onChange={this.onChangeLever.bind(this)}/>
                </div>
                <p className="mt-10 c-8 fs16"><span>{Intl.lang("trade.editOrder.afterAdjuct")}</span><span></span></p>
                <p className="mt-10"><span>{Intl.lang("trade.history.ForceDesc")}</span><span>{force}</span></p>
                <p><span>{Intl.lang("trade.editOrder.marginPip")}</span><span>{marginPip}</span></p>
                <p><span>{Intl.lang("trade.editOrder.deposit")}</span><span>{`${Decimal.toFixed(deposit, contract.ShowFixed)}(${contract.Coin})`}</span></p>
                <p><span>{Intl.lang("trade.editOrder.depositChange")}</span><span>{`${Number(depositChangeFixed)>0?'+':''}${depositChangeFixed}(${contract.Coin})`}</span></p>
            </div>
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
            </div>
        </div>
    }
}

class AdjustDeposit extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;
        // this.leverOptions = FutTradeModel.leverOptions;
        var marginPip = CfdTradeModel.formula.marginPips(row.Price, row.Scale, product.Pip);

        this.state = {
            margin: row.MarginTotal,
            force: row.ForceDesc,
            lever: row.Scale,
            baseMarginPip: marginPip,
            marginPip
        };
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm){
            this.props.onClose();
            return;
        }

        const {row} = this.props;
        var {margin, force, lever} = this.state;
        if (Number(margin)<=0 || isNaN(force) || isNaN(lever)){
            Notification.error(Intl.lang("trade.openError.Margin"));
            return;
        }
        // var {row, addDeposit} = this.state;
        // // var Margin = Number(addDeposit);
        // var Margin = Number(Decimal.accAdd(Decimal.accAdd(row.MarginUnit, row.RepayUnit), Decimal.accDiv(Decimal.accSubtr(addDeposit, this.addDeposit), row.Volume), row.Product.CalcFixed));
        var Margin = Number(margin);
        var formData = {CID:row.CID, ID:row.ID, Target:CONST.FUT.Target.POSITION, Options:{Margin}};
        Net.httpRequest("cfd/setup", formData, (data)=>{
            if (data.Status==0){
                this.props.onClose();
            }
        }, this);
    }

    onChangeMargin(val){
        if (this.state.margin!=val){
            if (isNaN(val)) return;

            const {row, product} = this.props;
            const contract = row.Contract;
            var initMargin = CfdTradeModel.formula.leverDeposit(contract.Multiplier, row.Volume, row.Price, row.Scale, product.Pip);
            if (Number(val) >= Number(row.MarginTotal)){
                var addDeposit = Decimal.accSubtr(val, initMargin);
                //翻倍点数
                var marginPip = CfdTradeModel.formula.marginPips(row.Price, row.Scale, product.Pip);
                //强平价
                var force = CfdTradeModel.formula.getForceClosePrice(row.Side, row.Price, addDeposit, row.Volume, contract.Multiplier, marginPip, row.OriginFee, row.FundFee, product.Pip, product.PriceFixed)
                this.setState({margin:val, force, lever: row.Scale, marginPip});
            }else{
                var newMargin = val;
                // 需要调整杠杆
                if (Number(newMargin) < Number(initMargin)){
                    var lever = CfdTradeModel.formula.depositLever(contract.Multiplier, row.Price, product.Pip, row.Volume, newMargin);
                    if (Number(lever)<1 || Number(lever)>product.LeverMax){
                        this.setState({margin:val, force:'--', lever:'--', marginPip:"--"});
                    }else{
                        //翻倍点数
                        var marginPip = CfdTradeModel.formula.marginPips(row.Price, lever, product.Pip);
                        var force = CfdTradeModel.formula.getForceClosePrice(row.Side, row.Price, 0, row.Volume, contract.Multiplier, marginPip, row.OriginFee, row.FundFee, product.Pip, product.PriceFixed);
                        this.setState({margin:val, force, lever:Decimal.toFixed(lever, product.ScaleFixed), marginPip});
                    }
                }else{
                    //翻倍点数
                    var marginPip = CfdTradeModel.formula.marginPips(row.Price, row.Scale, product.Pip);
                    var addDeposit = Decimal.accSubtr(newMargin, initMargin);
                    var force = CfdTradeModel.formula.getForceClosePrice(row.Side, row.Price, addDeposit, row.Volume, contract.Multiplier, marginPip, row.OriginFee, row.FundFee, product.Pip, product.PriceFixed);
                    this.setState({margin:val, force, lever:row.Scale, marginPip});
                }
            }
        }
    }

    render(){
        const {row, product} = this.props;
        const {margin, force, lever, baseMarginPip, marginPip} = this.state;

        const contract = row.Contract;

        var canUse = 0;
        var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.CFD, contract.Currency);
        if (wallet) {
            canUse = Decimal.format(wallet.canUse, contract.ShowFixed);
        }

        return <div className="ft-easy-dialog-detail">
            <div className="tc">
                <h3>{Intl.lang("trade.contextMenu.addDeposit")}</h3>
                <h5>{`#${row.ID}`}</h5>
            </div>
            <div className="mt-20 easy-dialog-center">
                <div>
                    <div>{Intl.lang("trade.editOrder.deposit")}</div>
                    <OptionsNumberInput value={margin} min={0} max={product.PriceMax} className="slider-number-box ver-md" onChange={this.onChangeMargin.bind(this)}/>
                </div>
                <div className="c-8">
                    {/*<span></span><span>+/-0.0012</span>*/}
                </div>
            </div>
            <div className="mt-20 easy-dialog-center">
                <p className="c-8"><span>{Intl.lang("futures.can_use")}</span><span>{`${canUse}(${contract.Coin})`}</span></p>
                <p className="c-8"><span>{Intl.lang("trade.history.ForceDesc")}</span><span>{row.ForceDesc}</span></p>
                <p className="c-8"><span>{Intl.lang("trade.editOrder.marginPip")}</span><span>{baseMarginPip}</span></p>
                <p className="c-8"><span>{Intl.lang("trade.history.ScaleTxt")}</span><span>{Intl.lang("trade.preview.lever", row.Scale)}</span></p>
            </div>
            <div className="mt-20 easy-dialog-center">
                <p className="mt-10 fs16"><span>{Intl.lang("trade.editOrder.afterAdjuct")}</span><span></span></p>
                <p className="mt-10"><span>{Intl.lang("trade.history.ForceDesc")}</span><span>{force}</span></p>
                <p><span>{Intl.lang("trade.editOrder.marginPip")}</span><span>{marginPip}</span></p>
                <p><span>{Intl.lang("trade.history.ScaleTxt_O")}</span><span>{Intl.lang("trade.preview.lever", lever)}</span></p>
            </div>
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
            </div>
        </div>
    }
}

class AdjustForce extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;
        const contract = row.Contract;

        var marginPip = CfdTradeModel.formula.marginPips(row.Price, row.Scale, product.Pip);

        this.state = {
            forceClosePrice: String(row.Force), //强平价
            lever: row.Scale,
            deposit: Decimal.toFixed(row.MarginTotal, contract.ShowFixed),
            marginPip,
            baseMarginPip: marginPip
        };
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm){
            this.props.onClose();
            return;
        }

        const {row} = this.props;
        var {forceClosePrice, lever, deposit} = this.state;
        var Force = Number(forceClosePrice);
        if (Force<=0 || isNaN(lever) || isNaN(deposit)){
            Notification.error(Intl.lang("trade.openError.Force"));
            return;
        }
        var formData = {CID:row.CID, ID:row.ID, Target:CONST.FUT.Target.POSITION, Options:{Force}};
        Net.httpRequest("cfd/setup", formData, (data)=>{
            if (data.Status==0){
                this.props.onClose();
            }
        }, this);
    }

    onChangeForceClosePrice(val){
        if (val!=this.state.forceClosePrice){
            if (isNaN(val)) return;

            var data = {forceClosePrice:val};
            if (val){
                const {row, product} = this.props;
                const contract = row.Contract;

                var fundFee = Decimal.accSubtr(row.Fee, row.OpenFee);
                var unitDeposit = CfdTradeModel.formula.unitDeposit(row.Side, row.Price, val, row.Volume, row.OriginFee, fundFee, product.Pip, contract.Multiplier);
                if (Number(unitDeposit)<=0){
                    data.lever = '--';
                    data.deposit = '--';
                    data.marginPip = '--';
                }else{
                    var initMarginOld = CfdTradeModel.formula.leverDeposit(contract.Multiplier, row.Volume, row.Price, row.Scale, product.Pip);
                    var initMarginNew = Math.min(Number(initMarginOld), Number(Decimal.accMul(row.Volume, unitDeposit)));
                    var margin = Decimal.accAdd(Decimal.accSubtr(Decimal.accMul(row.Volume, unitDeposit), Decimal.accMul(CfdTradeModel.formula._liquidation, initMarginNew)), initMarginNew);
                    var lever = CfdTradeModel.formula.depositLever(contract.Multiplier, row.Price, product.Pip, row.Volume, initMarginNew);
                    if (Number(lever)<1 || Number(lever)>product.LeverMax){
                        data.lever = '--';
                        data.deposit = '--';
                        data.marginPip = "--";
                    }else{
                        data.lever = Decimal.toFixed(lever, product.ScaleFixed);
                        data.deposit = Decimal.toFixed(margin, contract.ShowFixed);
                        data.marginPip = CfdTradeModel.formula.marginPips(row.Price, lever, product.Pip);
                    }
                    // if (Number(initMarginNew)<Number(initMarginOld)){
                    //     var lever = CfdTradeModel.formula.depositLever(contract.Multiplier, row.Price, product.Pip, row.Volume, initMarginNew);
                    //     if (Number(lever)<1 || Number(lever)>product.LeverMax){
                    //         data.lever = '--';
                    //         data.deposit = '--';
                    //         data.marginPip = "--";
                    //     }else{
                    //         data.lever = Decimal.toFixed(lever, product.ScaleFixed);
                    //
                    //         var addDeposit = Math.max(0, Decimal.accSubtr(Decimal.accMul(unitDeposit, row.Volume), Decimal.accMul(initMarginNew, CfdTradeModel.formula.liq())));
                    //         data.deposit = Decimal.accAdd(initMarginNew, addDeposit, contract.ShowFixed);
                    //         data.marginPip = CfdTradeModel.formula.marginPips(row.Price, lever, product.Pip);
                    //     }
                    // }else{
                    //     data.lever = row.Scale;
                    //     data.deposit = Decimal.accAdd(Decimal.accSubtr(initMarginNew, initMarginOld), row.Margin, contract.ShowFixed);
                    //     data.marginPip = this.state.baseMarginPip
                    // }
                }
            }else{
                data.lever = '--';
                data.deposit = '--';
                data.marginPip = '--';
            }
            this.setState(data);
        }
    }
    render(){
        const {row, product, isSimple} = this.props;
        const {forceClosePrice, lever, deposit, marginPip} = this.state;

        const contract = row.Contract;

        return <div className="ft-easy-dialog-detail">
            <div className="tc">
                <h3>{Intl.lang("trade.contextMenu.adjustForce")}</h3>
                <h5>{`#${row.ID}`}</h5>
            </div>
            <div className="mt-20 easy-dialog-center">
                <div>
                    <div>{Intl.lang("trade.editOrder.forceClosePrice")}</div>
                    <OptionsNumberInput value={forceClosePrice} min={Number(product.UnitPrice)} step={Number(product.UnitPrice)} max={product.PriceMax} className="slider-number-box ver-md" onChange={this.onChangeForceClosePrice.bind(this)}/>
                </div>
                {/*<div className="c-8">*/}
                    {/*<span></span><span>{`+/-${Decimal.digit2Decimal(product.PriceFixed)}`}</span>*/}
                {/*</div>*/}
            </div>
            <div className="mt-20 easy-dialog-center">
                <p className="c-8"><span>{Intl.lang("trade.editOrder.deposit")}</span><span>{`${Decimal.toFixed(row.MarginTotal, contract.ShowFixed)}(${contract.Coin})`}</span></p>
                <p className="c-8"><span>{Intl.lang("trade.history.ScaleTxt")}</span><span>{Intl.lang("trade.preview.lever", row.Scale)}</span></p>
            </div>
            <div className="mt-20 easy-dialog-center">
                <p className="mt-10 c-8 fs16"><span>{Intl.lang("trade.editOrder.afterAdjuct")}</span><span></span></p>
                <p className="mt-10"><span>{Intl.lang("trade.editOrder.marginPip")}</span><span>{marginPip}</span></p>
                <p><span>{Intl.lang("trade.editOrder.deposit")}</span><span>{`${deposit}(${contract.Coin})`}</span></p>
                <p><span>{Intl.lang("trade.history.ScaleTxt_O")}</span><span>{Intl.lang("trade.preview.lever", lever)}</span></p>
            </div>
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
            </div>
        </div>
    }
}
