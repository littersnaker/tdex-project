import React from 'react';
import PureComponent from '../core/PureComponent';
import CfdTradeModel from '../model/cfd-trade';
import CFDLeverComp from './CFDLeverComp';
import Decimal from '../utils/decimal';
import OptionsNumberInput from "./OptionsNumberInput"

import Intl from '../intl';
import Event from "../core/event";
import Product from '../model/product';
import {Contrainer, DropDown} from "./DropDown";
import moment from "moment/moment";
import SysTime from "../model/system";
import {CONST} from "../public/const";
import ScrollArea from 'react-scrollbar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimerNumberInput from './TimerNumberInput';
import AuthModel from "../model/auth";
import Net from "../net/net";
import Notification from "../utils/notification";
import AccountModel from "../model/account";

const $ = window.$;

export default class CFDNewOrderForm extends PureComponent{
    constructor(props){
        super(props);

        var product = CfdTradeModel.getProduct(this.props.code);
        this.state = {
            product: product,
            currency: CfdTradeModel.getCurrency(),
            tab: CfdTradeModel.loadSetting(CfdTradeModel.formVar.tabKey)||1,
            lever: this.compareMaxLever(product),
            isAdvanced: false,
            volume: CfdTradeModel.loadSetting(CfdTradeModel.formVar.volumeKey),
            delegatePrice: product ? product.price.LAST||product.price.MID : "",
            isSubmiting: false,
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.code!=this.props.code){
            var product = CfdTradeModel.getProduct(nextProps.code);
            var lever = this.compareMaxLever(product);
            this.setState({product, delegatePrice: product ? product.price.LAST||product.price.MID : "", lever:lever})
        }
    }
    compareMaxLever(product){
        let initLever = CfdTradeModel.loadSetting(CfdTradeModel.formVar.leverKey)||1;
        if(product && product.LeverMax<initLever){
            initLever = product.LeverMax;
        }
        return initLever;
    }

    onChangeTab(tab){
        if (this.state.tab!=tab){
            this.setState({tab});

            CfdTradeModel.saveSetting(CfdTradeModel.formVar.tabKey, tab);
        }
    }

    onChangeLever(lever){
        if (this.state.lever!=lever){
            this.setState({lever});

            CfdTradeModel.saveSetting(CfdTradeModel.formVar.leverKey, lever);
        }
    }

    toggleAdvanced(){
        this.setState({isAdvanced:!this.state.isAdvanced});
    }

    close() {
        if (this.props.close) this.props.close();
    }

    onChangeVolume(volume){
        if (this.state.volume!=volume){
            this.setState({volume});

            CfdTradeModel.saveSetting(CfdTradeModel.formVar.volumeKey, volume);
        }
    }

    onChangeDelegatePrice(delegatePrice){
        if (this.state.delegatePrice!=delegatePrice){
            this.setState({delegatePrice});
        }
    }

