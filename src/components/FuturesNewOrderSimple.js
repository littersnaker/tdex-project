import React from 'react';
import Intl from "../intl";
import FutTradeModel from "../model/fut-trade";
import Decimal from "../utils/decimal";
import {CONST} from "../public/const";
import AuthModel from "../model/auth";
import Event from "../core/event";
import AccountModel from "../model/account";

import PureComponent from "../core/PureComponent";
import OptionsNumberInput from "./OptionsNumberInput"

import {SingleSelect, SelectOption} from "./SingleSelect";
import 'react-datepicker/dist/react-datepicker.css';
import DepositStatBar from './DepositStatBar';
import DelegrateQtyExpireTimePart from './DelegrateQtyExpireTimePart';
import FutLeverComp from "./FuturesLeverComp";
import FutVolumeSlider from "./FuturesVolumeSlider";

import {DropDown,Contrainer} from './DropDown';
import {getCurrencySymbol} from "../utils/common";
import {IS_ENGINE_TRADING} from "../config";
import Product from "../model/product";
import {IS_CLOSE_EXCHANGE} from "../config"

export class FutTradeFormSimple extends PureComponent{
    constructor(props){
        super(props);

        this.isLogin = AuthModel.checkUserAuth();

        this.leverPreKey = FutTradeModel.formVar.leverPreKey;
        this.volumePreKey = FutTradeModel.formVar.volumePreKey;

        this.leverOptions = FutTradeModel.formVar.leverOptions;
        this.volOptions = FutTradeModel.formVar.volOptions;

        this.unitFees = {};
        this.unitFees[CONST.FUT.Side.BUY] = 0;
        this.unitFees[CONST.FUT.Side.SELL] = 0;

        this.setDefaultPrice = this.setDefaultPrice.bind(this)

        this.state = this.initState(this.props);
    }

    initState(props){
        var state = {
            tab: FutTradeModel.loadSetting("simpleTab")||1,
            lever:FutTradeModel.isSharedLimit() ? 20 : AuthModel.loadPreference(this.leverPreKey, 20),
            volume:AuthModel.loadPreference(this.volumePreKey, ""),
            delegatePrice:"",  //限价（委托价）
            unitFee: "", //单位保证金
            tradeType: 1, //1 限价 2市价
            triggerType: 0, //触发价格类型
            triggerPrice: '', //触发价
            loss:0,
            lossPrice: '',
            profit:0,
            profitPrice: '',
            isSubmiting: false
        };

        return state;
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRICE_UPDATE, this.setDefaultPrice, this);
        Event.addListener(Event.EventName.PRICE_SELECT, this.onSelectPrice.bind(this), this);

