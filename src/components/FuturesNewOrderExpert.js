import React from 'react';
import {DropDown,Contrainer} from './DropDown';
import Intl from "../intl";
import SysTime from "../model/system";
import {formatDuring, isEmptyObject} from "../utils/util";
import FutTradeModel from "../model/fut-trade";
import Decimal from "../utils/decimal";
import {CONST} from "../public/const";
import AccountModel from "../model/account";

import AuthModel from "../model/auth";
import {IS_TRADE_V2} from "../config";
import Event from "../core/event";
import PureComponent from "../core/PureComponent";
// import ReactTooltip from "react-tooltip";
import OptionsNumberInput from "./OptionsNumberInput"
import {SingleSelect, SelectOption} from "./SingleSelect";

import FutLeverComp from "./FuturesLeverComp";
import FutLossProfitPart from './FuturesLossProfitPart';
import DelegrateQtyExpireTimePart from './DelegrateQtyExpireTimePart';
import ToolTip from "./ToolTip";

//获取下新单的表单数据
export class FutTradeFormExpert extends PureComponent {
    constructor(props) {
        super(props);

        this.isLogin = AuthModel.checkUserAuth();

        this.leverPreKey = FutTradeModel.formVar.leverPreKey;
        this.volumePreKey = FutTradeModel.formVar.volumePreKey;

        this.leverOptions = FutTradeModel.formVar.leverOptions;
        this.volOptions = FutTradeModel.formVar.volOptions;

        this.eventVolume = -1;
        this.onChartMessage = this.onChartMessage.bind(this);

        this.state = this.initState(this.props);
    }
    initState(props){
        var direction = props.tradingType ? props.tradingType !== 'sell' ? 0 : 1 : CONST.FUT.Side.BUY;

        var state = {
            quickDisable: props.tradingType ? true : false,
            isMarketPriceCondition:false, //
            leverInputMode:0,
            direction: direction,
            refresh: 0,
            lever:FutTradeModel.isSharedLimit() ? 20 : AuthModel.loadPreference(this.leverPreKey, 20),
            volume:AuthModel.loadPreference(this.volumePreKey, '')
        };

        if (props.order){
            const order = props.order;

            Object.assign(state, {
                quickDisable: true,
                isMarketPriceCondition:order.Kind==CONST.FUT.Kind.MKT,
                direction: order.Side,
                lever:order.Scale,
                volume:order.Volume,
                oldVolume:order.Volume
            });
        }
        return state;
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.product!=nextProps.product){
            if (!this.props.product) this.setState(this.initState(nextProps));
        }
    }

    //快捷下单
    quickTrade(e, direction, callback){
        if (!AuthModel.checkAuthAndRedirect()) return;

        var setting = FutTradeModel.setting;
        // var lever = this.state.lever;
        // var volume = this.state.volume;

        var product = this.props.product;
        var price = product.price;

        var formData;
        if (setting.quickMktLmt==1){ //限价
            var expireParam = Number(setting.expireParam);
            expireParam = expireParam >= 0 ? expireParam : 0;
            formData = {
                Price: Number(direction==CONST.TRADE.DIRECTION.BID ? price.BID_M : price.ASK_M),
                Timely: expireParam>0 ? CONST.FUT.Timely.LIFE : CONST.FUT.Timely.GTC,
                TimelyParam: expireParam,
                Passive: setting.postOnlyExecInst,
                Visible: -1,
                Strategy: CONST.FUT.Strategy.Immediate,
                Better: IS_TRADE_V2 ? false : true
            };
        }else{ //市价的
            formData = {
                Price: 0,
                Strategy: CONST.FUT.Strategy.Immediate,
            };
        }
        formData.Side = direction;

        this.submitOrder(e, formData, callback);
    }

    onOptionChange(option){
        var total = 0;
        if (AuthModel.checkUserAuth()){
            var product = this.props.product;
            var con = FutTradeModel.getCon(product.ID);
            var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT, product.Currency);
            if (wallet){
                var canUse = wallet.canUse;

                if (this.state.conditionData && this.state.conditionData.quickDisable){
                    var isLmt = this.state.conditionData.delegatePriceType==1 && this.state.conditionData.delegatePrice;
                    var delegatePrice = this.state.conditionData.delegatePrice;
                    var unitFee = FutTradeModel.formula.unitOrderFee(isLmt, Number(this.state.direction), con, this.state.lever, product.price, delegatePrice, product.TakerFee);
                    total = Decimal.accDiv(canUse, unitFee, 0, true);
                }else{
                    var unitFee1 = FutTradeModel.formula.unitOrderFee(false, CONST.FUT.Side.BUY, con, this.state.lever, product.price, 0, product.TakerFee);
                    var unitFee2 = FutTradeModel.formula.unitOrderFee(false, CONST.FUT.Side.SELL, con, this.state.lever, product.price, 0, product.TakerFee);
                    var unitFee3 = FutTradeModel.formula.unitOrderFee(true, CONST.FUT.Side.BUY, con, this.state.lever, product.price, product.price.ASK_M, product.TakerFee);
                    var unitFee4 = FutTradeModel.formula.unitOrderFee(true, CONST.FUT.Side.BUY, con, this.state.lever, product.price, product.price.BID_M, product.TakerFee);
                    total = Decimal.accDiv(canUse, Math.max(unitFee1, unitFee2, unitFee3, unitFee4), 0, true);
                }
            }
        }

        return String(Decimal.accMul(total, option, 0));
    }
    onChangeLever(val){
        if (this.state.lever!=val){
            this.setState({lever:val});

            AuthModel.savePreference(this.leverPreKey, Number(val));
        }
    }

    onChangeVolume(val){
        this.setState({volume:val});
        AuthModel.savePreference(this.volumePreKey, Number(val));

        if (!window.isMobile && this.eventVolume!=val){
            this.eventVolume = val;
            frames[0].window.postMessage({ eventType: 'setNumber', value: val }, '*');
            Event.dispatch(Event.EventName.CHANGE_VOLUME, val);
        }
    }
    onEventChangeVolume(val){
        if (this.eventVolume!=val){
            this.setState({volume:val});
            this.eventVolume = val;
        }
    }
    onChangeConditionOrder(data){
        var state = {};
        if (data.hasOwnProperty("quickDisable")){
            state.quickDisable = data.quickDisable;
        }
        if (data.hasOwnProperty("condition")){ //是否市价的条件
            var isMarketPriceCondition = this.refs.FutConditionOrderPart.isMarketPriceCondition(data.condition);
            if (isMarketPriceCondition != this.state.isMarketPriceCondition){
                state.isMarketPriceCondition = isMarketPriceCondition;
            }
        }
        if (data.hasOwnProperty("direction")){
            if (this.state.direction!=data.direction){
                state.direction = data.direction;
            }
        }
        state.conditionData = Object.assign({}, this.state.conditionData, data);

        this.setState(state);
    }
    //止盈止损
    getLossProfitForm(){
        var data = this.refs.FutLossProfitPart.val();
        return data;
    }
    //提交按钮下单 (入市)
    onSubmit(e, data, callback){
        e.preventDefault();
        e.stopPropagation();

        if (!AuthModel.checkAuthAndRedirect()) return;

        var formData;
        //市价单
        if (["1", "3", "4"].indexOf(data.condition)!=-1){
            formData = {
                Price: 0,
                Strategy: data.condition=="1" ? CONST.FUT.Strategy.Immediate : CONST.FUT.Strategy.Line
            };
            if (["3", "4"].indexOf(data.condition)!=-1){
                formData.Variable = data.condition=="3" ? CONST.FUT.Variable.MarkPrice : CONST.FUT.Variable.LastPrice;
                formData.Constant = data.triggerPrice && !isNaN(data.triggerPrice) ? Number(data.triggerPrice) : null;
            }
        }else{ //限价单
            formData = {
                Distance: data.delegatePriceType==1 ? false : true,
                Price: data.delegatePriceType==1 ? data.delegatePrice && !isNaN(data.delegatePrice) ? Number(data.delegatePrice) : null : data.delegatePoint && !isNaN(data.delegatePoint) ? Number(data.delegatePoint) : null,
                Timely: data.Timely,
                TimelyParam: data.TimelyParam,
                Passive: data.Passive,
                Visible: data.Visible,
                Strategy: data.condition=="2" ? CONST.FUT.Strategy.Immediate : CONST.FUT.Strategy.Line,
                Better: false,
            };
            if (["5", "6"].indexOf(data.condition)!=-1){
                formData.Variable = data.condition=="5" ? CONST.FUT.Variable.MarkPrice : CONST.FUT.Variable.LastPrice;
                formData.Constant = data.triggerPrice && !isNaN(data.triggerPrice) ? Number(data.triggerPrice) : null;;
            }
        }

        formData.Side = Number(data.direction);

        this.submitOrder(e, formData, callback);
    }

    submitOrder(e, formData, callback){
        var product = this.props.product;

        //止盈止损
        var lp = this.getLossProfitForm();
        Object.assign(formData, lp);

        //
        formData.CID = product.ID;
        formData.Scale = Number(this.state.lever);
        formData.Volume = Number(this.state.volume);

        //市价单都可见
        if (formData.Price == 0) formData.Visible = -1;

        this.props.onSubmit(e, formData, callback);
    }

    onRefresh(){
        this.setState({refresh: ++this.state.refresh});
    }

    onChartMessage(e){
        if (!e.data.eventType) return false;
        var value = e.data.value;

        switch (e.data.eventType) {
            case 'removeNumber':
            case 'addNumber':
                if (this.state.volume!=value){
                    this.onChangeVolume(value);
                }
        }
    }
    onChangeShared(shared){
        if (FutTradeModel.isSharedMax && shared){
            this.onChangeLever(20);
        }
    }
    componentWillMount() {
        Event.addListener(Event.EventName.SET_SHARED, this.onChangeShared.bind(this), this);
    }
    componentDidMount() {
        // ReactTooltip.rebuild();

        window.addEventListener('message', this.onChartMessage);
        //有两个组件时，监听修改
        if (!this.props.order) Event.addListener(Event.EventName.CHANGE_VOLUME, this.onEventChangeVolume.bind(this), this);
    }

    componentWillUnmount(){
        window.removeEventListener('message', this.onChartMessage);

        super.componentWillUnmount();
    }

    render() {
        const {quickDisable, isMarketPriceCondition,direction,refresh,lever,oldVolume,conditionData} = this.state;
        const {product, className, order, tradingType} = this.props;
        const volume = this.state.volume;

        return (
            <div className={"pos-r "+className}>
                <FutTradeProduct product={product} order={order} />
                <div className="pos-r">
                    <FutPricePart product={product} disable={quickDisable} onQuickTrade={this.quickTrade.bind(this)}/>

                    <FutLeverComp value={lever} onChange={this.onChangeLever.bind(this)}/>
                    <OptionsNumberInput placeholder={Intl.lang('trade.open.volume')} value={volume} isRequire={false} options={this.volOptions} min={oldVolume?oldVolume:1} max={FutTradeModel.volumeMax} valuePercent={true} step={1} auto={true} className="slider-number-box ver-md tradeCounts" onChange={this.onChangeVolume.bind(this)} onOptionChange={this.onOptionChange.bind(this)}/>
                </div>

                <FutLossProfitPart ref="FutLossProfitPart" product={product} isMarketPrice={!quickDisable || isMarketPriceCondition} quickDisable={quickDisable} direction={direction} conditionData={conditionData} refresh={refresh} order={order} />
                <FutConditionOrderPart ref="FutConditionOrderPart" quickDisable={quickDisable}  product={product} direction={direction} volume={volume} order={order} onChangeConditionOrder={this.onChangeConditionOrder.bind(this)} onSubmit={this.onSubmit.bind(this)} onRefresh={this.onRefresh.bind(this)} tradingType={tradingType}/>
                {(!this.isLogin) &&
                <div className="unlogin-mask">
                    <div className="orderMask"></div>
                    <div className="maskTxt" dangerouslySetInnerHTML={{__html:Intl.lang("TradeForm.unLogin", "?return_to=/trade/"+(product ? product.Code : ""))}}></div>
                </div>}
            </div>
        )
    }
}