    checkValidFormData = (formData)=>{
        const product = this.state.product;
        if (product){
            const contract = CfdTradeModel.getProductContract(product, this.state.currency);
            var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.CFD, this.state.currency);
            var canUse = wallet ? wallet.canUse : 0;

            return CfdTradeModel.checkFormData(formData, canUse, product, contract);
        }
        return {ok:false, error:[]};
    }

    onSubmit(side, e){
        e.preventDefault();
        e.stopPropagation();

        if (this.state.isSubmiting) return;

        if (!AuthModel.checkAuthAndRedirect()) return;

        var formData;

        var advData = {};
        if (this.advRef){
            advData = this.advRef.val();
        }

        const {tab, product, currency, lever, volume, delegatePrice} = this.state;
        if (tab==1){ //市价
            formData = {
                Price: 0,
                Strategy: CONST.FUT.Strategy.Immediate,
            };
        }else{ //限价
            formData = {
                Distance: false,
                Price: delegatePrice && !isNaN(delegatePrice) ? Number(delegatePrice) : null,
                Timely: CONST.FUT.Timely.GTC,
                TimelyParam: 0,
                Passive: false,
                Visible: -1,
                Strategy: CONST.FUT.Strategy.Immediate,
                Better: false,
            };
        }
        Object.assign(formData, advData);
        if (formData.SL){
            formData.SL.Param = formData.SL.Param*(side==CONST.FUT.Side.BUY?-1:1)
        }
        if (formData.TP){
            formData.TP.Param = formData.TP.Param*(side==CONST.FUT.Side.SELL?-1:1)
        }

        if (formData){
            formData.Side = side;

            if (product){
                var contract = CfdTradeModel.getProductContract(product, currency);
                if (contract){
                    formData.CID = contract.ID;
                    formData.Scale = Number(lever);
                    formData.Volume = Number(volume);

                    if (!formData.CID || (product.hasOwnProperty("Online") && !product.Online)){
                        Notification.error(Intl.lang("cfd.err.noOpen", product.DisplayName, contract.Coin));
                        return;
                    }

                    //市价单都可见
                    if (formData.Price == 0) formData.Visible = -1;

                    const {ok, error} = this.checkValidFormData(formData);
                    if (ok){
                        this.setState({isSubmiting:true});
                        Net.httpRequest("cfd/open", formData, (data)=>{
                            if (data.Status == 0){
                                Notification.success(Intl.lang('trade.open.ok'));
                            }
                            this.setState({isSubmiting:false}, ()=>{
                                if (data.Status == 0){
                                    this.close();
                                }
                            });
                        }, this);
                    }else{
                        error.forEach((v, i)=>{
                            Notification.error(v);
                        });
                    }
                }
            }
        }
    }

    render(){
        const {isMobile} = this.props;
        const {product, currency, tab, lever, isAdvanced, volume, delegatePrice, isSubmiting} = this.state;

        var isLmt = tab==2;
        var marginPips, contract;
        if (product){
            contract = CfdTradeModel.getProductContract(product, this.state.currency);
            if (isLmt){
                marginPips = product && product.Pip && lever && Number(lever) && delegatePrice && Number(delegatePrice) ? CfdTradeModel.formula.marginPips(delegatePrice, lever, product.Pip) : ""
            }
        }

        var winHeight = $(window).height();

        var tabList = ["futures.trade_title2", "futures.trade_title1"];

        var content = <div className="trading-content">
            <CFDPricePart product={product} currency={currency} />
            <ul className="market-or-price flex-space-between">
                {tabList.map((v,i)=>{
                    return <li className={tab==i+1?"on":""} key={"tab"+i} onClick={this.onChangeTab.bind(this, i+1)}>{Intl.lang(v)}</li>
                })}
            </ul>

            <ul className="num-or-price flex-start mt-10" style={{height:"25px"}}>
                <li>{Intl.lang("trade.history.ScaleTxt")}</li>
                <li className="w-40">{lever+'x'}</li>
                <CFDLeverComp value={lever} product={product} currency={currency} onChange={this.onChangeLever.bind(this)} />
            </ul>

            <ul className="num-or-price flex-space-between">
                <li>{Intl.lang("trade.history.Volume")}</li>
                <OptionsNumberInput value={volume}
                                    isRequire={false}
                                    min={1} max={contract ? contract.VolumeMax : 1000000}
                                    step={1} auto={true}
                                    onChange={this.onChangeVolume.bind(this)}
                                    contrainer={(input, increaseBtn, decreaseBtn, errMsg)=>{
                                        return <li className={"num-or-price-input"+(errMsg?" cfd-error":"")}>
                                            {decreaseBtn}
                                            {input}
                                            {errMsg && <p className="error-text">{errMsg}</p>}
                                            {increaseBtn}
                                        </li>
                                    }}
                                    inputComp={({...rest})=>{
                                        return <input {...rest}/>
                                    }}
                                    increaseComp={(disabled, {...rest})=>{
                                        return <i className={"iconfont icon-increase"+(disabled?" disable":"")} {...rest}></i>
                                    }}
                                    decreaseComp={(disabled, {...rest})=>{
                                        return <i className={"iconfont icon-decrease"+(disabled?" disable":"")} {...rest}></i>
                                    }} />
            </ul>
            {isLmt && <ul className="num-or-price flex-space-between">
                <li>{Intl.lang("TradeHistory.105")}</li>
                <OptionsNumberInput value={delegatePrice} step={product ? Number(product.UnitPrice) : 0} isRequire={false} min={product?product.MinTick:0} max={product?product.PriceMax:0} onChange={this.onChangeDelegatePrice.bind(this)}
                                    contrainer={(input, increaseBtn, decreaseBtn, errMsg)=>{
                                        return <li className={"num-or-price-input"+(errMsg?" cfd-error":"")}>
                                            {decreaseBtn}
                                            {input}
                                            {errMsg && <p className="error-text">{errMsg}</p>}
                                            {increaseBtn}
                                        </li>
                                    }}
                                    inputComp={({...rest})=>{
                                        return <input {...rest}/>
                                    }}
                                    increaseComp={(disabled, {...rest})=>{
                                        return <i className={"iconfont icon-increase"+(disabled?" disable":"")} {...rest}></i>
                                    }}
                                    decreaseComp={(disabled, {...rest})=>{
                                        return <i className={"iconfont icon-decrease"+(disabled?" disable":"")} {...rest}></i>
                                    }} />
            </ul>}
            <DepositBar product={product} currency={currency} isLmt={isLmt} lever={lever} volume={volume} delegatePrice={delegatePrice} />

            <p className={"high-options-tips flex-space-between"+(isAdvanced?" on":"")} onClick={this.toggleAdvanced.bind(this)}>{Intl.lang("cfd.advanced")}<i className="iconfont icon-xiala"></i></p>
            {isAdvanced && <AdvancePanel product={product} currency={currency} isLmt={isLmt} delegatePrice={delegatePrice} ref={(c)=>this.advRef=c}/>}

            <ul className="trading-btn flex-space-between">
                <li className={"sell"+(isSubmiting?" btnDis":"")} onClick={this.onSubmit.bind(this, CONST.FUT.Side.SELL)}>{Intl.lang("trade.sellTxt")}</li>
                <li className={"buy"+(isSubmiting?" btnDis":"")} onClick={this.onSubmit.bind(this, CONST.FUT.Side.BUY)}>{Intl.lang("trade.buyTxt")}</li>
            </ul>
            {isLmt && <div className="nodes-text">{Intl.lang("cfd.new.tip", delegatePrice, product ? product.Pip : "--", lever, marginPips||"--")}</div>}
        </div>

        return <div className="exchange-mask trading" style={isMobile?{width:"100%"}:{}}>
            {!isMobile && <i className="iconfont icon-close" onClick={()=>this.close()}></i>}
            <h3>{product ? product.DisplayName : "--"}</h3>
            {!isMobile ?
                <ScrollArea className="details-content"
                            style={{maxHeight: (winHeight - 90 - 55 - 25) + 'px'}}>{content}</ScrollArea>
                :
                content
            }
        </div>
    }
}