        this.setDefaultPrice();
    }

    changeTab(tab){
        if (this.state.tab!=tab){
            this.setState({tab, delegatePrice:""}, ()=>{
                this.setDefaultPrice();
            });
            FutTradeModel.saveSetting("simpleTab", tab);
        }
    }

    onSelectPrice(data){
        if (this.state.tab == 1 || this.state.tab==3 && this.state.tradeType==1){
            this.onChangeDelegatePrice(data.Price);
        }else if (this.state.tab==3 && this.state.tradeType==3){
            this.onChangeTriggerPrice(data.Price);
        }
    }

    setDefaultPrice(){
        //限价时
        if (this.state.tab==1 || (this.state.tab==3 && this.state.tradeType==1)){
            if (!this.state.delegatePrice){
                var product = this.props.product;
                if (product){
                    var price = product.price;
                    if (price && Number(price.LAST)){
                        this.setState({delegatePrice: Decimal.toFixed(price.LAST, product.PriceFixed)});
                        Event.removeListener(Event.EventName.PRICE_UPDATE, this.setDefaultPrice);
                    }
                }
            }
        }
        //市价tab时需要用到
        else{
            var product = this.props.product;
            if (product) {
                var price = product.price;
                if (price && Number(price.MARK)){
                    this.forceUpdate();
                    Event.removeListener(Event.EventName.PRICE_UPDATE, this.setDefaultPrice);
                }
            }
        }
    }

    onChangeLever(val){
        if (this.state.lever!=val){
            this.setState({lever:val});

            AuthModel.savePreference(this.leverPreKey, Number(val));
        }
    }

    onChangeVolume(val){
        if (Number(val)>0){
            this.setState({volume:val});
            AuthModel.savePreference(this.volumePreKey, Number(val));
        }
    }

    onOptionChange(option){
        var {total, fee} = this.getTotalVolume();
        return String(Decimal.accMul(total, option, 0));
    }

    getTotalVolume(){
        var total = 0, fee = 0;
        if (AuthModel.checkUserAuth()){
            const {product} = this.props;

            if (product){
                var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT, product.Currency);
                if (wallet){
                    var canUse = wallet.canUse;

                    if (this.unitFee && Number(this.unitFee)>0){
                        fee = this.unitFee;
                        total = Decimal.accDiv(canUse, fee, 0, true);
                        total = Number(total)>FutTradeModel.volumeMax ? FutTradeModel.volumeMax : total;
                    }
                }
            }
        }
        return {total, fee};
    }

    onChangeDelegatePrice(value){
        var data = {delegatePrice: value};
        this.setState(data);
    }

    onChangeUnitFee(unitFee, side){
        this.unitFees[side] = unitFee;
        this.unitFee = Math.max(this.unitFees[CONST.FUT.Side.BUY], this.unitFees[CONST.FUT.Side.SELL]);
    }

    onChangeTradeType(tradeType){
        if (this.state.tradeType!=tradeType){
            var triggerType = tradeType==3?2:0;
            this.onChangeTriggerType(triggerType);
            this.setState({tradeType, delegatePrice:""}, ()=>{
                this.setDefaultPrice();
            });
        }
    }

    onChangeTriggerType(triggerType){
        if (this.state.triggerType!=triggerType){
            var triggerPrice = triggerType > 0 ? this.defaultTriggerPrice(triggerType) : '';
            this.setState({triggerType, triggerPrice});
        }
    }

    defaultTriggerPrice(triggerType){
        const {product} = this.props;
        if (product && product.price){
            var price = product.price;
            if (triggerType==1){
                return Decimal.toFixed(price.MARK, product.PriceFixed)
            }else{
                return Decimal.toFixed(price.LAST, product.PriceFixed)
            }
        }
    }

    onChangeTriggerPrice(value){
        this.setState({triggerPrice: value});
    }

    onChangeLoss(loss){
        if (this.state.loss!=loss){
            this.setState({loss, lossPrice:''});
            if (loss==1){
                this.onChangeLossPrice(FutTradeModel.rangePricePoint);
            }
        }
    }

    onChangeLossPrice(lossPrice){
        if (this.state.lossPrice!=lossPrice){
            this.setState({lossPrice})
        }
    }

    onChangeProfit(profit){
        if (this.state.profit!=profit){
            this.setState({profit, profitPrice:''});
            if (profit==1){
                this.onChangeProfitPrice(FutTradeModel.rangePricePoint);
            }
        }
    }

    onChangeProfitPrice(profitPrice){
        if (this.state.profitPrice!=profitPrice){
            this.setState({profitPrice})
        }
    }

    val(){
        var dqPart = this.refs.delegrateQtyExpireTimePart;
        return dqPart ? Object.assign({}, dqPart.val(), this.state) : Object.assign({}, this.state);
    }

    onSubmit(e, side){
        e.preventDefault();
        e.stopPropagation();

        if (!AuthModel.checkAuthAndRedirect()) return;

        var formData;
        var data = this.val();
        if (data.tab==1){ //限价
            formData = {
                Distance: false,
                Price: data.delegatePrice && !isNaN(data.delegatePrice) ? Number(data.delegatePrice) : null,
                Timely: CONST.FUT.Timely.GTC,
                TimelyParam: 0,
                Passive: false,
                Visible: -1,
                Strategy: CONST.FUT.Strategy.Immediate,
                Better: false,
            };
        }else if(data.tab==2){ //市价
            formData = {
                Price: 0,
                Strategy: CONST.FUT.Strategy.Immediate,
            };
        }else{ //高级
            if (data.tradeType==1){ //限价
                formData = {
                    Distance: false,
                    Price: data.delegatePrice && !isNaN(data.delegatePrice) ? Number(data.delegatePrice) : null,
                    Timely: data.Timely,
                    TimelyParam: data.TimelyParam,
                    Passive: data.Passive,
                    Visible: data.Visible,
                    Strategy: CONST.FUT.Strategy.Immediate,
                    Better: false,
                };
            }else{ //市价和条件委托
                formData = {
                    Distance: false,
                    Price: 0,
                    Strategy: CONST.FUT.Strategy.Immediate,
                    Better: false,
                };
                if (data.triggerPrice && Number(data.triggerPrice)){
                    formData.Strategy = CONST.FUT.Strategy.Line;
                    formData.Variable = data.triggerType==1 ? CONST.FUT.Variable.MarkPrice : CONST.FUT.Variable.LastPrice;
                    formData.Constant = data.triggerPrice && !isNaN(data.triggerPrice) ? Number(data.triggerPrice) : null;
                }
            }

            //止盈止损
            if (data.loss && data.lossPrice){
                formData.SL = {
                    Distance:  true,
                    Param: Number(data.lossPrice)*(side==CONST.FUT.Side.BUY?-1:1)
                }
            }
            if (data.profit && data.profitPrice){
                formData.TP = {
                    Distance:  true,
                    Param: Number(data.profitPrice)*(side==CONST.FUT.Side.SELL?-1:1)
                }
            }
        }

        if (formData){
            formData.Side = side;

            var product = this.props.product;
            if (product){
                formData.CID = product.ID;
                formData.Scale = Number(this.state.lever);
                formData.Volume = Number(this.state.volume);

                //市价单都可见
                if (formData.Price == 0) formData.Visible = -1;

                this.setState({isSubmiting:true});
                this.props.onSubmit(e, formData, (result)=>{
                    this.setState({isSubmiting:false});
                    if (result) this.forceUpdate();
                });
            }
        }
    }

    render(){
        const {product} = this.props;
        const {tab, lever, volume, delegatePrice, tradeType, triggerType, triggerPrice, loss, lossPrice, profit, profitPrice, isSubmiting} = this.state;
        var min = product ? FutTradeModel.getPriceOnePointValue(product.UnitPrice) : 0;

        var isLmt = tab==1 || (tab==3 && tradeType==1);
        var unit = '--', delegateValue='--';
        var buyBtnDis = false, sellBtnDis = false;
        if (product) {
            var con = FutTradeModel.getCon(product.ID);
            var sb = getCurrencySymbol(product.Currency);
            if (sb) unit = sb.sn;
            var dprice = isLmt ? delegatePrice: (tradeType==3 ? triggerPrice : product.price.LAST);
            if (volume && dprice && volume>0)delegateValue = FutTradeModel.formula.delegateValue(con, dprice, volume, product.ShowFixed)
        }

        return(
            <div className="ft-newOrder-easy">
                <dl className="mt-10 ft-easy-block ">
                    <dd className="ft-easy-tab">
                        <span className={tab==1?"current":""} onClick={()=>this.changeTab(1)}>{Intl.lang("trade.open.simpleTab1")}</span>
                        <span className={tab==2?"current":""} onClick={()=>this.changeTab(2)}>{Intl.lang("trade.open.simpleTab2")}</span>
                        <span className={tab==3?"current":""} onClick={()=>this.changeTab(3)}>{Intl.lang("trade.open.simpleTab3")}</span>
                    </dd>
                </dl>
                <div className="ft-newOrder-easy-detail">
                    <FutLeverComp value={lever} onChange={this.onChangeLever.bind(this)} />
                    {tab==3 && <dl className="mt-10 ft-easy-block">
                        <dt>{Intl.lang("trade.history.TypeDesc_O")}</dt>
                        <dd className="ft-easy-tab">
                            <SingleSelect className="wp-100 cursor-h" value={tradeType} onChange={this.onChangeTradeType.bind(this)}>
                                {[1,2].map((v, i)=>{
                                    return <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={v} key={"ty"+v}>{Intl.lang("futures.trade_title"+v)}</SelectOption>
                                })}
                                <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={3} key={"ty3"}>{Intl.lang("trade.open.simpleTradeType")}</SelectOption>
                            </SingleSelect>
                        </dd>
                    </dl>}
                    {(tab==3 && tradeType==3) && <dl className="mt-10 ft-easy-block">
                        <dt>{Intl.lang("trade.history.TriggerPrice_O")}</dt>
                        <dd className="block-right">
                            <SingleSelect className="select w-100 sel-cus fl selection" value={triggerType} onChange={this.onChangeTriggerType.bind(this)}>
                                <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={1} key={"tty1"}>{Intl.lang("trade.history.Mark")}</SelectOption>
                                <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={2} key={"tty2"}>{Intl.lang("trade.open.lastPrice")}</SelectOption>
                            </SingleSelect>
                            <OptionsNumberInput className={triggerType!=0?"slider-number-box":"slider-number-box disable"} disabled={triggerType==0} value={triggerPrice} step={product ? Number(product.UnitPrice) : 0} min={min} max={FutTradeModel.priceMax} onChange={this.onChangeTriggerPrice.bind(this)} />
                        </dd>
                    </dl>}
                    <dl className="mt-10 ft-easy-block">
                        <dt>{Intl.lang(tab==3 && tradeType==3 ? "trade.open.delegatePrice2": "trade.open.price")}</dt>
                        {!isLmt ?
                            (<dd className="ft-easy-tab"><div className="easy-price-dis">{Intl.lang("futures.trade_title2")}</div></dd>)
                            :
                            (<dd className="ft-easy-tab slider-type1 f-clear">
                            <OptionsNumberInput className="slider-number-box" value={delegatePrice} step={product ? Number(product.UnitPrice) : 0} min={min} max={FutTradeModel.priceMax} onChange={this.onChangeDelegatePrice.bind(this)} />
                        </dd>)
                        }
                    </dl>

                    <FutVolumeSlider value={volume} onChange={this.onChangeVolume.bind(this)} product={product} onOptionChange={this.onOptionChange.bind(this)} getTotalVolume={this.getTotalVolume.bind(this)} />

                    <dl className="mt-10 ft-easy-block">
                        <dt></dt>
                        <dd className="block-right">{Intl.lang("futures.order_val")} ≈ {delegateValue + " "+unit}</dd>
                    </dl>

                    {(tab==3 && tradeType==1) && <DelegrateQtyExpireTimePart ref="delegrateQtyExpireTimePart" volume={volume} isSimple={true} quickDisable={true}/>}

                    {tab==3 && <dl className="mt-25 ft-easy-block f-clear">
                        <dt className="tl">
                            <label className="custom-checkbox">
                                <span>{Intl.lang("trade.order.Action1")}</span>
                            </label>
                        </dt>
                        <dd className="block-right">
                            <SingleSelect className="select w-100 sel-cus fl selection" value={loss} onChange={this.onChangeLoss.bind(this)}>
                                <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={0} key={"loss0"}>{Intl.lang("common.select")+Intl.lang("trade.open.optional")}</SelectOption>
                                <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={1} key={"loss1"}>{Intl.lang("trade.open.lossProfitOption1")}</SelectOption>
                            </SingleSelect>
                            <OptionsNumberInput className={loss!=0?"slider-number-box":"slider-number-box disable"} disabled={loss==0} value={lossPrice} step={product ? Number(product.UnitPrice) : 0} min={1} max={FutTradeModel.priceMax} onChange={this.onChangeLossPrice.bind(this)}/>
                        </dd>
                    </dl>}
                    {tab==3 && <dl className="mt-10 ft-easy-block f-clear">
                        <dt className="tl">
                            <label className="custom-checkbox">
                                <span>{Intl.lang("trade.order.Action0")}</span>
                            </label>
                        </dt>
                        <dd className="block-right">
                            <SingleSelect className="select w-100 sel-cus fl selection" value={profit} onChange={this.onChangeProfit.bind(this)}>
                                <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={0} key={"profit0"}>{Intl.lang("common.select")+Intl.lang("trade.open.optional")}</SelectOption>
                                <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={1} key={"profit1"}>{Intl.lang("trade.open.lossProfitOption1")}</SelectOption>
                            </SingleSelect>
                            <OptionsNumberInput className={profit!=0?"slider-number-box":"slider-number-box disable"} disabled={profit==0} value={profitPrice} step={product ? Number(product.UnitPrice) : 0} min={1} max={FutTradeModel.priceMax} onChange={this.onChangeProfitPrice.bind(this)}/>
                        </dd>
                    </dl>}

                    <SumbitBtns product={product} tab={tab} tradeType={tradeType} triggerType={triggerType} triggerPrice={triggerPrice} isSubmiting={isSubmiting} onSubmit={this.onSubmit.bind(this)} isLmt={isLmt} lever={lever} volume={volume} delegatePrice={delegatePrice} onChangeFee={this.onChangeUnitFee.bind(this)} />

                    <DepositStatBar code={product ? product.Code : ""} showIcon={false} hideAssetIcon={true} isSimple={true} />

                    {!IS_CLOSE_EXCHANGE && <VipOffer />}
                </div>
                {!this.isLogin &&
                <div className="unlogin-mask">
                    <div className="orderMask"></div>
                    <div className="maskTxt" dangerouslySetInnerHTML={{__html:Intl.lang("TradeForm.unLogin", "?return_to=/trade/"+(product ? product.Code : ""))}}></div>
                </div>
                }
            </div>
        )
    }
}