export class FutTradeProduct extends PureComponent {
    constructor(props) {
        super(props);

        var state = this.initState(this.props);
        this.state = {
            ...state
        }
    }
    initState(props){
        var funding = this.getFundingData(this.props);
        return {
            now: this.getNow(),
            offset: parseInt(SysTime.svrTzMin/60),
            ...funding
        }
    }
    getNow(){
        return SysTime.ts2Server(SysTime.getServerTimeStamp(), 'HH:mm:ss')
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.product!=this.props.product){
            if (!this.props.product){
                var state = this.initState(nextProps);
                this.setState({...state});
            }else{
                this.updateFundingData(nextProps);
            }
        }
    }

    componentDidMount(){
        this.timer = setInterval(()=>{
            this.updateFundingData(this.props)
        }, 1000);
    }
    updateFundingData(props){
        var funding = this.getFundingData(props);
        this.setState({now:this.getNow(), ...funding});
    }
    getFundingData(props){
        var product = props.product;
        if (product){
            var price = product.price;
            if (price) return {
                FUND_RATE: price.FUND_RATE,
                IND_FUND_RATE: price.IND_FUND_RATE,
                FUND_TS: price.FUND_TS
            }
        }
        return {
            FUND_RATE: 0,
            IND_FUND_RATE: 0,
            FUND_TS: 0
        }

    }
    componentWillUnmount(){
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }
    }
    getRemainTime(ts) {
        if (!ts) return 0;

        var now = SysTime.getServerTimeStamp(true);

        now = now || new Date().getTime();
        var remain = ts - now;
        return remain;
    }
    setMenuRef(ref){
        this.menuRef = ref;
    }
    render() {
        const {product, ind, order} = this.props;
        const {now,offset,FUND_RATE,IND_FUND_RATE,FUND_TS} = this.state;
        // const price = product.price;
        //
        // var UD = 0, RANGE = 0;
        // if (price){
        //     UD = parseFloat(price.change);
        //     RANGE = price.chg;
        // }

        var list = FutTradeModel.getCodeList();
        var len = list.length;

        return (
            <div className="order-code ft-bd-53 mt-5 f-clear">
                <div className="pos-r mt-3">
                    <div>
                        <span className="fs22 pdl-5">{product ? product.Code : '--'}</span>
                        <DropDown trigger="click" menuRef={()=>this.menuRef} disabled={!!order} ref={(c)=>this.dropDownRef=c}><i className="iconfont icon-xiala"></i></DropDown>
                        <span className="utc-time">{now + Intl.lang("common.bracket", "UTC+"+offset) }</span>
                    </div>
                    <p className="f-oh mt-5"><span className="pdl-5">{Intl.lang('trade.fundingRate')}</span><span className="wp-50"><span className="pdl-5">{Decimal.toPercent(FUND_RATE, 4)}</span><span>{"/"+Decimal.toPercent(IND_FUND_RATE, 4)}</span></span><ToolTip title={Intl.lang("trade.funding.time")}><span className="pd05 fr cur-hover">{formatDuring(this.getRemainTime(FUND_TS))}</span></ToolTip></p>
                </div>
                <div className="lh-50 pd010 market-menu-box">
                    <Contrainer ref={this.setMenuRef.bind(this)} pnRef={()=>this.dropDownRef}>
                        <div className="market-menu">
                            <dl>
                                {/*<dt>{Intl.lang('trade.product.select')}</dt>*/}
                                <dd>
                                    <h3>{product ? product.Code : ''}</h3>
                                    <p></p>
                                </dd>
                            </dl>
                            {len>1 &&
                            <dl>
                                {/*<dt>{Intl.lang("trade.product.unselect")}</dt>*/}
                                {list.map((v, i)=>{
                                    if (v!=product.Code) return <dd key={i}>
                                        <h3>{v}</h3>
                                        <p></p>
                                    </dd>
                                })}
                            </dl>}
                        </div>
                    </Contrainer>
                </div>
            </div>
        )
    }
}

