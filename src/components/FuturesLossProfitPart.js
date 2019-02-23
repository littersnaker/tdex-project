import React from 'react';

import Decimal from "../utils/decimal";
import FutTradeModel from "../model/fut-trade";
import Intl from "../intl";
import {CONST} from "../public/const";
import {isEmptyObject} from "../utils/util";
import PureComponent from "../core/PureComponent";
import AuthModel from "../model/auth";

import {SingleSelect, SelectOption} from "./SingleSelect";
import OptionsNumberInput from "./OptionsNumberInput"

export default class FutLossProfitPart extends PureComponent{
    constructor(props) {
        super(props);

        const {isMarketPrice} = this.props; //是否市价选项

        this.preferenceKey = "flpp";

        var Lang = Intl.getLang();

        var isDistance = false;

        this.updateSelectOptions(isMarketPrice, isDistance);

        const editMode = this.props.hasOwnProperty("editMode") ? this.props.editMode : '';
        var state = {
            expandedLossProfit: AuthModel.loadPreference(this.preferenceKey, true),
            editMode,
            lossFlag: editMode=='SL' ? true : false,
            profitFlag: editMode=='TP' ? true : false,
            loss: "",  //选项
            profit:"", //选项
            lossPrice:"",
            profitPrice:"",
            //影响止盈止损的设置
            delegateDistance: isDistance,
            delegateValue: '',
            Lang:Lang
        };

        if (this.props.order){
            var order = this.props.order;
            Object.assign(state, {
                expandedLossProfit: true,
                lossFlag: !this.props.hasOwnProperty("editMode") ? !!order.SL : state.lossFlag,
                profitFlag: !this.props.hasOwnProperty("editMode") ? !!order.TP : state.profitFlag,
            });

            if (order.orderType=='order'){
                state.delegateDistance = order.Distance;
                state.delegateValue = order.Price;
            }

            if (order.SL){
                state.loss = order.SL.Distance ? 1 : 2;
                state.lossPrice = Number(order.SL.Param);
            }else{
                state.loss = 1;
                // state.lossPrice = this.defaultLossPriceInputValue(1, order.Side, order.orderType=='order'?order.Price:'');
            }
            if (order.TP){
                state.profit = order.TP.Distance ? 1 : 2;
                state.profitPrice = Number(order.TP.Param);
            }else{
                state.profit = 1;
                // state.profitPrice = this.defaultProfitPriceInputValue(1, order.Side, order.orderType=='order'?order.Price:'');
            }

            if (this.props.editMode && this.props.editMode=='TP'){
                var isPosition = order.orderType=='position';
                state.isPosition = isPosition;

                if (isPosition){ //仓位 不允许设置价距
                    if (state.profitPrice) state.profitPrice = state.profit ==1 ? String(Decimal.accAdd(Number(this.props.product.price.LAST), state.profitPrice)) : state.profitPrice;
                    state.profit = 2;
                }
            }
        }

        this.state = state;
    }
    componentWillReceiveProps(nextProps){
        const {isMarketPrice,direction,conditionData} = nextProps;

        var state = {};
        var isChange = false;
        var loss = this.state.loss;
        var profit = this.state.profit;
        var distance = this.state.delegateDistance;

        if (conditionData && conditionData.quickDisable){
            distance = conditionData.delegatePriceType=='2';
            if (distance != this.state.delegateDistance){
                state.delegateDistance = distance;
                isChange = true;
            }
            if (!distance){
                state.delegateValue = conditionData.delegatePrice;

            }else{
                state.delegateValue = conditionData.delegatePoint;
            }

            if (state.delegateValue!=this.state.delegateValue){
                isChange = true;
            }
        }

        this.updateSelectOptions(isMarketPrice, distance);
        //从限价变市价时，值要重置，因为限价可能选择了第二项
        var isChangeLoss = false, isChangeProfit = false;
        if (isMarketPrice || distance){
            if (this.state.lossFlag){
                loss = this.selectOptions[0];
                if (this.state.loss!=loss){
                    isChangeLoss = true;
                    state.loss = loss;
                }
            }
            if (this.state.profitFlag){
                profit = this.selectOptions[0];
                if (this.state.profit!=profit){
                    isChangeProfit = true
                    state.profit = profit;
                }
            }
        }

        if (direction!=this.props.direction){ //方向改变或者点击刷新
            isChange = true;
        }
        if ((isChange || isChangeLoss) && this.state.lossFlag)this.propsChangeLossPrice(direction, loss, state);
        if ((isChange || isChangeProfit) && this.state.profitFlag)this.propsChangeProfitPrice(direction, profit, state);

        if (!isEmptyObject(state)) this.setState(state);

        // console.log(conditionData);
    }
    propsChangeLossPrice(direction, loss, state){
        // var price = this.defaultLossPriceInputValue(this.state.loss, this.state.direction, state.delegateValue);
        // var flag = state.hasOwnProperty("loss") && this.state.loss!=state.loss || state.hasOwnProperty("delegateDistance") && state.delegateDistance!=this.state.delegateDistance;
        if (direction==CONST.FUT.Side.BUY){
            // if (flag || state.hasOwnProperty("delegateValue") && Number(state.delegateValue)<=Number(this.state.lossPrice)){
            state.lossPrice = this.defaultLossPriceInputValue(loss, direction, state.delegateValue);
            // }
        }else{
            // if (flag || state.hasOwnProperty("delegateValue") && Number(state.delegateValue)>=Number(this.state.lossPrice)) {
            state.lossPrice = this.defaultLossPriceInputValue(loss, direction, state.delegateValue);
            // }
        }
    }
    propsChangeProfitPrice(direction, profit, state){
        if (direction==CONST.FUT.Side.BUY){
            state.profitPrice = this.defaultProfitPriceInputValue(profit, direction, state.delegateValue);
        }else if(direction==CONST.FUT.Side.SELL){
            state.profitPrice = this.defaultProfitPriceInputValue(profit, direction, state.delegateValue);
        }
    }
    //获取组件的数据
    val(){
        var data = {};
        var lossProfitData = this.state;
        if (lossProfitData.lossFlag){
            data.SL = {
                Distance:  lossProfitData.loss == 2 ? false : true,
                Param: Number(lossProfitData.lossPrice)
            }
        }
        if (lossProfitData.profitFlag){
            data.TP = {
                Distance:  lossProfitData.profit == 2 ? false : true,
                Param: Number(lossProfitData.profitPrice)
            }
        }
        return data;
    }
    toggleLossProfit() {
        var expandedLossProfit = !this.state.expandedLossProfit;
        this.setState({expandedLossProfit});

        AuthModel.savePreference(this.preferenceKey, expandedLossProfit);
    }
    updateSelectOptions(isMarketPrice, distance){
        this.selectOptions = isMarketPrice || distance ? [1] : [1, 2];
    }
    defaultLossPriceInputValue(loss, direction, price){
        // console.log(price);
        var step = FutTradeModel.getPriceOnePointValue(this.props.product.UnitPrice);
        var range = step<1 ? Number(Decimal.accMul(step, FutTradeModel.rangePricePoint)) : step*FutTradeModel.rangePricePoint;
        if (direction==CONST.TRADE.DIRECTION.BID) { //买单 止损<最新价
            range = -1*range;
        }

        if (loss==1){
            return range;
        }else{
            return Number(Decimal.accAdd(price||this.props.product.price.LAST, range));
        }
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
    getInputValueRange(type, priceType, direction, price, quickDisable){
        return FutTradeModel.getPLInputValueRange(type, priceType, direction, price||this.props.product.price.LAST, !quickDisable);
    }
    toggleLoss(e){
        var lossFlag = !this.state.lossFlag;
        var state = {lossFlag};
        if (lossFlag){
            var loss;
            if (this.selectOptions.indexOf(this.state.loss)==-1){
                loss = state.loss = this.selectOptions[0];
            }else{
                loss = this.state.loss;
            }
            state.lossPrice = this.defaultLossPriceInputValue(loss, this.props.direction, this.state.delegateValue);
        }
        this.setState(state);
    }
    toggleProfit(e){
        var profitFlag = !this.state.profitFlag;
        var state = {profitFlag};
        if (profitFlag){
            var profit;
            if (this.selectOptions.indexOf(this.state.profit)==-1){
                profit = state.profit = this.selectOptions[0];
            }else{
                profit = this.state.profit;
            }
            state.profitPrice = this.defaultProfitPriceInputValue(profit, this.props.direction, this.state.delegateValue);
        }
        this.setState(state);
    }
    // onChangeLoss(e){
    //     e.preventDefault();
    //     e.stopPropagation();
    //
    //     var loss = e.target.value;
    //     this.setState({loss:loss, lossPrice: this.defaultLossPriceInputValue(loss, this.props.direction, this.state.delegateValue)});
    // }
    onChangeLoss(loss){
        this.setState({loss:loss, lossPrice: this.defaultLossPriceInputValue(loss, this.props.direction, this.state.delegateValue)});
    }
    // onChangeProfit(e){
    //     e.preventDefault();
    //     e.stopPropagation();
    //
    //     var profit = e.target.value;
    //     this.setState({profit:profit, profitPrice:this.defaultProfitPriceInputValue(profit, this.props.direction, this.state.delegateValue)});
    // }
    onChangeProfit(profit){
        this.setState({profit:profit, profitPrice:this.defaultProfitPriceInputValue(profit, this.props.direction, this.state.delegateValue)});
    }
    onChangeLossPrice(value){
        this.setState({lossPrice:value});
    }
    onChangeProfitPrice(value){
        this.setState({profitPrice:value});
    }
    render(){
        const {product, order, direction, quickDisable} = this.props;
        const {editMode, lossFlag, profitFlag, expandedLossProfit,loss,profit,lossPrice,profitPrice,isPosition,delegateValue} = this.state;

        var selectOptions = this.selectOptions;
        var toCode = product ? product.toCode : '--';
        var text = "";
        if (!expandedLossProfit){
            // text = ": ";
            // if (lossFlag && profitFlag && loss == profit){
            //     text += Intl.lang("trade.open.lossProfitOption"+loss);
            //     text += (lossPrice ? lossPrice:"--") + " " + (loss==1?toCode:'');
            //     text += " / "+(profitPrice ? profitPrice:"--")+" " + (loss==1?toCode:'');
            // }else {
            //
            // }
            if(lossFlag && loss){
                if (Number(loss)==1){
                    text = Intl.lang("trade.open.lossTitle1", lossPrice?lossPrice:"--");
                }else{
                    text = Intl.lang("trade.open.lossTitle2", lossPrice?lossPrice:"--");
                }
            }
            if (profitFlag && profit){
                if (Number(profit)==1){
                    text += Intl.lang("trade.open.profitTitle1", profitPrice?profitPrice:"--");
                }else{
                    text += Intl.lang("trade.open.profitTitle2", profitPrice?profitPrice:"--");
                }
            }
        }

        // var min = FutTradeModel.getPriceOnePointValue(product.UnitPrice);
        var lossRange = [0, FutTradeModel.priceMax], profitRange = [0, FutTradeModel.priceMax];
        if (lossFlag){
            lossRange = this.getInputValueRange('SL', loss, direction, delegateValue, quickDisable);
        }
        if (profitFlag){
            profitRange = this.getInputValueRange('TP', profit, direction, delegateValue, quickDisable);
        }

        return (
            <div>
                {!order &&
                <div className="mt-10 tr">
                    <i className={expandedLossProfit ? "iconfont icon-hide fem125 pdr-10": "iconfont icon-show fem125 pdr-10"} onClick={this.toggleLossProfit.bind(this)}></i>
                    <span>{text ? '' : Intl.lang("trade.open.lossProfit")}</span><span>{text}</span>
                </div>}
                {expandedLossProfit && <div className="ft-stop-loss">
                    {(!editMode || editMode=='SL') && <dl className="form-box mt-5 f-clear">
                        {!editMode && <dt className="tl"><label className="custom-checkbox">
                            <div><input type="checkbox" className="input_check" checked={lossFlag} onChange={this.toggleLoss.bind(this)}/><i></i></div>
                            <span>{Intl.lang("trade.open.loss")+':'}</span></label></dt>}
                        {editMode=='SL' && <dt className="tl"><span>{Intl.lang("trade.open.loss")+':'}</span></dt>}
                        <dd className="f-clear">
                            <SingleSelect className="w-80 sel-cus fl" value={loss} disabled={!lossFlag} onChange={this.onChangeLoss.bind(this)}>
                                {selectOptions.map((v, i)=>{
                                    return <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={v} key={i}>{Intl.lang("trade.open.lossProfitOption"+v)}</SelectOption>
                                })}
                            </SingleSelect>
                            <OptionsNumberInput className={lossFlag?"slider-number-box ml-10":"slider-number-box ml-10 disable"} disabled={!lossFlag} value={lossPrice} isRequire={false} unit={loss==1 ? toCode : ""} step={product ? Number(product.UnitPrice) : 0} min={lossRange[0]} max={lossRange[1]} onChange={this.onChangeLossPrice.bind(this)}/>
                        </dd>
                    </dl>}
                    {(!editMode || editMode=='TP') && <dl className="form-box mt-5 f-clear">
                        {!editMode && <dt className="tl"><label className="custom-checkbox">
                            <div><input type="checkbox" className="input_check" checked={profitFlag} onChange={this.toggleProfit.bind(this)}/><i></i></div>
                            <span>{Intl.lang("trade.open.profit")+':'}</span></label></dt>}
                        {editMode=='TP' && <dt className="tl"><span>{Intl.lang("trade.open.profit")+':'}</span></dt>}
                        <dd className="f-clear">
                            <SingleSelect className="w-80 sel-cus fl" value={profit} disabled={!profitFlag} onChange={this.onChangeProfit.bind(this)}>
                                {selectOptions.map((v, i)=>{
                                    if (!isPosition || isPosition && v!=1)
                                        return <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={v} key={i}>{Intl.lang("trade.open.lossProfitOption"+v)}</SelectOption>
                                })}
                            </SingleSelect>
                            <OptionsNumberInput className={profitFlag?"slider-number-box ml-10":"slider-number-box ml-10 disable"} disabled={!profitFlag} value={profitPrice} isRequire={false} unit={profit==1 ? toCode : ""} step={product ? Number(product.UnitPrice) : 0} min={profitRange[0]} max={profitRange[1]} onChange={this.onChangeProfitPrice.bind(this)}/>
                        </dd>
                    </dl>}
                </div>}
            </div>
        )
    }
}