class DepositBar extends PureComponent{
    constructor(props){
        super(props);

        this.isUpdating = false;

        this.state = {
            feeTotal: ''
        };
    }
    componentWillMount() {
        // Event.addListener(Event.EventName.PRICE_UPDATE, this.onChangePrice.bind(this), this);

        this.onChangePrice();
    }

    componentWillReceiveProps(nextProps) {
        //加入标识，以免props变化后this.props还没变时，价格变化引起渲染覆盖
        this.isUpdating = true;
        this._onChangePrice(nextProps);
    }

    componentDidUpdate() {
        //this.props变化后重置
        if (this.isUpdating) this.isUpdating = false;
    }

    onChangePrice(){
        if (!this.isUpdating) this._onChangePrice(this.props);
    }

    _onChangePrice(props){
        const {unitFee, unitDeposit, feeTotal, depositTotal} = this.getFee(props);
        this.setState({feeTotal});
        if (props.onChange) props.onChange(unitFee, props.side);
    }

    getFee(props){
        var feeTotal = 0, depositTotal=0, unitFee = 0, unitDeposit = 0;
        var product = props.product;
        if (product){
            var con = FutTradeModel.getCon(product.ID);
            if (props.isLmt){
                if (props.delegatePrice && Number(props.delegatePrice)>0){
                    var {deposit, repay, takerFee} = FutTradeModel.formula.unitOrderFee(true, props.side, con, props.lever, product.price, props.delegatePrice, product.TakerFee, false);
                    unitFee = Decimal.accAdd(Decimal.accAdd(deposit, repay), takerFee);
                    unitDeposit = Decimal.accAdd(deposit, repay);
                }
            }else{
                var {deposit, repay, takerFee} = FutTradeModel.formula.unitOrderFee(false, props.side, con, props.lever, product.price, 0, product.TakerFee, false);
                unitFee = Decimal.accAdd(Decimal.accAdd(deposit, repay), takerFee);
                unitDeposit = Decimal.accAdd(deposit, repay);
            }
            if (unitFee){
                if (props.volume){
                    feeTotal = Decimal.accMul(unitFee, props.volume, product.ShowFixed);
                    depositTotal = Decimal.accMul(unitDeposit, props.volume, product.ShowFixed);
                }
            }
        }
        return {unitFee, unitDeposit, feeTotal, depositTotal};
    }