export class CFDPricePart extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
        }
    }
    componentWillMount(){
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
    }
    onUpdatePrice(){
        this.forceUpdate();
    }
    render(){
        const {product} = this.props;
        var price;
        if (product){
            price = product.price;
        }

        return (
            <ul className="buy-sell-title flex-space-between">
                <li>
                    <p className="title exchange-red">{price ? price.BID : '--'}</p>
                    <p className="text">{Intl.lang("cfd.new.fee", product ? product.Fee : "--")}</p>
                    <p className="sell exchange-red">{Intl.lang("trade.side.SELL")}</p>
                </li>
                <li>
                    <p className="title exchange-green">{price ? price.ASK : '--'}</p>
                    <p className="text">{Intl.lang("cfd.new.fee", product ? product.Fee : "--")}</p>
                    <p className="buy exchange-green">{Intl.lang("trade.side.BUY")}</p>
                </li>
                <span className="middle-text">{price ? Decimal.accDiv(Decimal.accSubtr(price.ASK, price.BID), product.UnitPrice) : '--'}</span>
            </ul>
        )
    }
}

export class DepositBar extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
    }

    onUpdatePrice(){
        if (!this.props.isLmt) this.forceUpdate();
    }

    render(){
        const {product, currency, isLmt, side, delegatePrice, lever, volume} = this.props;
        var contract, deposit = '--', price, sb = "";
        if (product){
            contract = CfdTradeModel.getProductContract(product, currency);
            price = product.price;
            var coinInfo = Product.getCoinInfo(currency);
            sb = coinInfo.Code;
            if (contract && lever && (isLmt && delegatePrice && Number(delegatePrice) || !isLmt) && volume && Number(volume)){
                var marginPips = CfdTradeModel.formula.marginPips(!isLmt?(side!==undefined ? (side==CONST.FUT.Side.BUY?price.ASK:price.BID) : price.LAST||price.MID):delegatePrice, lever, product.Pip);
                deposit = CfdTradeModel.formula.deposit(contract.Multiplier, marginPips, volume, coinInfo.ShowDigits);
            }
        }

        return <ul className="num-or-price flex-space-between" style={{height:"25px"}}>
                <li>{Intl.lang("futures.hist_title3")+Intl.lang("common.symbol.colon")}</li>
                <li className="tl wp-80">{deposit+" "+sb}</li>
            </ul>
    }
}

