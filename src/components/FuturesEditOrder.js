import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';
// import ReactTooltip from 'react-tooltip'
// import moment from 'moment';
// import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import FutTradeModel from '../model/fut-trade';
import {FutTradeFormExpert, FutPricePart, FutTradeProduct} from './FuturesNewOrderExpert';
import FutLossProfitPart from './FuturesLossProfitPart';
import DelegrateQtyExpireTimePart from './DelegrateQtyExpireTimePart';
import OptionsNumberInput from "./OptionsNumberInput"
// import TimerNumberInput from "./TimerNumberInput"
import {CONST} from "../public/const"
import PopDialog from "../utils/popDialog"
import Net from '../net/net';
import Decimal from '../utils/decimal';
import {SingleSelect, SelectOption} from "./SingleSelect";
import {IS_TRADE_V2} from "../config";
// import {NotShowDialogCheckbox} from './FuturesPreviewSimple'

import Notification from '../utils/notification';
import AccountModel from "../model/account";
import {Confirm} from './Common';
import {FutOrderWarning} from './FuturesOrderPreview';

// 非直接成交关系:
// 就是触发后丢出去的委托价格不会造成立即成交（把触发价当成最新价来判断是否立即成交）
// 比如多单的平仓委托，触发价是10000，如果委托价是9000，那就是市价卖出的效果；而如果委托价时11000，那就是挂在上面等着卖，这种才可以勾选‘被动’‘隐藏’；这个限制可以帮助用户减少误操作
export default class FuturesEditOrder extends PureComponent {
    constructor(props) {
        super(props);

        const rows = this.props.data;
        const row = rows[0];

        var product = FutTradeModel.getProductByID(row.CID);

        var state = {
            row: row,
            product,
        };

        //仓位的，非订单
        if (!row.PID){
            this.deposit = row.Deposit;
            this.con = FutTradeModel.getCon(row.CID);
            this.risks = FutTradeModel.getRisks(row.CID);
            this.calcFixed = product.CalcFixed;
            this.MarginTotal = row.MarginTotal;

            //追加保证金
            this.addDeposit = String(Decimal.accSubtr(row.Margin, row.Deposit));

            // this.reduceInfo = FutTradeModel.formula.getCanReduceMargin(this.con, row.Volume, row.Price, this.deposit, this.addDeposit, row.Repay, this.risks);
        }
        this.state = state;
    }

    close() {
        PopDialog.closeByDomID('order-edit');
    }

    setRef(ref){
        this.subRef = ref;
    }

    onClickSubmit(e){
        e.preventDefault();
        e.stopPropagation();

        if (this.subRef && this.subRef.onConfirm){
            this.subRef.onConfirm(e, true);
        }
    }

    editOrder(e, formData, callback){
        if (this.state.row){
            // var data = {ID: this.state.row.ID, Info:formData};
            const {ok, error} = FutTradeModel.checkFormData(formData);
            if (ok){
                formData.ID = this.state.row.ID;
                FutTradeModel.replace(formData, (data)=>{
                    if (callback) callback(data.Status == 0);
                    if (data.Status==0){
                        this.close();

                        // FutTradeModel.loadOrders();
                    }
                }, this);
            }else{
                error.forEach((v, i)=>{
                    Notification.error(v);
                });
                if (callback)callback(false);
            }
        }
    }
    render() {
        const {option, isSimple} = this.props;
        const {row, product} = this.state;
        const skin = FutTradeModel.getSkin();

        return !isSimple ? (
            <section className={"ft-trade-panel shadow-w futures-bg-"+skin} id="order-edit" style={{width: 320}}>
                <header className="dialog-head tc lh-25">
                    <h3 className="ft-dialog-head fem875 tb">
                        <span>{Intl.lang("trade.contextMenu." + option)}</span> <span>{row.ID}</span></h3>
                    <i className="iconfont icon-close transit fem875" onClick={this.close.bind(this)}></i>
                </header>
                <div className="ft-order-box pd010 fem75 pdb-10 pdt-3 border-none">
                    {option!='editOrder' && <div className="ft-order-market">
                        <FutTradeProduct product={product} isExpert={true} order={row}/>
                        <div className="pos-r">
                            <FutPricePart product={product} disable={true} order={row} />
                        </div>

                        {option == 'conditionClose' &&
                        <ConditionClose row={row} product={product} ref={this.setRef.bind(this)} onClose={this.close.bind(this)}/>
                        }
                        {option=='splitPosition' &&
                        <SplitPosition row={row} product={product} ref={this.setRef.bind(this)} onClose={this.close.bind(this)} />
                        }
                        {option=='adjustLever' &&
                        <AdjustLever product={product} row={row} ref={this.setRef.bind(this)} onClose={this.close.bind(this)}/>
                        }
                        {option=='addDeposit' &&
                        <AdjustDeposit product={product} row={row} ref={this.setRef.bind(this)} onClose={this.close.bind(this)} />
                        }
                        {option=='adjustForce' &&
                        <AdjustForce product={product} row={row} ref={this.setRef.bind(this)} onClose={this.close.bind(this)} />
                        }
                        {(option == 'setSL' || option == 'editSL') &&
                        <EditSL row={row} product={product} option={option} ref={this.setRef.bind(this)} onClose={this.close.bind(this)} />
                        }
                        {(option=='setTP' || option=='editTP') &&
                        <EditTP row={row} product={product} option={option} ref={this.setRef.bind(this)} onClose={this.close.bind(this)} />}

                        {option != 'conditionClose' &&
                        <div className="ft-order-limit lh-25">
                            <div className="limit-btn-box flex-box flex-jc mt-10">
                                <button className="btn btn-submit wp-100"
                                        onClick={this.onClickSubmit.bind(this)}>{Intl.lang("common.submit")}</button>
                            </div>
                        </div>
                        }
                        {/*{option == 'splitPosition' &&*/}
                        {/*<div className="mt-10 c-8">*/}
                            {/*<span>{Intl.lang("Recharge.note")+Intl.lang("common.symbol.colon")+ Intl.lang("trade.split.tip")}</span>*/}
                        {/*</div>*/}
                        {/*}*/}
                    </div>}
                    {option=='editOrder' &&
                    <FutTradeFormExpert product={product} order={row} onSubmit={this.editOrder.bind(this)} className="ft-order-market"/>
                    }
                </div>
            </section>
        ) : (
            <section className={"ft-trade-easy-panel shadow-w futures-bg-"+skin} id="order-edit" style={{minWidth: "320px"}}>
                <header className="dialog-head tc lh-25">
                    <i className="iconfont icon-close transit fem875" onClick={this.close.bind(this)}></i>
                </header>
                {option == 'conditionClose' &&
                <ConditionClose row={row} product={product} onClose={this.close.bind(this)} isSimple={true} />
                }
                {option=='splitPosition' &&
                <SplitPosition row={row} product={product} onClose={this.close.bind(this)} isSimple={true} />
                }
                {option=='adjustLever' &&
                <AdjustLever product={product} row={row} onClose={this.close.bind(this)} isSimple={true}/>
                }
                {option=='addDeposit' &&
                <AdjustDeposit product={product} row={row} onClose={this.close.bind(this)}  isSimple={true}/>
                }
                {option=='adjustForce' &&
                <AdjustForce product={product} row={row} onClose={this.close.bind(this)}  isSimple={true}/>
                }
                {(option == 'setSL' || option == 'editSL') &&
                <EditSL row={row} product={product} option={option} onClose={this.close.bind(this)} isSimple={true}/>
                }
                {(option=='setTP' || option=='editTP') &&
                <EditTP row={row} product={product} option={option} onClose={this.close.bind(this)} isSimple={true}/>}
            </section>
        )
    }
}