    render(){
        const {feeTotal} = this.state;

        var unit = '--';
        var product = this.props.product;
        if (product) {
            var sb = getCurrencySymbol(product.Currency);
            if (sb) unit = sb.sn;
        }
        return (
            <p>{Intl.lang("futures.cost",feeTotal+" "+unit)}</p>
        )
    }
}

class SumbitBtns extends PureComponent{
    constructor(props){
        super(props);

        this.state = {};
    }
    componentWillMount() {
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onFresh.bind(this), this);
    }

    onFresh(){
        this.forceUpdate();
    }

    onSubmit(e, side){
        if (this.props.onSubmit) this.props.onSubmit(e, side);
    }

    render(){
        const {tab, tradeType, triggerType, product, triggerPrice, isSubmiting, isLmt, lever, volume, delegatePrice, onChangeFee} = this.props;

        var buyBtnDis = false, sellBtnDis = false;

        if (tab==3 && tradeType==3 && triggerType>0){
            var price = product.price;
            if (triggerType==1){
                if (Number(triggerPrice)<=Number(price.MARK)) buyBtnDis = true;
                if (Number(triggerPrice)>=Number(price.MARK)) sellBtnDis = true;
            }else{
                if (Number(triggerPrice)<=Number(price.LAST)) buyBtnDis = true;
                if (Number(triggerPrice)>=Number(price.LAST)) sellBtnDis = true;
            }
        }
        return (
            <div className="limit-btn-box flex-sb mt-30">
                <button className={"btn btn-buy w-140"+(buyBtnDis || isSubmiting ? " btnDis":"")} onClick={(e)=>{if(!buyBtnDis && !isSubmiting)this.onSubmit(e, CONST.FUT.Side.BUY)}}>
                    <span>{Intl.lang("trade.buyTxt")}</span>
                    <DepositBar product={product} side={CONST.FUT.Side.BUY} isLmt={isLmt} lever={lever} volume={volume} delegatePrice={delegatePrice} onChange={onChangeFee.bind(this)}/>
                </button>
                <button className={"btn btn-sell w-140"+(sellBtnDis || isSubmiting ? " btnDis":"")} onClick={(e)=>{if(!sellBtnDis && !isSubmiting)this.onSubmit(e, CONST.FUT.Side.SELL)}}>
                    <span>{Intl.lang("trade.sellTxt")}</span>
                    <DepositBar product={product} side={CONST.FUT.Side.SELL} isLmt={isLmt} lever={lever} volume={volume} delegatePrice={delegatePrice} onChange={onChangeFee.bind(this)}/>
                </button>
            </div>
        )
    }
}