export class AdvancePanel extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            loss: 0,
            lossPrice: '',
            profit:0,
            profitPrice: '',
        }
    }

    componentDidMount() {
        this.onChangeLoss(1);
        this.onChangeProfit(1);
    }

    val(){
        var formData = {};
        if (this.props.isLmt){
            if (this.etRef){
                var data = this.etRef.val();
                Object.assign(formData, data);
            }
        }
        var data = this.state;
        //止盈止损
        if (data.loss && data.lossPrice){
            formData.SL = {
                Distance:  true,
                Param: Number(data.lossPrice)
            }
        }
        if (data.profit && data.profitPrice){
            formData.TP = {
                Distance:  true,
                Param: Number(data.profitPrice)
            }
        }

        return formData;
    }

    onChangeLoss(loss, e){
        if (this.state.loss!=loss) {
            this.setState({loss, lossPrice: ''});

            if (loss==1){
                this.onChangeLossPrice(Decimal.accMul(this.props.product.UnitPrice, CfdTradeModel.rangePricePoint));
            }
        }
        if (e) this.menuRef.hide();
    }

    onChangeProfit(profit, e){
        if (this.state.profit!=profit) {
            this.setState({profit, profitPrice: ''});

            if (profit==1){
                this.onChangeProfitPrice(Decimal.accMul(this.props.product.UnitPrice, CfdTradeModel.rangePricePoint));
            }
        }
        if (e) this.menuProfitRef.hide();
    }

    onChangeLossPrice(lossPrice){
        if (this.state.lossPrice!=lossPrice){
            this.setState({lossPrice})
        }
    }

    onChangeProfitPrice(profitPrice){
        if (this.state.profitPrice!=profitPrice){
            this.setState({profitPrice})
        }
    }

    render(){
        const {isLmt, product, currency, delegatePrice} = this.props;
        const {profit, loss, lossPrice, profitPrice} = this.state;

        var min = 0, max = 0;
        if (product){
            min = Number(product.UnitPrice);
            max = Number(Decimal.accMul(product.UnitPrice, product.PriceMaxPoint))
        }

        return <React.Fragment>
            {isLmt && <ExpireTimePart ref={(c)=>this.etRef=c} />}
            <ul className={"profit-or-loss flex-space-between on"}>
                <li>{Intl.lang("trade.open.loss")}</li>
                <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c}>
                    <li className="profit-or-loss-icon">{loss==0?Intl.lang("common.select")+Intl.lang("trade.open.optional") : Intl.lang("trade.open.lossProfitOption1")}<i className="iconfont icon-xiala"></i></li>
                </DropDown>
                <Contrainer ref={(c)=>this.menuRef = c} pnRef={()=>this.dropDownRef}>
                    <ul className="show-entrust-item all">
                        <li value={0} key={"loss0"} onClick={this.onChangeLoss.bind(this, 0)}>{Intl.lang("common.select")+Intl.lang("trade.open.optional")}</li>
                        <li value={1} key={"loss1"} onClick={this.onChangeLoss.bind(this, 1)}>{Intl.lang("trade.open.lossProfitOption1")}</li>
                    </ul>
                </Contrainer>
                <ul className="num-or-price flex-space-between">
                    <OptionsNumberInput className={loss!=0?"":"disable"} disabled={loss==0} value={lossPrice} isRequire={false} step={product ? Number(product.UnitPrice) : 0} min={min} max={max} onChange={this.onChangeLossPrice.bind(this)}
                                        contrainer={(input, increaseBtn, decreaseBtn, errMsg)=>{
                                            return <li className={"num-or-price-input"+(errMsg?" cfd-error":"")} style={{width:"100%"}}>
                                                {decreaseBtn}
                                                {input}
                                                {errMsg && <p className="error-text">{errMsg}</p>}
                                                {increaseBtn}
                                            </li>
                                        }}
                                        inputComp={({...rest})=>{
                                            return <input {...rest}/>
                                        }}
                                        increaseComp={(disabled, {...rest})=>{
                                            return <i className={"iconfont icon-increase"+(disabled?" disable":"")} {...rest}></i>
                                        }}
                                        decreaseComp={(disabled, {...rest})=>{
                                            return <i className={"iconfont icon-decrease"+(disabled?" disable":"")} {...rest}></i>
                                        }} />
                </ul>
            </ul>
            <ul className={"profit-or-loss flex-space-between on"}>
                <li>{Intl.lang("trade.open.profit")}</li>
                <DropDown trigger="click" menuRef={()=>this.menuProfitRef} ref={(c)=>this.ddProfitRef=c}>
                    <li className="profit-or-loss-icon">{profit==0?Intl.lang("common.select")+Intl.lang("trade.open.optional") : Intl.lang("trade.open.lossProfitOption1")}<i className="iconfont icon-xiala"></i></li>
                </DropDown>
                <Contrainer ref={(c)=>this.menuProfitRef = c} pnRef={()=>this.ddProfitRef}>
                    <ul className="show-entrust-item all">
                        <li value={0} key={"loss0"} onClick={this.onChangeProfit.bind(this, 0)}>{Intl.lang("common.select")+Intl.lang("trade.open.optional")}</li>
                        <li value={1} key={"loss1"} onClick={this.onChangeProfit.bind(this, 1)}>{Intl.lang("trade.open.lossProfitOption1")}</li>
                    </ul>
                </Contrainer>
                <ul className="num-or-price flex-space-between">
                    <OptionsNumberInput className={profit!=0?"":"disable"} disabled={profit==0} value={profitPrice} isRequire={false} step={product ? Number(product.UnitPrice) : 0} min={min} max={max} onChange={this.onChangeProfitPrice.bind(this)}
                                        contrainer={(input, increaseBtn, decreaseBtn, errMsg)=>{
                                            return <li className={"num-or-price-input"+(errMsg?" cfd-error":"")} style={{width:"100%"}}>
                                                {decreaseBtn}
                                                {input}
                                                {errMsg && <p className="error-text">{errMsg}</p>}
                                                {increaseBtn}
                                            </li>
                                        }}
                                        inputComp={({...rest})=>{
                                            return <input {...rest}/>
                                        }}
                                        increaseComp={(disabled, {...rest})=>{
                                            return <i className={"iconfont icon-increase"+(disabled?" disable":"")} {...rest}></i>
                                        }}
                                        decreaseComp={(disabled, {...rest})=>{
                                            return <i className={"iconfont icon-decrease"+(disabled?" disable":"")} {...rest}></i>
                                        }} />
                </ul>
            </ul>
        </React.Fragment>
    }
}