export class FutPricePart extends PureComponent{
    constructor(props) {
        super(props);

        this.priceTimer = 0;
        this.priceUpdateCount = 0;

        //市价模式下，就是当前的显示样式；限价模式下，蓝色块的卖空显示卖一价和数量，红色块对应显示买一和数量
        var state = this.initState(this.props);
        this.state = Object.assign({
            ...state,
        }, this.getDefaultClassName());
    }
    initState(props){
        var state = {
            size: FutTradeModel.loadSetting("sizeTheme"),
            theme: FutTradeModel.loadSetting("colorTheme"),
            isLimit: Number(FutTradeModel.loadSetting("quickMktLmt")),
            isSubmiting: false
        };

        Object.assign(state, this.getProductState(props));
        return state;
    }
    getProductState(props){
        var product = props.product;
        if (product){
            var price = product.price;
            return {
                product: product,
                ASK_M: price ? price.ASK_M : 0,
                BID_M: price ? price.BID_M : 0,
                AVOL_M: price ? price.AVOL_M : 0,
                BVOL_M: price ? price.BVOL_M : 0,
            }
        }
        return {
            product: null,
            ASK_M: '',
            BID_M: '',
            AVOL_M: '',
            BVOL_M: '',
        }
    }
    getDefaultClassName(){
        return {BidClassName: "ft-order-buy",
            AskClassName: "ft-order-sell"};
    }