//设置止损 编辑止损
//还没有仓位的，按下单方式修改
//有仓位的，按新的方式修改
class EditSL extends PureComponent{
    constructor(props) {
        super(props);

        this.leverOptions = FutTradeModel.leverOptions;

        this.lossOptionsMap = {
            "1": "trade.open.condition1",
            // "2": "trade.open.condition2",
            "3": "trade.editOrder.lossOption3",
            // "4": "trade.editOrder.lossOption4",
        };
        if (!IS_TRADE_V2){
            this.lossOptionsMap["2"] = "trade.open.condition2";
            this.lossOptionsMap["4"] = "trade.editOrder.lossOption4";
        }

        this.lossOptions = Object.keys(this.lossOptionsMap);

        var row = this.props.row;

        var hasPosition = row.hasOwnProperty("PID") ? !!FutTradeModel.getPosition(row.PID) : true; //是否已触发在仓位栏
        var relateRow;
        if (row.hasOwnProperty("PID")){
            if (hasPosition) relateRow = FutTradeModel.getPosition(row.PID);
            else relateRow = FutTradeModel.getOpenOrder(row.PID);
        }
        var realRow = relateRow||this.props.row;
        var state = {hasPosition, product: FutTradeModel.getProductByID(row.CID), realRow,
            triggerPrice:"", triggerPoint:"", loss:0, delegatePriceType:0, delegatePrice:"",delegatePoint:""};

        if (hasPosition){
            var order = realRow;
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
            }else{
                state.loss = 1;
                // Object.assign(state, this.getDefaultValue(order, state.loss))
            }
        }