export class ExpireTimePart extends PureComponent{
    constructor(props){
        super(props);

        this.expireOptionsMap = {
            "1": "trade.open.gtcText",
            "2": "trade.open.expireOption2",
            "3": "trade.open.expireOption3"
        };
        this.expireOptions = Object.keys(this.expireOptionsMap);

        this.expireType2OptionsMap = {
            "1": "common.min",
            "2": "common.hour"
        }
        this.expireType2Options = Object.keys(this.expireType2OptionsMap);

        var nowTs = SysTime.getServerTimeStamp(true);
        var tzOffsetMin = SysTime.svrTzMin;
        var tzOffsetHour = tzOffsetMin/60;

        var hourOffset = "0"+Math.abs(tzOffsetHour)+"00";
        this.tzOffsetHour = (this.tzOffsetHour<0?"-":"+")+hourOffset.substr(-4);

        this.minDate = moment(nowTs);

        this.state = {
            expireType: 1, //过期时间类型
            expireType2Type: "1", //过期类型2的选项
            expireType2Time:"10", //过期类型2的时间值
            selectDate: moment(nowTs),
            utcTime:moment(nowTs+30*60*1000).utcOffset(tzOffsetMin).format('HH:mm')+':00'
        }
    }

    minTime(){
        var nowTs = SysTime.getServerTimeStamp(true);
        var tzOffsetMin = SysTime.svrTzMin;
        return moment(nowTs).utcOffset(tzOffsetMin);
    }