    componentWillMount(){
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdateProductPriceDelay.bind(this), this);
        Event.addListener(Event.EventName.DEPTH_UPDATE, this.onUpdateDepth.bind(this), this);
        Event.addListener(Event.EventName.SETTING_UPDATE, this.onUpdateSetting.bind(this), this);

        this.onUpdateProductPriceDelay(FutTradeModel.getPrices());
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.product != nextProps.product){
            if (!this.props.product){
                this.setState(this.initState(nextProps));
            }else{
                var newState = this.getProductState(nextProps);
                this.setState(newState);
            }
        }
    }

    // componentDidMount() {
    //     this.setFloatTradeData(this.state.product);
    // }
    onUpdateProductPriceDelay(data){
        if (data && this.props.product && data[this.props.product.Code]){
            // this.priceUpdateCount++;

            // if (!this.priceTimer) this.priceTimer = Event.setTimer(()=>{
            this.onUpdateProductPrice();
            // }, 500, this);
        }
    }
    // // 设置浮动面板交易数据
    // setFloatTradeData(data) {
    //     const products = data ? data : {price: {ASK: 0, BID: 0}}
    //     const eventList = [
    //         {name: 'init', price: undefined},
    //         {name: 'setBuy', price: products.price.ASK},
    //         {name: 'setSell', price: products.price.BID},
    //         {name: 'setSpread', price: products.price.ASK - products.price.BID}
    //     ]
    //     eventList.forEach(elm => {
    //         frames[0].window.postMessage({eventType: elm.name, value: elm.price}, '*')
    //     })
    // }
    onUpdateProductPrice(){
        // if (this.priceUpdateCount>0){
        var products = FutTradeModel.getProduct(this.props.product.Code);
        var product = products[0];
        var price = product.price;
        this.setState(Object.assign({product: product}, this.updatePrice(price)));

        // this.priceUpdateCount = 0;
        // this.setFloatTradeData(this.state.product)
        // }
    }
    onUpdateDepth(data){
        if (data && this.props.product && data[this.props.product.Code]){
            var info = data[this.props.product.Code];

            if (info.ASK_M!=this.state.ASK_M || info.BID_M!=this.state.BID_M || info.AVOL_M!=this.state.AVOL_M || info.BVOL_M!=this.state.BVOL_M){
                var data = Object.assign({}, this.updatePrice(info));
                this.setState(data);
            }
        }
    }
    updatePrice(info){
        var theme = this.state.theme;

        var data = {AVOL_M:info.AVOL_M, BVOL_M:info.BVOL_M};
        if (info.ASK_M!=this.state.ASK_M){
            data.ASK_M = info.ASK_M;

            if (theme >= 5) {
                //下跌
                if (info.ASK_M < this.state.ASK_M) {
                    data.AskClassName = "ft-order-buy";
                } else {
                    data.AskClassName = "ft-order-sell";
                }
            }
        }else{
            if (theme == 5){
                data.AskClassName = "ft-order-middle";
            }
        }
        if (info.BID_M!=this.state.BID_M){
            data.BID_M = info.BID_M;

            if (theme >= 5) {
                //下跌
                if (info.BID_M < this.state.BID_M) {
                    data.BidClassName = "ft-order-buy";
                } else {
                    data.BidClassName = "ft-order-sell";
                }
            }
        }else{
            if (theme == 5){
                data.BidClassName = "ft-order-middle";
            }
        }

        return data;
    }
    onUpdateSetting(data){
        if (data["colorTheme"]){
            var theme = data["colorTheme"];
            var data = {theme};
            Object.assign(data, this.getDefaultClassName());
            this.setState(data);
        }else if (data.hasOwnProperty("sellMDepth") || data.hasOwnProperty("buyMDepth")){
            this.priceUpdateCount++;
            this.onUpdateProductPrice();
        }else if(data.hasOwnProperty("quickMktLmt")){
            this.setState({isLimit:Number(data["quickMktLmt"])});
        }else if(data["sizeTheme"]){
            var size = data["sizeTheme"];
            this.setState({size});
        }
    }
    trade(e, direction){
        this.setState({isSubmiting:true});
        if (this.props.onQuickTrade){
            this.props.onQuickTrade(e, direction, (result)=>{
                this.setState({isSubmiting:false});
            });
        }
    }
    render(){
        const {product,ASK_M, BID_M, AVOL_M, BVOL_M, theme, AskClassName, BidClassName,size, isLimit, isSubmiting} = this.state;
        const {disable} = this.props;
        // const price = product ? product.price : {};

        var point = product ? Decimal.toFixed(Decimal.accSubtr(ASK_M, BID_M), product.PriceFixed).replace('.', '') : '--';

        var bVol = BVOL_M ? Decimal.toKorM(BVOL_M) : '--';
        var aVol = AVOL_M ? Decimal.toKorM(AVOL_M) : '--';

        var len = size==1 ? -2 : (size==2 ? -3 : 0);

        var bid1 = BID_M ? BID_M.slice(0, len) : '--';
        var bid2 = BID_M ? BID_M.slice(len) : '--';

        var ask1 = ASK_M ? ASK_M.slice(0, len): '--';
        var ask2 = ASK_M ? ASK_M.substr(len): '--';

        return (
            <div className={"flex-box flex-jc mt-5 color-pg"+theme}>
                <div className={"ft-btn-wh "+BidClassName+" tc" + (disable||isSubmiting?' ft-btn-disable':'')} onClick={(e)=>{if(!disable && !isSubmiting) this.trade(e, CONST.TRADE.DIRECTION.ASK)}}>
                    <div className="trape trape-r"></div>
                    <div className="trape-txt trape-txt-r">{!isLimit ? bVol : aVol}</div>
                    <div className="code-price2">
                        <span>{!isLimit ? bid1 : ask1}</span>
                        <span>{!isLimit ? bid2 : ask2}</span>
                    </div>
                    <div className="buy-text-l t0">{Intl.lang('trade.sell')}</div>
                    <div className="buy-text-l b0">{Intl.lang(!isLimit ? "trade.order.Strategy00":'trade.order.Strategy10')}</div>
                </div>
                <div className={"ft-btn-wh "+AskClassName+" tc" + (disable||isSubmiting?' ft-btn-disable':'')} onClick={(e)=>{if(!disable && !isSubmiting)this.trade(e, CONST.TRADE.DIRECTION.BID)}}>
                    <div className="trape trape-l"></div>
                    <div className="trape-txt trape-txt-l">{!isLimit ? aVol : bVol}</div>
                    <div className="code-price2">
                        <span>{!isLimit ? ask1 : bid1}</span>
                        <span>{!isLimit ? ask2 : bid2}</span>
                    </div>
                    <div className="buy-text-r t0">{Intl.lang('trade.buy')}</div>
                    <div className="buy-text-r b0">{Intl.lang(!isLimit ? "trade.order.Strategy00":'trade.order.Strategy10')}</div>
                </div>
                <div className="spread" style={{left: '50%', transform: 'translateX(-50%)'}}>{point}</div>
            </div>
        )
    }
}