class VipOffer extends PureComponent{
    constructor(props){
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        this.state = {
            vip: null,
            vipProduct: null
        };
    }
    componentWillMount() {
        if (AuthModel.checkUserAuth()){
            Product.loadProductVip((data)=>{
                this.setState({vipProduct: data});
            }, this);
            AccountModel.loadUserVip((data)=>{
                this.setState({vip: data});
            }, this);
        }
    }
    // getOffer(discount, old){        // 1-(等级费率/0.08)
    //     let Offer = Decimal.accSubtr(1, Decimal.accDiv(discount, old, 4), 3)*100;
    //     return Offer || "--";
    // }
    setMenuRef(ref){
        this.menuRef = ref;
    }
    render(){
        const { vipProduct, vip } = this.state;

        let isDiscount = false, discountVip, offer="--";
        // var offRate = 1;
        var discount = '--', vipLv;
        if (vip && vipProduct){
            vipLv = vip.Vip;
            isDiscount = vip.Offset && vipLv;
            discountVip = vipProduct[vipLv].Futures;
            // offRate = Decimal.accMul(discountVip.Tdfeerate, 10);
            offer = Decimal.accMul(discountVip.Tdfeerate, discountVip.Takerfee);
            discount = Intl.getLang()=='zh-cn' ? Decimal.accMul(discountVip.Tdfeerate, 10) : Decimal.toPercent(Decimal.accSubtr(1, discountVip.Tdfeerate), 0);
        }

        return (
            discountVip ?
            <div className="mt-10 ft-vip-offer">
                <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c}><span className="rate">{Intl.lang("trade.history.ChargeFeeDesc")} <i className="iconfont icon-xiala fs14"></i></span></DropDown>
                <Contrainer ref={this.setMenuRef.bind(this)} pnRef={()=>this.dropDownRef}>
                    <ul className={"order-menu-setting wp-100 dire-r lh-25"}>
                        <li><span>{Intl.lang("Vip.my.grade")+': '}{vipLv?"VIP"+vipLv:Intl.lang("Vip.grade.normal")}</span>{!this.isDesktop && <a className="viewOffer pdl-20" href={"/personal/viprights"} target="_blank">{Intl.lang("common.view")} <i className="iconfont icon-arrow-l fs12"></i></a>}</li>
                        {!!isDiscount && <li><span>{Intl.lang("trade.vip.expend","TD")}</span> (<span>{Intl.lang("trade.vip.discount", discount)}</span>)</li>}
                        <li>
                            <span>{Intl.lang("tradeHistory.2_69") + ': '}{Intl.lang("trade.taker")} ({!!isDiscount && <span className="trade-order-head-unline">{Decimal.toPercent(discountVip.Takerfee, 2)}</span>} {isDiscount ? Decimal.toPercent(offer, 3) : Decimal.toPercent(discountVip.Takerfee, 2)}) <span className="trade-order-head-span"></span>{Intl.lang("trade.maker")} ({isDiscount && <span className="trade-order-head-unline">{Decimal.toPercent(discountVip.Makerfee, 2)}</span>} {Decimal.toPercent(discountVip.Makerfee, 2)})</span>
                        </li>
                    </ul>
                </Contrainer>
            </div>
                :
            <div className="mt-10 ft-vip-offer">
                <span className="rate">{Intl.lang("trade.history.ChargeFeeDesc")} <i className="iconfont icon-xiala fs14"></i></span>
            </div>

        )
    }
}