    val(){
        var data = this.state;
        var formData = {
            Timely: data.expireType==1 ? CONST.FUT.Timely.GTC : (data.expireType==2 ? CONST.FUT.Timely.LIFE : CONST.FUT.Timely.DEADLINE),
            TimelyParam: data.expireType==1 ? 0 : (data.expireType==2 ? (data.expireType2Time && !isNaN(data.expireType2Time) ? Number(data.expireType2Time)*(data.expireType2Type==1 ? 60 : 3600) : null) : (data.selectDate ? (moment(data.selectDate.format("YYYY-MM-DD")+ ' '+ data.utcTime+ " "+this.tzOffsetHour, "YYYY-MM-DD HH:mm:ss Z").unix()) : null)),
        }
        return formData;
    }

    onChangeExpireType(e){
        e.stopPropagation();

        var value = e.target.value;
        this.onChangeExpireTypeValue(value);
    }
    onChangeExpireTypeValue(expireType, e){
        if (this.state.expireType!=expireType){
            this.setState({expireType});
        }
        if (e) this.menuRef.hide();
    }

    onChangeExpireType2Type(value, e){
        if (this.state.expireType2Type!=value) {
            this.setState({expireType2Type: value});
        }
        if (e) this.et2Ref.hide();
    }
    onChangeExpireType2Time(value){
        this.setState({expireType2Time: value});
    }
    startDateChange(date){
        this.setState({selectDate:date});
    }
    onChangeUtcTime(value){
        this.setState({utcTime: value});
    }
    onChangeDate(type, value=1){
        var newDate;
        var selectDate = this.state.selectDate;
        if(type==1){
            newDate = selectDate.add(value, 'days');
        }else{
            var ts =  selectDate.diff(this.minDate);
            if (ts<=0) return;

            newDate = selectDate.subtract(value, 'days');
        }
        this.startDateChange(newDate);
    }