class FutConditionOrderPart extends PureComponent{
    constructor(props) {
        super(props);

        const {quickDisable} = this.props;

        this.onSubmitResult = this.onSubmitResult.bind(this);
        // this.priceMax = 1000000;

        this.directionMap = {};
        this.directionMap[CONST.TRADE.DIRECTION.BID] = "trade.open.buy";
        this.directionMap[CONST.TRADE.DIRECTION.ASK] = "trade.open.sell";
        this.directions = Object.keys(this.directionMap);

        this.symbolMap = {};
        this.symbolMap[CONST.TRADE.DIRECTION.BID] = "common.symbol.ge";
        this.symbolMap[CONST.TRADE.DIRECTION.ASK] = "common.symbol.le";

        this.conditionMap = IS_TRADE_V2 ?
            {   "1": "trade.open.condition1",
                "2": "trade.open.condition2",
                "3": "trade.open.condition3",
                "4": "trade.open.condition4"}
            : {
                "1": "trade.open.condition1",
                "2": "trade.open.condition2",
                "3": "trade.open.condition3",
                "4": "trade.open.condition4",
                "5": "trade.open.condition5",
                "6": "trade.open.condition6"
            };
        this.conditions = Object.keys(this.conditionMap);

        this.delegatePriceOptionsMap = {
            "1": "trade.open.delegateOption1",
            "2": "trade.open.delegateOption2"
        };
        this.delegatePriceOptions = Object.keys(this.delegatePriceOptionsMap);

        this.preferenceKey = 'fcop';

        var state = {
            expandedConditionOrder:AuthModel.loadPreference(this.preferenceKey, true),
            quickDisable,
            direction: this.props.direction,
            condition:this.conditions[0],
            delegatePrice:"",  //限价（委托价）
            delegatePoint:"", //限价（委托价） 距离点数
            triggerPrice:"",  //触发价
            delegatePriceType: "1", //委托价类型
            isModify: false,
            isSubmiting: false
        };

        if (this.props.order){
            var order = this.props.order;
            Object.assign(state, {
                expandedConditionOrder: true,
                direction: order.Side,
                isModify: true,
                isTriggerred: order.State>=CONST.FUT.State.TRIGGERRED //订单是否已触发
            });

            if (order.Kind==CONST.FUT.Kind.MKT){
                if (order.Strategy==CONST.FUT.Strategy.Immediate){
                    state.condition = "1";
                    state.triggerPrice = "";
                }else {
                    if(order.Variable==CONST.FUT.Variable.MarkPrice){
                        state.condition = "3";
                    }else if(order.Variable==CONST.FUT.Variable.LastPrice){
                        state.condition = "4";
                    }
                    state.triggerPrice = order.Constant;
                }
            }else{
                if (order.Strategy==CONST.FUT.Strategy.Immediate){
                    state.condition = "2";
                    state.triggerPrice = "";
                }else {
                    if(order.Variable==CONST.FUT.Variable.MarkPrice){
                        state.condition = "5";
                    }else if(order.Variable==CONST.FUT.Variable.LastPrice){
                        state.condition = "6";
                    }
                    state.triggerPrice = order.Constant;
                }
                state.delegatePriceType = !order.Distance ? "1" : "2";
                var val = this.defaultValue(state.direction, state.condition);
                state.delegatePrice = !order.Distance ? order.Price : val.delegatePrice;
                state.delegatePoint = order.Distance ? order.Price : val.delegatePoint;
            }
        }

        this.state = state;
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRICE_SELECT, this.onSelectPrice.bind(this), this);
    }
    onSelectPrice(data){
        if (this.state.quickDisable){
            if (["2"].indexOf(this.state.condition)!=-1){
                this.onChangeDelegatePrice(data.Price);
            }
            if(["3", "4"].indexOf(this.state.condition)!=-1){
                this.onChangeTriggerPrice(data.Price);
            }
        }
    }
    val(){
        var dqPart = this.refs.delegrateQtyExpireTimePart;
        if (dqPart){
            return Object.assign({}, dqPart.val(), this.state);
        }
        return Object.assign({
            Timely: CONST.FUT.Timely.GTC,
            TimelyParam: 0,
            Passive: false,
            Visible: -1,
        }, this.state);
    }
    toggleConditionOrder(){
        var expandedConditionOrder = !this.state.expandedConditionOrder;
        this.setState({expandedConditionOrder});

        AuthModel.savePreference(this.preferenceKey, expandedConditionOrder);
    }
    isMarketPriceCondition(condition){
        return ["1", "3", "4"].indexOf(condition)!=-1;
    }
    // 切换入市选项
    toggleQuickDisable(){
        if (this.props.order) return;

        var quickDisable = !this.state.quickDisable;
        var state = {quickDisable};
        if (quickDisable){
            //设置默认值
            var data = this.defaultValue(this.state.direction, this.state.condition);
            Object.assign(state, data);
        }
        this.setState(state);

        if (this.props.onChangeConditionOrder){
            state.condition = this.state.condition;
            this.props.onChangeConditionOrder(state);
        }
    }
    //获取部分默认值
    defaultValue(direction, condition){
        var data = {};

        var product = this.props.product;
        if (!product) return data;

        var price = product.price;
        if (condition!=1 && condition!=2){//默认触发价
            var newPrice;
            if (condition==3 || condition==5){ //标记价格
                newPrice = Number(Decimal.toFixed(price.MARK, product.PriceFixed));
            }else{ //最新价格
                newPrice = price.LAST;
                if (Number(newPrice)<=0){
                    if (direction==CONST.TRADE.DIRECTION.BID){ //买入
                        newPrice = price.BID_M;
                    }else{
                        newPrice = price.ASK_M;
                    }
                }
            }
            //买单 触发价>=price 买单 触发价<=price
            if (direction==CONST.TRADE.DIRECTION.BID){
                data.triggerPrice = String(Decimal.accAdd(newPrice, Decimal.accMul(FutTradeModel.rangeTriggerPricePoint, FutTradeModel.getPriceOnePointValue(product.UnitPrice)), product.PriceFixed));
            }else{
                data.triggerPrice = String(Decimal.accSubtr(newPrice, Decimal.accMul(FutTradeModel.rangeTriggerPricePoint, FutTradeModel.getPriceOnePointValue(product.UnitPrice), product.PriceFixed)));
            }
        }

        //限价
        if (!this.isMarketPriceCondition(condition)){ //限价 默认委托价
            var newPrice;
            // if (condition=="2" || condition=="6"){ //限价或者最新价格
            //
            // }else if(condition=="5"){//标记价格
            //     newPrice = price.MARK;
            // }
            var range = Decimal.accMul(FutTradeModel.rangeDelegatePricePoint, FutTradeModel.getPriceOnePointValue(product.UnitPrice));
            if (direction==CONST.FUT.Side.BUY){
                range = -1*range;
            }
            data.delegatePoint = String(range);

            if (condition==2){
                if (direction==CONST.TRADE.DIRECTION.BID){ //买入
                    newPrice = price.BID_M;
                }else{
                    newPrice = price.ASK_M;
                }

                data.delegatePrice = String(Decimal.accAdd(newPrice, range));
            }else{ //其他情况用触发价+-
                data.delegatePrice = String(Decimal.accAdd(data.triggerPrice, range));
            }
        }

        return data;
    }
    refreshPrice(){
        var quickDisable = this.state.quickDisable;
        var state = {};
        if (quickDisable){
            //设置默认值
            var data = this.defaultValue(this.state.direction, this.state.condition);
            Object.assign(state, data);
        }
        this.setState(state);
    }
    onChangeDirection(value){
        // e.preventDefault();
        // e.stopPropagation();
        //
        // var value = e.target.value;
        var state = {direction:value};
        var data = this.defaultValue(value, this.state.condition);
        Object.assign(state, data);
        this.setState(state);

        if (this.props.onChangeConditionOrder){
            this.props.onChangeConditionOrder({direction:value});
        }
    }
    onChangeCondition(value){
        // e.preventDefault();
        // e.stopPropagation();
        //
        // var value = e.target.value;
        var state = {condition:value};
        if (value=='1'){
            state.triggerPrice = '';
        }else if (value=='2'){ //选中限价
            state.delegatePriceType = "1";
        }
        var data = this.defaultValue(this.state.direction, value);
        Object.assign(state, data);
        this.setState(state);

        if (this.props.onChangeConditionOrder){
            this.props.onChangeConditionOrder(state);
        }
    }
    onChangeDelegatePrice(value){
        var data = {delegatePrice: value};
        this.setState(data);

        if (this.props.onChangeConditionOrder){
            this.props.onChangeConditionOrder(data);
        }
    }
    onChangeDelegatePoint(value){
        var data = {delegatePoint: value};
        this.setState(data);

        if (this.props.onChangeConditionOrder){
            this.props.onChangeConditionOrder(data);
        }
    }
    onChangeTriggerPrice(value){
        this.setState({triggerPrice: value});
    }
    onChangeDelegatePriceType(value){
        // e.stopPropagation();

        // var value = e.target.value;
        var state = {delegatePriceType: value};
        this.setState(state);

        if (this.props.onChangeConditionOrder){
            this.props.onChangeConditionOrder(state);
        }
    }
    onSubmit(e){
        this.setState({isSubmiting: true});
        if (this.props.onSubmit){
            this.props.onSubmit(e, this.val(), this.onSubmitResult);
        }
    }
    onSubmitResult(result){
        this.setState({isSubmiting: false});
    }
    onRefresh(){
        this.refreshPrice();

        if (this.props.onRefresh){
            this.props.onRefresh();
        }
    }
    render(){
        const {product,volume,order} = this.props;
        const {expandedConditionOrder, direction, condition, quickDisable, delegatePrice,delegatePoint, triggerPrice,delegatePriceType,isModify,isTriggerred, isSubmiting} = this.state;

        const isMarketPriceCondition = this.isMarketPriceCondition(condition);
        const onlyLimit = condition==2;

        const isLimitSpecial = ["5", "6"].indexOf(condition)!=-1;

        var min = product ? FutTradeModel.getPriceOnePointValue(product.UnitPrice) : 0;

        var isShow = true;
        if (isLimitSpecial){
            isShow = FutTradeModel.isShowDQETPart(Number(direction), 1, triggerPrice, delegatePriceType, delegatePriceType==1?delegatePrice:delegatePoint);
        }

        var self = this;
        return (
            <div>
                {!order && <div className=" mt-5 tr"><span onClick={this.toggleConditionOrder.bind(this)}><i className={expandedConditionOrder ? "iconfont icon-hide fs12 pdr-10": "iconfont icon-show fs12 pdr-10"}></i><span>{Intl.lang(expandedConditionOrder? "trade.open.hideConditionOrder":"trade.open.showConditionOrder")}</span></span></div>}
                {expandedConditionOrder &&
                <div className={quickDisable?"ft-order-limit":"ft-order-limit limit-disable"}>
                    <dl className="form-box lh-25 f-clear">
                        <dt className="tl"><label className="custom-checkbox">
                            <div><input type="checkbox" className="input_check" checked={quickDisable} onChange={this.toggleQuickDisable.bind(this)} /><i></i></div>
                            <span>{Intl.lang("trade.open.enter")+':'}</span></label></dt>
                    </dl>
                    <div className="mt-3 flex-box flex-end">
                        <SingleSelect className="w-80 mr-10 sel-cus" disabled={!quickDisable||isModify} value={direction} onChange={this.onChangeDirection.bind(this)}>
                            {this.directions && this.directions.map((v, i)=>{
                                return <SelectOption value={v} key={i}>{Intl.lang(this.directionMap[v])}</SelectOption>
                            })}
                        </SingleSelect>
                        <SingleSelect className="w-80 mr-10 sel-cus mb-sel-pos" disabled={!quickDisable||isModify} value={condition} onChange={this.onChangeCondition.bind(this)}>
                            {this.conditions && this.conditions.map((v, i)=>{
                                return <SelectOption value={v} key={i}>{Intl.lang(this.conditionMap[v], Intl.lang(this.symbolMap[Number(direction)]))}</SelectOption>
                            })}
                        </SingleSelect>
                        {onlyLimit && <OptionsNumberInput className={(quickDisable && !isTriggerred)?"slider-number-box":"slider-number-box disable"} disabled={!quickDisable||isTriggerred} value={delegatePrice} step={product ? Number(product.UnitPrice) : 0} min={min} max={FutTradeModel.priceMax} onChange={this.onChangeDelegatePrice.bind(this)} placeholder={Intl.lang('trade.open.delegatePrice')} />}
                        {!onlyLimit && <OptionsNumberInput className={(quickDisable && !isTriggerred)?"slider-number-box":"slider-number-box disable"} disabled={!quickDisable || condition==1 || isTriggerred} value={triggerPrice} step={product ? Number(product.UnitPrice) : 0} min={condition!=1?min:0} max={FutTradeModel.priceMax} onChange={this.onChangeTriggerPrice.bind(this)} placeholder={condition!=1 ? Intl.lang("trade.open.triggerPrice"):''} />}
                    </div>
                    {isLimitSpecial &&
                    <div className="mt-3 flex-box flex-end">
                        <div className="w-80 mr-10">{Intl.lang('trade.open.delegatePrice')+':'}</div>
                        <SingleSelect className="w-80 mr-10 sel-cus" disabled={!quickDisable||isTriggerred} value={delegatePriceType} onChange={this.onChangeDelegatePriceType.bind(this)}>
                            {this.delegatePriceOptions && this.delegatePriceOptions.map((v, i)=>{
                                return <SelectOption value={v} key={i}>{Intl.lang(this.delegatePriceOptionsMap[v])}</SelectOption>
                            })}
                        </SingleSelect>
                        {delegatePriceType==1 &&
                        <OptionsNumberInput className={quickDisable?"slider-number-box":"slider-number-box disable"} disabled={!quickDisable||isTriggerred} value={delegatePrice} step={product ? Number(product.UnitPrice): 0} min={min} max={FutTradeModel.priceMax} onChange={this.onChangeDelegatePrice.bind(this)} />}
                        {delegatePriceType==2 &&
                        <OptionsNumberInput className={quickDisable?"slider-number-box":"slider-number-box disable"} disabled={!quickDisable||isTriggerred} unit={product?product.toCode:''} value={delegatePoint} step={product ? Number(product.UnitPrice) : 0} min={-min*FutTradeModel.priceMax} max={direction==CONST.FUT.Side.SELL?FutTradeModel.priceMax:0} onChange={this.onChangeDelegatePoint.bind(this)} />}
                    </div>}
                    {(!isMarketPriceCondition && isShow) && <DelegrateQtyExpireTimePart quickDisable={quickDisable} volume={volume} ref="delegrateQtyExpireTimePart" order={order}/>}
                    <div className="limit-btn-box flex-box flex-jc mt-10">
                        <button className={!quickDisable || isSubmiting ? "btn wp-100 lh-26 disable": "btn btn-confirm wp-100"} onClick={(e)=>{if(quickDisable && !isSubmiting)this.onSubmit(e)}}>{Intl.lang("common.submit")}</button>
                        {/*
                        <button className={!quickDisable ? "btn w-180 disable": "btn btn-submit w-180"} onClick={(e)=>{if(quickDisable)this.onSubmit(e)}}>{Intl.lang("common.submit")}</button>
                        <button className={!quickDisable ? "btn w-100 disable": "btn btn-update w-100"} onClick={()=>{if(quickDisable)this.onRefresh()}}>{Intl.lang("common.refresh")}</button>
                        */}
                    </div>
                </div>}
            </div>
        )
    }
}