        this.state = state;
    }
    val(){
        var {realRow, hasPosition, triggerPrice, triggerPoint, loss, delegatePriceType,delegatePrice,delegatePoint} = this.state;
        var formData = {};
        if (hasPosition){ //有仓位的
            var data = {};

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
            if (realRow.SL){
                if ([3, 4].indexOf(loss)!=-1 && triggerPoint==="" || [1, 2].indexOf(loss)!=-1 && triggerPrice===""){
                    FutTradeModel.cancelOrders([realRow.SLorder], ()=>{
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
            if (realRow.SL){ //setup修改订单
                var row = realRow.SLorder;
                formData.CID = row.CID;
                formData.ID = row.ID;
                var options = {};
                for (var key in data){
                    options[key] = data[key];
                }
                formData.Options = options;
                formData.ApiName = "futures/setup";
            }else{//调用setsl
                formData.CID = realRow.CID;
                formData.ID = realRow.ID; //仓位ID
                formData.Visible = -1;
                delete data.Relative;

                Object.assign(formData, data);
                formData.ApiName = "futures/setsl";
            }
        }else{
            var data = this.refs.FutLossProfitPart.val();
            var newFormData = Object.assign({}, realRow, data);
            const {ok, error} = FutTradeModel.checkFormDataSL(newFormData);
            if (ok) {
                if (realRow.SL) {//调用setup修改订单
                    var row = realRow.SLorder;
                    formData.CID = row.CID;
                    formData.ID = row.ID;
                    formData.Options = {
                        Constant: data.SL.Param,
                        Relative: data.SL.Distance
                    }
                    formData.ApiName = "futures/setup";
                } else { //调用relace去设置
                    Object.assign(formData, realRow);
                    formData.SL = data.SL;
                    formData.ApiName = "futures/replace";
                }
            }else{
                error.forEach((v, i)=>{
                    Notification.error(v);
                });
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
            if (apiName=='futures/replace'){
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
            Object.assign(data, this.getDefaultValue(this.state.realRow, val));

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

        var newPrice = row.Product.price.LAST || row.Product.price.MID || row.Price;

        //买单 触发价>=price 卖单 触发价<=price
        var point = Decimal.accMul(FutTradeModel.rangeTriggerPricePoint, FutTradeModel.getPriceOnePointValue(row.Product.UnitPrice));
        if (side==CONST.FUT.Side.SELL){
            point = -1*point;
        }
        data.triggerPoint = String(point);
        data.triggerPrice = String(Decimal.accAdd(newPrice, point));

        if (condition==2){
            var range = Decimal.accMul(FutTradeModel.rangeDelegatePricePoint, FutTradeModel.getPriceOnePointValue(row.Product.UnitPrice));
            if (side==CONST.FUT.Side.BUY){
                range = -1*range;
            }
            data.delegatePrice = String(Decimal.accAdd(data.triggerPrice, range));
            data.delegatePoint = String(range);
        }else{
            var range = Decimal.accMul(FutTradeModel.rangeDelegatePricePoint, FutTradeModel.getPriceOnePointValue(row.Product.UnitPrice));
            if (side==CONST.FUT.Side.BUY){
                range = -1*range;
            }
            data.delegatePrice = String(Decimal.accAdd(newPrice, range));
            data.delegatePoint = String(range);
        }


        return data;
    }
    getTriggerInputValueRange(direction, priceType){
        return FutTradeModel.getPLInputValueRange('SL', priceType, direction, this.props.row.Product.price.LAST)
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
        const {isSimple, option, row} = this.props;
        const {product, hasPosition, realRow, triggerPrice,triggerPoint, loss, delegatePriceType,delegatePrice,delegatePoint} = this.state;

        const volume = realRow.Volume;
        const min = FutTradeModel.getPriceOnePointValue(product.UnitPrice);

        const isLimit = [2, 4].indexOf(Number(loss))!=-1;

        const revertSide = realRow.Side==CONST.FUT.Side.BUY ? CONST.FUT.Side.SELL : CONST.FUT.Side.BUY;
        //比如多单的平仓委托(=空单)，触发价是10000，如果委托价是9000，那就是市价卖出的效果；而如果委托价时11000，那就是挂在上面等着卖，这种才可以勾选‘被动’‘隐藏’
        const isShow = loss==2 && !isNaN(triggerPrice) && !isNaN(delegatePrice) && FutTradeModel.isShowDQETPart(revertSide, 1, triggerPrice, delegatePriceType, delegatePriceType==1?delegatePrice:delegatePoint)
            || loss==4 && !isNaN(triggerPoint) && !isNaN(delegatePoint) && FutTradeModel.isShowDQETPart(revertSide, 2, triggerPoint, delegatePriceType, delegatePoint);

        const isTrail = [3, 4].indexOf(Number(loss))!=-1;

        const range = this.getTriggerInputValueRange(realRow.Side, isTrail?1:2);
        // const realRow = relateRow || row;
        return isSimple ?
            (
                <div className="ft-easy-dialog-detail">
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
            )
            :
            (
                hasPosition ?
            (
                <div>
                <div className="mt-10 flex-box flex-end">
                    <div className="w-80 mr-10">{Intl.lang("futures.hist_title10")+':'}</div>
                    <SingleSelect className="w-80 fl" value={loss} onChange={this.onChangeLoss.bind(this)}>
                        {this.lossOptions.map((v, i)=>{
                            return <SelectOption value={v} key={i}>{Intl.lang(this.lossOptionsMap[v])}</SelectOption>
                        })}
                    </SingleSelect>
                    {!isTrail &&
                    <OptionsNumberInput className="slider-number-box ml-10" value={triggerPrice} isRequire={false} step={Number(product.UnitPrice)} min={range[0]} max={range[1]} onChange={this.onChangeLossPrice.bind(this)}/>}
                    {isTrail &&
                    <OptionsNumberInput className="slider-number-box ml-10" value={triggerPoint} isRequire={false} step={Number(product.UnitPrice)} min={range[0]} max={range[1]} onChange={this.onChangeLossPoint.bind(this)} />}
                </div>
                {isLimit &&
                <div className="mt-10 flex-box flex-end">
                    <div className="w-80 mr-10">{Intl.lang("trade.open.delegatePrice")+':'}</div>
                    <SingleSelect className="w-80 fl" value={delegatePriceType} onChange={this.onChangeDelegatePriceType.bind(this)}>
                        {this.delegatePriceOptions.map((v, i)=>{
                            return <SelectOption value={v} key={i}>{Intl.lang("trade.open.delegateOption"+v)}</SelectOption>
                        })}
                    </SingleSelect>
                    {delegatePriceType==1 &&
                    <OptionsNumberInput className="slider-number-box" value={delegatePrice} isRequire={false} step={Number(product.UnitPrice)} min={min} max={FutTradeModel.priceMax} onChange={this.onChangeDelegatePrice.bind(this)} />}
                    {delegatePriceType==2 &&
                    <OptionsNumberInput className="slider-number-box" value={delegatePoint} isRequire={false} step={Number(product.UnitPrice)} min={-(min*1000)} max={FutTradeModel.priceMax} onChange={this.onChangeDelegatePoint.bind(this)} />}
                </div>
                }
                {isShow &&
                <DelegrateQtyExpireTimePart quickDisable={true} volume={volume} ref="delegrateQtyExpireTimePart" />
                }
            </div>)
            :
            (<FutLossProfitPart ref="FutLossProfitPart" product={product} isMarketPrice={realRow.Kind==CONST.FUT.Kind.MKT} quickDisable={true} direction={realRow.Side} order={realRow} editMode="SL"/>)
            )
    }
}

class EditTP extends PureComponent{
    constructor(props) {
        super(props);

        var row = this.props.row;

        var hasPosition = row.hasOwnProperty("PID") ? !!FutTradeModel.getPosition(row.PID) : true; //是否已触发在仓位栏
        var relateRow;
        if (row.hasOwnProperty("PID")){
            if (hasPosition) relateRow = FutTradeModel.getPosition(row.PID);
            else relateRow = FutTradeModel.getOpenOrder(row.PID);
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
        var step = FutTradeModel.getPriceOnePointValue(this.props.product.UnitPrice);
        var range = step<1 ? Number(Decimal.accMul(step, FutTradeModel.rangePricePoint)) : step*FutTradeModel.rangePricePoint;
        if (direction==CONST.TRADE.DIRECTION.ASK){//买单 止盈>最新价
            range = -1*range;
        }
        if (profit==1){
            return range;
        }else{
            return Number(Decimal.accAdd(price||this.props.product.price.LAST, range));
        }
    }
    val(){
        var formData = {};
        var {hasPosition, realRow} = this.state;
        var lpPart = this.refs.FutLossProfitPart;
        var data = {}, val;
        if (lpPart){
            val = lpPart.val();
        }else if (this.props.isSimple){
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
                        FutTradeModel.cancelOrders([realRow.TPorder], ()=>{
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
                formData.ApiName = "futures/setup";
            }else{//调用setsl
                formData.CID = realRow.CID;
                formData.ID = realRow.ID; //仓位ID
                formData.Visible = -1;
                formData.Strategy = CONST.FUT.Strategy.Immediate;
                // formData.Variable = CONST.FUT.Variable.LastPrice;

                Object.assign(formData, data);
                formData.ApiName = "futures/settp";
            }
        }else{
            var newFormData = Object.assign({}, realRow, val);
            if (!hasPosition){
                const {ok, error} = FutTradeModel.checkFormDataTP(newFormData);
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
                formData.ApiName = "futures/setup";
            }else{ //调用relace去设置
                Object.assign(formData, realRow);
                formData.TP = val.TP;
                formData.ApiName = "futures/replace";
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
            if (apiName=='futures/replace'){
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
        const {product, isSimple, option, row} = this.props;
        const {hasPosition, realRow, profit, profitPrice} = this.state;
        const volume = realRow.Volume;

        const profitOptions = hasPosition ? [2] : [1,2];

        var profitRange = profitRange = [0, FutTradeModel.priceMax];
        profitRange = FutTradeModel.getPLInputValueRange('TP', profit, row.Side, product.price.LAST, false);

        // var isShow;
        // if (realRow.Side==CONST.FUT.Side.BUY){
        //     if (Number(closePositionPrice) <= Number(product.price.BID)){
        //         isShow = false;
        //     }
        // }else{
        //     if (Number(closePositionPrice) >= Number(product.price.ASK)){
        //         isShow = false;
        //     }
        // }
        //
        // var isShow = true;

        return isSimple ?
            (
                <div className="ft-easy-dialog-detail">
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
                                <DelegrateQtyExpireTimePart quickDisable={true} volume={volume} ref="delegrateQtyExpireTimePart" order={realRow.TPorder} isSimple={true}/>
                            </div>
                        </div>
                    </div>
                    <div className="mt-20 easy-dialog-show"></div>
                    <div className="easy-dialog-foot flex-sb mt-10">
                        <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                        <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
                    </div>
                </div>
            )
            :
            (
            hasPosition ? <div>
                <FutLossProfitPart ref="FutLossProfitPart" product={product} isMarketPrice={realRow.Kind==CONST.FUT.Kind.MKT} quickDisable={true} direction={realRow.Side} order={realRow} editMode="TP"/>
                <DelegrateQtyExpireTimePart quickDisable={true} volume={volume} ref="delegrateQtyExpireTimePart" order={realRow.TPorder} />
            </div>
            :
            <FutLossProfitPart ref="FutLossProfitPart" product={product} isMarketPrice={realRow.Kind==CONST.FUT.Kind.MKT} quickDisable={true} direction={realRow.Side} order={realRow} editMode="TP"/>
            )
    }
}

class ConditionClose extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;

        var range = Decimal.accMul(FutTradeModel.rangePricePoint, FutTradeModel.getPriceOnePointValue(row.Product.UnitPrice));
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
                if (orderData.Visible===null){
                    Notification.error(Intl.lang("trade.openError.Visible"));
                    return;
                }
            }

            // var formData = {List:[orderData]};
            formData = orderData;

            var apiName = "futures/settp"
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
                FutTradeModel.cancelOrders([order], ()=>{
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

            Net.httpRequest("futures/setup", formData, (data)=>{
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
        const min = FutTradeModel.getPriceOnePointValue(product.UnitPrice);

        var profitRange = [0, FutTradeModel.priceMax];
        profitRange = FutTradeModel.getPLInputValueRange('TP', 2, row.Side, product.price.LAST, false);

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

        return isSimple ? (
            <div className="ft-easy-dialog-detail">
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
                            <DelegrateQtyExpireTimePart quickDisable={true} volume={row.Volume} ref="delegrateQtyExpireTimePart" order={row.CLOSEorder} isSimple={true}/>
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
        ) : (
            <div>
                <div className="mt-3 tr">
                    <span>{Intl.lang('trade.editOrder.closePosPrice') + ':'}</span>
                    <OptionsNumberInput className="slider-number-box ml-10" value={closePositionPrice} isRequire={false}
                                        step={Number(product.UnitPrice)} min={profitRange[0]} max={profitRange[1]}
                                        onChange={this.onChangeClosePositionPrice.bind(this)}/>
                </div>
                {isShow && <DelegrateQtyExpireTimePart quickDisable={true} volume={row.Volume} ref="delegrateQtyExpireTimePart" order={row.CLOSEorder} />}
                <div className="ft-order-limit lh-25">
                    <div className="limit-btn-box flex-box flex-jc mt-10">
                        <button className="btn btn-submit wp-100" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("common.submit")}</button>
                    </div>
                </div>
            </div>

        )
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
            Net.httpRequest("futures/split", {CID:row.CID, ID:row.ID, Volume:Number(splitVolume)}, (data)=>{
                if (data.Status==0){
                    this.props.onClose();
                    // FutTradeModel.loadPosition();
                }
            }, this);
        }

        if (row.TP || row.SL){
            if (this.props.isSimple){
                PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("Recharge.note")} content={Intl.lang("trade.split.tip")}
                                        yestxt={Intl.lang("trade.editOrder.confirm")} notxt={Intl.lang("common.cancel")} callback={()=>{
                    _reqSplit();
                }} cancel={()=>{
                    this.props.onClose();
                }}/>, "alert_panel");
            }else{
                PopDialog.open(<FutOrderWarning msg="trade.split.tip" confirm="common.confirm" cancel="common.cancel" onConfirm={(e, result)=>{
                    if (result){
                        _reqSplit();
                    }else{
                        this.props.onClose();
                    }
                }} />, "order-warning", true);
            }
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

        return isSimple ? (<div className="ft-easy-dialog-detail">
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
            </div>)
            :
            (
                <div>
                    <div className="mt-3 tr disable">
                        <span>{Intl.lang('trade.editOrder.orderVol')+':'}</span>
                        <OptionsNumberInput value={volume} step={1} className="slider-number-box ver-md" min={1} disabled={true} />
                    </div>
                    <div className="mt-3 tr">
                        <span>{Intl.lang('trade.editOrder.splitVol') + ':'}</span>
                        <OptionsNumberInput className="slider-number-box ml-10" value={splitVolume}
                                            step={1} min={1} max={volume-1}
                                            onChange={this.onChangeSplitVolume.bind(this)}/>
                    </div>
                </div>
            )
    }
}

class AdjustLever extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;
        this.leverOptions = FutTradeModel.leverOptions;

        this.state = {
            lever: row.Scale,
            deposit: row.MarginTotal,
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
        if (Number(lever)<0.01){
            Notification.error(Intl.lang("trade.openError.Scale"));
            return;
        }

        var formData = {CID:row.CID, ID:row.ID, Target:CONST.FUT.Target.POSITION, Options:{Scale:Number(lever)}};
        Net.httpRequest("futures/setup", formData, (data)=>{
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

            if (Number(val)>=0.01 && Number(val)<=20){
                const {row, product} = this.props;
                var initMarginOld = FutTradeModel.formula.leverDeposit(product.Scale, row.Volume, row.Scale, row.Price);
                var initMarginNew = FutTradeModel.formula.leverDeposit(product.Scale, row.Volume, val, row.Price);
                var depositChange = Decimal.accSubtr(initMarginNew, initMarginOld);
                var deposit = Decimal.accAdd(row.MarginTotal, depositChange);

                var stat = FutTradeModel.getProductPosStat(row.CID);
                var posTotalVolume = (stat ? stat.volume : 0);

                var keepDeposit = FutTradeModel.formula.getKeepDeposit(product.Scale, row.Price, row.Volume, posTotalVolume, product.Risks);
                //强平价
                var force = FutTradeModel.formula.getForceClosePrice(product.Scale, row.Volume, row.Side, row.Price, deposit, keepDeposit, row.FundFee, product.TakerFee, product.AvgPriceFixed);
                this.setState({deposit, depositChange, force});
            }
        }
    }

    render(){
        const {row, product, isSimple} = this.props;
        const {lever, deposit, force, depositChange} = this.state;

        const depositChangeFixed = Decimal.toFixed(depositChange, product.ShowFixed);
        return isSimple ? (<div className="ft-easy-dialog-detail">
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
                    <OptionsNumberInput value={lever} options={this.leverOptions} labelFormat="%sx" step={0.01} unit="x" className="slider-number-box ver-md" min={Decimal.getDotDigit(lever)>2 ? 0.000001:0.01} max={20} onChange={this.onChangeLever.bind(this)}/>
                </div>
                <p className="mt-10 c-8 fs16"><span>{Intl.lang("trade.editOrder.afterAdjuct")}</span><span></span></p>
                <p className="mt-10"><span>{Intl.lang("trade.history.ForceDesc")}</span><span>{force}</span></p>
                <p><span>{Intl.lang("trade.editOrder.deposit")}</span><span>{`${Decimal.toFixed(deposit, product.ShowFixed)}(${product.fromCode})`}</span></p>
                <p><span>{Intl.lang("trade.editOrder.depositChange")}</span><span>{`${Number(depositChangeFixed)>0?'+':''}${depositChangeFixed}(${product.fromCode})`}</span></p>
            </div>
            <div className="mt-20 easy-dialog-show"></div>
            <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
            </div>
        </div>)
            :
            (
                <div className="mt-3 tr">
                    <span>{Intl.lang('trade.open.lever')+':'}</span>
                    <OptionsNumberInput value={lever} options={this.leverOptions} labelFormat="%sx" step={0.01} unit="x" className="slider-number-box ver-md" min={Decimal.getDotDigit(lever)>2 ? 0.000001:0.01} max={20} onChange={this.onChangeLever.bind(this)}/>
                </div>
            )
    }
}

class AdjustDeposit extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;
        this.leverOptions = FutTradeModel.leverOptions;

        this.state = {
            margin: row.MarginTotal,
            force: row.ForceDesc,
            lever: row.Scale
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
        var Margin = IS_TRADE_V2 ? Number(margin) : Number(Decimal.accDiv(margin, row.Volume));
        var formData = {CID:row.CID, ID:row.ID, Target:CONST.FUT.Target.POSITION, Options:{Margin}};
        Net.httpRequest("futures/setup", formData, (data)=>{
            if (data.Status==0){
                this.props.onClose();
            }
        }, this);
    }

    onChangeMargin(val){
        if (this.state.margin!=val){
            if (isNaN(val)) return;

            const {row, product} = this.props;
            if (Number(val) >= Number(row.MarginTotal)){
                var stat = FutTradeModel.getProductPosStat(row.CID);
                var posTotalVolume = stat ? stat.volume : 0;

                var keepDeposit = FutTradeModel.formula.getKeepDeposit(product.Scale, row.Price, row.Volume, posTotalVolume, product.Risks);
                //强平价
                var force = FutTradeModel.formula.getForceClosePrice(product.Scale, row.Volume, row.Side, row.Price, val, keepDeposit, row.FundFee, product.TakerFee, product.AvgPriceFixed);
                this.setState({margin:val, force, lever: row.Scale});
            }else{
                var stat = FutTradeModel.getProductPosStat(row.CID);
                var posTotalVolume = stat ? stat.volume : 0;

                var keepDeposit = FutTradeModel.formula.getKeepDeposit(product.Scale, row.Price, row.Volume, posTotalVolume, product.Risks);

                var limitForce;
                if (row.Side==CONST.FUT.Side.BUY) {
                    //强平价上限
                    limitForce = Decimal.accSubtr(product.price.MARK, Decimal.accMul(Math.abs(Decimal.accSubtr(row.Price, product.price.MARK)), product.LimitSecurity));
                }else{
                    // 允许强平价下限
                    limitForce = Decimal.accAdd(product.price.MARK, Decimal.accMul(Math.abs(Decimal.accSubtr(row.Price, product.price.MARK)), product.LimitSecurity));
                }
                // 计算最少保证金
                var minMargin = FutTradeModel.formula.forceToMargin(product.Scale, row.Side, row.Volume, row.Price, limitForce, keepDeposit, row.FundFee, product.TakerFee);

                if (!val || Number(val) < Number(minMargin)){
                    this.setState({margin:val, force:'--', lever:'--'});
                }else{
                    // var newMargin = Decimal.accSubtr(val, row.CoinFee);
                    var newMargin = val;
                    var initMargin = FutTradeModel.formula.leverDeposit(product.Scale, row.Volume, row.Scale, row.Price);
                    // 需要调整杠杆
                    if (Number(newMargin) < Number(initMargin)){
                        var lever = FutTradeModel.formula.depositToLever(newMargin, product.Scale, row.Volume, row.Price);
                        if (Number(lever)<0.01 || Number(lever)>20){
                            this.setState({margin:val, force:'--', lever:'--'});
                        }else{
                            // 剩余初始化保证金算出杠杆
                            var force = FutTradeModel.formula.getForceClosePrice(product.Scale, row.Volume, row.Side, row.Price, val, keepDeposit, row.FundFee, product.TakerFee, product.AvgPriceFixed);
                            this.setState({margin:val, force, lever:Decimal.toFixed(lever, product.ScaleFixed)});
                        }
                    }else{
                        var force = FutTradeModel.formula.getForceClosePrice(product.Scale, row.Volume, row.Side, row.Price, val, keepDeposit, row.FundFee, product.TakerFee, product.AvgPriceFixed);
                        this.setState({margin:val, force, lever:row.Scale});
                    }
                }
            }
        }
    }

    render(){
        const {row, product, isSimple} = this.props;
        const {margin, force, lever} = this.state;

        var canUse = 0;
        var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT, product.Currency);
        if (wallet) {
            canUse = Decimal.format(wallet.canUse, product.ShowFixed);
        }

        return isSimple ? (<div className="ft-easy-dialog-detail">
                <div className="tc">
                    <h3>{Intl.lang("trade.contextMenu.addDeposit")}</h3>
                    <h5>{`#${row.ID}`}</h5>
                </div>
                <div className="mt-20 easy-dialog-center">
                    <div>
                        <div>{Intl.lang("trade.editOrder.deposit")}</div>
                        <OptionsNumberInput value={margin} min={0} max={FutTradeModel.priceMax} className="slider-number-box ver-md" onChange={this.onChangeMargin.bind(this)}/>
                    </div>
                    <div className="c-8">
                        {/*<span></span><span>+/-0.0012</span>*/}
                    </div>
                </div>
                <div className="mt-20 easy-dialog-center">
                    <p className="c-8"><span>{Intl.lang("futures.can_use")}</span><span>{`${canUse}(${product.fromCode})`}</span></p>
                    <p className="c-8"><span>{Intl.lang("trade.history.ForceDesc")}</span><span>{row.ForceDesc}</span></p>
                    <p className="c-8"><span>{Intl.lang("trade.history.ScaleTxt")}</span><span>{Intl.lang("trade.preview.lever", row.Scale)}</span></p>
                </div>
                <div className="mt-20 easy-dialog-center">
                    <p className="mt-10 c-8 fs16"><span>{Intl.lang("trade.editOrder.afterAdjuct")}</span><span></span></p>
                    <p className="mt-10"><span>{Intl.lang("trade.history.ForceDesc")}</span><span>{force}</span></p>
                    <p><span>{Intl.lang("trade.history.ScaleTxt_O")}</span><span>{Intl.lang("trade.preview.lever", lever)}</span></p>
                </div>
                <div className="mt-20 easy-dialog-show"></div>
                <div className="easy-dialog-foot flex-sb mt-10">
                    <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                    <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
                </div>
            </div>)
            :
            (
                <div>
                    <div className="mt-3 tr">
                        <span>{Intl.lang('trade.history.MarginTotalDesc')+':'}</span>
                        <OptionsNumberInput value={margin} min={0} max={FutTradeModel.priceMax} className="slider-number-box ver-md" onChange={this.onChangeMargin.bind(this)}/>
                    </div>
                </div>
            )
    }
}

class AdjustForce extends PureComponent{
    constructor(props) {
        super(props);

        const {row, product} = this.props;

        this.state = {
            forceClosePrice: String(row.Force), //强平价
            lever: row.Scale,
            deposit: Decimal.toFixed(row.MarginTotal, product.ShowFixed)
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
        Net.httpRequest("futures/setup", formData, (data)=>{
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
                if (row.Side == CONST.FUT.Side.BUY){
                    // 调整后的强平价上限
                    var maxForce = Decimal.accSubtr(product.price.MARK, Decimal.accMul(Math.abs(Decimal.accSubtr(row.Price, product.price.MARK)), product.LimitSecurity));
                    if (Number(val)>Number(maxForce)){
                        data.lever = '--';
                        data.deposit = '--';
                    }else{
                        var stat = FutTradeModel.getProductPosStat(row.CID);
                        var posTotalVolume = stat ? stat.volume : 0;

                        var keepDeposit = FutTradeModel.formula.getKeepDeposit(product.Scale, row.Price, row.Volume, posTotalVolume, product.Risks);
                        //增减保证金
                        var val1 = Decimal.accDiv(Decimal.accSubtr(Decimal.accDiv(Decimal.accMul(row.Price, product.Scale*row.Volume), val), product.Scale*row.Volume), row.Price);
                        var val2 = Decimal.accSubtr(Decimal.accSubtr(Decimal.accSubtr(row.Margin, row.FundFee), keepDeposit), Decimal.accDiv(Decimal.accMul(product.TakerFee, product.Scale*row.Volume), row.Price));
                        var inc = Decimal.accSubtr(val1, val2);
                        var newMargin = Decimal.accAdd(row.Margin, inc);
                        if (Number(newMargin)<=0){
                            data.lever = '--';
                            data.deposit = '--';
                        }else{
                            var initMargin = FutTradeModel.formula.leverDeposit(product.Scale, row.Volume, row.Scale, row.Price);
                            if (Number(newMargin)<Number(initMargin)){
                                var lever = FutTradeModel.formula.depositToLever(newMargin, product.Scale, row.Volume, row.Price);
                                if (Number(lever)<0.01 || Number(lever)>20){
                                    data.lever = '--';
                                }else{
                                    data.lever = Decimal.toFixed(lever, product.ScaleFixed);
                                }
                            }else{
                                data.lever = row.Scale;
                            }
                            data.deposit = Decimal.toFixed(newMargin, product.ShowFixed);
                        }
                    }
                }else{
                    // 当前允许强平价下限
                    var minForce = Decimal.accAdd(product.price.MARK, Decimal.accMul(Math.abs(Decimal.accSubtr(row.Price, product.price.MARK)), product.LimitSecurity));
                    if (Number(val)<Number(minForce)){
                        data.lever = '--';
                        data.deposit = '--';
                    }else{
                        var stat = FutTradeModel.getProductPosStat(row.CID);
                        var posTotalVolume = stat ? stat.volume : 0;

                        var keepDeposit = FutTradeModel.formula.getKeepDeposit(product.Scale, row.Price, row.Volume, posTotalVolume, product.Risks);
                        //增减保证金
                        var val1 = Decimal.accDiv(Decimal.accSubtr(product.Scale*row.Volume, Decimal.accDiv(Decimal.accMul(row.Price, product.Scale*row.Volume), val)), row.Price);
                        var val2 = Decimal.accSubtr(Decimal.accSubtr(Decimal.accSubtr(row.Margin, row.FundFee), keepDeposit), Decimal.accDiv(Decimal.accMul(product.TakerFee, product.Scale*row.Volume), row.Price));
                        var inc = Decimal.accSubtr(val1, val2);
                        var newMargin = Decimal.accAdd(row.Margin, inc);
                        if (Number(newMargin)<0){
                            data.lever = '--';
                            data.deposit = '--';
                        }else{
                            var initMargin = FutTradeModel.formula.leverDeposit(product.Scale, row.Volume, row.Scale, row.Price);
                            if (Number(newMargin)<Number(initMargin)){
                                var lever = FutTradeModel.formula.depositToLever(newMargin, product.Scale, row.Volume, row.Price);
                                if (Number(lever)<0.01 || Number(lever)>20){
                                    data.lever = '--';
                                }else{
                                    data.lever = Decimal.toFixed(lever, product.ScaleFixed);
                                }
                            }else{
                                data.lever = row.Scale;
                            }
                            data.deposit = Decimal.toFixed(newMargin, product.ShowFixed);
                        }
                    }
                }
            }else{
                data.lever = '--';
                data.deposit = '--';
            }
            this.setState(data);
        }
    }
    render(){
        const {row, product, isSimple} = this.props;
        const {forceClosePrice, lever, deposit} = this.state;

        return isSimple ? (<div className="ft-easy-dialog-detail">
                <div className="tc">
                    <h3>{Intl.lang("trade.contextMenu.adjustForce")}</h3>
                    <h5>{`#${row.ID}`}</h5>
                </div>
                <div className="mt-20 easy-dialog-center">
                    <div>
                        <div>{Intl.lang("trade.editOrder.forceClosePrice")}</div>
                        <OptionsNumberInput value={forceClosePrice} min={1} step={Decimal.digit2Decimal(product.AvgPriceFixed)} max={FutTradeModel.priceMax} className="slider-number-box ver-md" onChange={this.onChangeForceClosePrice.bind(this)}/>
                    </div>
                    <div className="c-8">
                        <span></span><span>{`+/-${Decimal.digit2Decimal(product.AvgPriceFixed)}`}</span>
                    </div>
                </div>
                <div className="mt-20 easy-dialog-center">
                    <p className="c-8"><span>{Intl.lang("trade.editOrder.deposit")}</span><span>{`${Decimal.toFixed(row.MarginTotal, product.ShowFixed)}(${product.fromCode})`}</span></p>
                    <p className="c-8"><span>{Intl.lang("trade.history.ScaleTxt")}</span><span>{Intl.lang("trade.preview.lever", row.Scale)}</span></p>
                </div>
                <div className="mt-20 easy-dialog-center">
                    <p className="mt-10 c-8 fs16"><span>{Intl.lang("trade.editOrder.afterAdjuct")}</span><span></span></p>
                    <p className="mt-10"><span>{Intl.lang("trade.editOrder.deposit")}</span><span>{`${deposit}(${product.fromCode})`}</span></p>
                    <p><span>{Intl.lang("trade.history.ScaleTxt_O")}</span><span>{Intl.lang("trade.preview.lever", lever)}</span></p>
                </div>
                <div className="mt-20 easy-dialog-show"></div>
                <div className="easy-dialog-foot flex-sb mt-10">
                    <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                    <button className="btn easy-btn-submit" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang("trade.editOrder.confirm")}</button>
                </div>
            </div>)
            :
            (<div>
            <div className="mt-3 tr">
                <span>{Intl.lang('trade.editOrder.forceClosePrice')+':'}</span>
                <OptionsNumberInput value={forceClosePrice} min={0} max={FutTradeModel.priceMax} step={Decimal.digit2Decimal(product.AvgPriceFixed)} className="slider-number-box ver-md" onChange={this.onChangeForceClosePrice.bind(this)}/>
            </div>
        </div>)
    }
}