    render(){
        const {expireType,selectDate, expireType2Type,expireType2Time,utcTime} = this.state;

        return <React.Fragment>
            <div className="entrust-advanced">
            <ul className="entrust flex-space-between">
            <li>{Intl.lang("cfd.new.expire")}</li>
            <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c}>
            <li className="item wp-70 tr">{Intl.lang(this.expireOptionsMap[expireType])}<i className="iconfont icon-xiala"></i></li>
            </DropDown>
            <Contrainer ref={(c)=>this.menuRef = c} pnRef={()=>this.dropDownRef}>
                <ul className="show-entrust-item all">
                    {this.expireOptions && this.expireOptions.map((v, i)=>{
                        return <li key={"et"+v} onClick={this.onChangeExpireTypeValue.bind(this, v)}>{Intl.lang(this.expireOptionsMap[v])}</li>
                    })}
                </ul>
            </Contrainer>
        </ul>
        {expireType==2 && <ul className="entrust flex-space-between mt-3">
            <ul className="num-or-price flex-space-between" style={{margin:"0px"}}>
                <OptionsNumberInput min={1} max={1000000} step={1} value={expireType2Time} onChange={this.onChangeExpireType2Time.bind(this)}
                                    contrainer={(input, increaseBtn, decreaseBtn, errMsg)=>{
                                        return <li className={"num-or-price-input"+(errMsg?" cfd-error":"")}>
                                            {decreaseBtn}
                                            {input}
                                            {errMsg && <p className="error-text">{errMsg}</p>}
                                            {increaseBtn}
                                        </li>
                                    }}
                                    inputComp={({...rest})=>{
                                        return <input {...rest}/>
                                    }}
                                    increaseComp={(disabled, {...rest})=>{
                                        return <i className={"iconfont icon-increase"+(disabled?" disable":"")} {...rest}></i>
                                    }}
                                    decreaseComp={(disabled, {...rest})=>{
                                        return <i className={"iconfont icon-decrease"+(disabled?" disable":"")} {...rest}></i>
                                    }} />
                <li className="profit-or-loss-icon">
                    <DropDown trigger="click" menuRef={()=>this.et2Ref} ref={(c)=>this.et2ddRef=c}>{Intl.lang(this.expireType2OptionsMap[expireType2Type])}<i className="iconfont icon-xiala"></i></DropDown>
                    <Contrainer ref={(c)=>this.et2Ref = c} pnRef={()=>this.et2ddRef}>
                    <ul className="show-entrust-item right">
                        {this.expireType2Options && this.expireType2Options.map((v, i)=>{
                            return <li key={i} onClick={this.onChangeExpireType2Type.bind(this, v)}>{Intl.lang(this.expireType2OptionsMap[v])}</li>
                        })}
                    </ul>
                    </Contrainer>
                </li>

            </ul>
        </ul>}
            {expireType==3 && <ul className="entrust flex-space-between mt-3">
            <ul className="num-or-price flex-space-between" style={{margin:"0px"}}>
                <li className="num-or-price-input date-block wp-40">
                    <i className="iconfont icon-decrease" onClick={()=>this.onChangeDate(-1)}></i>
                    <DatePicker dateFormat="YYYY-MM-DD" className="date-class"
                                utcOffset={0}
                                selected={selectDate}
                                minDate={this.minDate}
                                onChange={this.startDateChange.bind(this)}>
                    </DatePicker>
                    <i className="iconfont icon-increase" onClick={()=>this.onChangeDate(1)}></i>
                </li>
                <TimerNumberInput value={utcTime} min={this.minTime} date={selectDate} format="HH:mm" onChange={this.onChangeUtcTime.bind(this)} contrainer={(input, increaseBtn, decreaseBtn)=>{
                    return <li className="num-or-price-input date-block wp-40">
                            {decreaseBtn}
                            {input}
                            {increaseBtn}
                    </li>
                }} increaseComp={(disabled, {...rest})=>{
                    return <i className={"iconfont icon-increase"+(disabled?" disable":"")} {...rest}></i>
                }}
                  decreaseComp={(disabled, {...rest})=>{
                      return <i className={"iconfont icon-decrease"+(disabled?" disable":"")} {...rest}></i>
                  }}/>

            </ul>
        </ul>}
                </div>
        </React.Fragment>

    }
}
