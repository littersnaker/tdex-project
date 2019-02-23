import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';
import { Link } from 'react-router';

//import ExpertHeader from './ExpertHeader'
import MobileMenu from "./MobileMenu";
import KlineDiv from './KlineDiv';

import { FuturesHistory } from './FuturesHistory'
import StatBar from './DepositStatBar';
import FutNewOrderComp from './FuturesNewOrder'
import FutDepthOrderBook from "./FuturesDepthBook";
import FutCloseOrderBook from "./FuturesCloseOrderBook"
import FutContractDetail from "./FuturesContractDetail";
import ProductList from './ProductList'
import FutSettingMenu from "./FuturesSettingMenu"
import ErrorBoundary from "./ErrorBoundary";

import TradeHistory from './SpotTradeHistory';
import CommOrderBook from './SpotCommOrderBook';
import CloseOrderBook from './SpotCloseOrderBook';
import TradeFullForm from './SpotTradeFullForm';

import Event from "../core/event";
import AuthModel from '../model/auth';
import FutTradeModel from '../model/fut-trade';
import ChartModel from '../model/chart';
import {CONST} from "../public/const";
// import TradeMgr from '../model/trade-mgr';
//import { isMobile } from '../utils/util';

const $ = window.$;

class FutTradeExpert extends PureComponent{
    constructor(props){
        super(props);

        this.SkinMore = FutTradeModel.skinMore;
        this.klineTheme = FutTradeModel.getSkin();
        this.Resolution = AuthModel.loadPreference("klType", "5MIN");

        // this.productList = TradeMgr.getProductList()||[];
        this.isFut = true;

        this.openHS = false;    // 开启强制横屏
        //this.winEvt = "onorientationchange" in window ? "orientationchange" : "resize";

        this.state = {
            isFut: this.isFut,
            code: this.props.code,
            product: this.getProduct(this.props.code),

            Resolution: this.Resolution,
            klineTheme: this.klineTheme,
            showKline: false,
            showMenu: false,
            showResolution: false,
            showNewOrder: false,
            showLog: false,
            showProduct: false,

            showSpotDeep: false,
            showSpotOrder: false,
            showSpotLog: false,

            maxLog: false,
            logStyle: null
        }
    }
    componentWillUnmount() {
        window.targetDom = null;
        //window.removeEventListener(this.winEvt, this.changeScreen, false);
    }
    componentWillReceiveProps(nextProps) {
        // if (nextProps.isFut !== this.props.isFut || nextProps) {
        //     console.log('trade type is change!');
        // this.isFut = nextProps.isFut;
        this.klineTheme = FutTradeModel.getSkin();

        var params = {
            isFut: this.isFut,
            code: nextProps.code,
            product: this.getProduct(nextProps.code),

            Resolution: this.Resolution,
            klineTheme: this.klineTheme,
            showKline: false,
            showMenu: false,
            showResolution: false,
            showNewOrder: false,
            showLog: false,
            showProduct: false,

            showSpotDeep: false,
            showSpotOrder: false,
            showSpotLog: false,

            maxLog: false,
            logStyle: null
        };
        this.setState(params);
        // }
    }
    componentWillMount() {
        Event.addOnce(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);

        this.changeProduct(this.props.code);
        this.initScreenSize(this);

        window.targetDom = this;
        //window.addEventListener(this.winEvt, this.changeScreen, false);
    }
    onProductUpdate(){
        var code = this.props.code;
        if (code) this.setState({product: this.getProduct(code)});

        // this.productList = TradeMgr.getProductList()
    }
    changeScreen(self){
        var that = self.props?self:window.targetDom;
        setTimeout(()=>{
            that.initScreenSize(that);
        },300);
    }
    initScreenSize(self) {
        const width = $(window).width(), height = $(window).height();
        var Style = {}, winStyle = {}, that = self.props?self:window.targetDom;

        winStyle.top = 0;
        winStyle.left = 0;
        Style.VerticalScreen = false;
        //Style.transform = 'none';
        //if(window.orientation == 0 || window.orientation == 180) {
            //console.log('screen->竖屏');
            if(this.openHS){
                winStyle.width = height;
                winStyle.height = width;
                winStyle.top = (height - width) / 2;
                winStyle.left = 0 - (height - width) / 2;
                winStyle.transform = 'rotate(90deg)';
                Style.ForceHSreen = true;   // 强制横屏
            }else{
                Style.VerticalScreen = true;
                winStyle.overflowY = "auto";
            }
        //}else
        if(!that.isFut){
            winStyle.overflowY = "auto";
        }
        //console.log(window.innerWidth, height);
        document.body.style.height = window.innerHeight+"px";

        Style.winStyle = winStyle;
        that.setState(Style);
    };
    maxHistory(){
        const { maxLog, winStyle } = this.state, width = $(window).width(), height = $(window).height(), scrollTop = $('#mb-futures-center').scrollTop();
        var Style = {}, newStyle;
        if(!maxLog) {
            Style.width = height;
            Style.height = width;
            Style.top = (height - width) / 2 + scrollTop;
            Style.left = 0 - (height - width) / 2;
            newStyle = {...winStyle, overflowY:"hidden"};
        }else{
            newStyle = {...winStyle, overflowY:"auto"};
        }

        this.setState({maxLog: !maxLog, logStyle: Style, winStyle:newStyle});
    }

    changeProduct(codeName){
        const { code } = this.props;
        if(codeName != code){
            let product = this.getProduct(code);

            this.setState({product:product, code:codeName});
        }
    }
    getProduct(code){
        var products = FutTradeModel.getProduct(code);
        if (products) return products[0];
    }
    setResolution(item){
        let value = item.value || this.Resolution;

        this.Resolution = value;
        ChartModel.setResolution(value);

        AuthModel.savePreference("klType", item.key);
        this.setState({Resolution:item.key});
    }
    getBackgroundConfig(){
        const bgConfig = {
            'gray':{
                // 'kLine':{position: "absolute", top:54, right: 528, width: "calc(100% - 521px)", height: "calc(100% - 309px)"},
                'kLine':{width: "100%", height:"100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%", overflow: "hidden"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            },
            'primary':{
                // 'kLine':{position: "absolute", top:54, right: 528, width: "calc(100% - 521px)", height: "calc(100% - 309px)"},
                'kLine':{width: "100%", height: "100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%", overflow: "hidden"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            },
            'white':{
                // 'kLine':{position: "absolute", top:54, right: 528, width: "calc(100% - 521px)", height: "calc(100% - 309px)"},
                'kLine':{width: "100%", height: "100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%", overflow: "hidden"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            },
            'dark':{
                'kLine':{width: "100%", height: "100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%", overflow: "hidden"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            }
        };
        return bgConfig[this.klineTheme];
    }
    changeSetting(value, isSkin){
        if(isSkin){
            this.klineTheme = value;
            this.setState({klineTheme: value});
            AuthModel.savePreference("klineTheme", value);
        }
    }
    getSolutionMap(){
        //const { VerticalScreen } = this.state;
        return [
            { value: '1', text: '1M', key: '1MIN', save: true },
            { value: '5', text: '5M', key: '5MIN', save: true },
            { value: '15', text: '15M', key: '15MIN', save: true },
            { value: '30', text: '30M', key: '30MIN', save: false },
            { value: '60', text: '1H', key: '1HOUR', save: true },
            { value: '360', text: '6H', key: '6HOUR', save: true },
            { value: '1D', text: '1D', key: '1DAY', save: true }
            //{ value: '1W', text: '1W', key: '1WEEK', save: true }
        ]
    }
    toggleBlock(type, flag){
        var params = {};
        if(flag){
            params.showMenu = false;
        }
        if(type=="kline"){
            params.showKline = !this.state.showKline;
        }else if(type=="resolution"){
            params.showResolution = !this.state.showResolution;
        }else if(type=="log"){
            params.showLog = !this.state.showLog;
        }else if(type=="order"){
            params.showNewOrder = !this.state.showNewOrder;
        }else if(type=="product"){
            params.showProduct = !this.state.showProduct;
        }else if(type=="main"){
            params.showMenu = false;
        }else if(type=="spotDeep"){
            params.showSpotDeep = !this.state.showSpotDeep;
        }else if(type=="spotOrder"){
            params.showSpotOrder = !this.state.showSpotOrder;
        }else if(type=="spotLog"){
            params.showSpotLog = !this.state.showSpotLog;
        }

        this.setState(params)
    }
    toggleMenu(e){
        if(e){
            e.preventDefault();
            e.stopPropagation();
        }
        this.setState({showMenu: !this.state.showMenu})
    }

    getShowBockConfig(){
        const { VerticalScreen, showKline, showMenu, showResolution, showNewOrder, showLog, showProduct, showSpotDeep, showSpotOrder, showSpotLog } = this.state;

        let Config = {};
        if(!this.isFut){     // spot 币币
            Config.HS = false;
            Config.showChart = true;
            Config.showResolution = true;
            Config.showSpotDeep = showSpotDeep;
            Config.showSpotOrder = showSpotOrder;
            Config.showSpotLog = showSpotLog;
            if(showKline){
                Config.showKline = true;
            }
            if(!VerticalScreen){
                Config.HS = true;
            }

            Config.BlockMap = ['header','product','spotTrade','spotDeep','chart','resolution','kline','spotOrder','spotLog'];
            return Config;
        }

        /** 合约交易 **/
        if(VerticalScreen){  // 竖屏
            Config.HS = false;
            Config.showChart = true;
            Config.showResolution = true;
            Config.showNewOrder = true;
            Config.showLog = showLog;
            Config.showProduct = true;
            if(showKline){
                Config.showKline = true;
            }
            Config.menuBtn = false;
            Config.showMenu = false;
            Config.showLogIcon = false;
            Config.hideStat = true;

            Config.BlockMap = ['header','product','trade','deep','newOrder','chart','resolution','kline','logBar','log','contract'];
        }else{
            Config.HS = true;
            Config.showChart = false;
            Config.showKline = true;
            Config.menuBtn = true;
            Config.showLogIcon = true;
            Config.hideStat = false;

            Config.showResolution = showResolution;
            Config.showNewOrder = showNewOrder;
            Config.showLog = showLog;
            Config.showProduct = showProduct;
            Config.showMenu = showMenu;

            Config.BlockMap = ['kline','resolution','product','trade','log','menu','mainBtn'];
        }
        return Config;
    }

    render(){
        const { code, product, Resolution, ForceHSreen, showMenu, maxLog, logStyle, winStyle } = this.state, {user, uInfo} = this.props;

        const bgConfig = this.getBackgroundConfig();
        const solutionMap = this.getSolutionMap();
        const block = this.getShowBockConfig();
        const blockMap = block.BlockMap;
        const isFut = true;

        return (
            <div id="mb-futures-center" className={(maxLog?"mb-overflow-y":"")+" futures-pos f-oh unselect futures-bg-"+this.klineTheme} style={winStyle}>
                {blockMap && blockMap.map((name, v)=>{
                    if(name=="header"){
                        return <MobileMenu key={v} className="mb-header-box" user={user} uInfo={uInfo} />
                    }
                    if(name=="chart"){
                        return <div key={v} className="mb-kline-head f-clear mt-5"><span>{Intl.lang("mobile.futures.chart")}</span><i className={"iconfont fr pd010 "+(block.showKline?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("kline")}></i></div>
                    }
                    if(name=="kline"&&block.showKline){
                        return <div key="KlineDiv" className="KlineDiv" style={block.HS?{height:"100%"}:{height:"50%"}}>
                            <KlineDiv style={bgConfig.kLine} code={code} entry={CONST.TRADE_TYPE.FUT} className="futures-c ft-bd-78 widget" theme={this.klineTheme}/>
                        </div>
                    }
                    if(name=="trade"){
                        return <NewOrder key={v} className={"ft-trade-panel mb-new-order "+(block.showNewOrder?"mb-new-order":"hide")} direct={block.HS} code={code} onChange={()=>this.toggleBlock("order")}/>
                    }
                    if(name=="deep"){
                        return <FutDepthOrderBook key={v} className="mb-deep-box" product={product} open={false} notip={true}/>
                    }
                    if(name=="newOrder"){
                        return <FutCloseOrderBook key={v} className="mb-deep-box" product={product} open={false} notip={true} />
                    }
                    if(name=="contract"){
                        return <FutContractDetail key={v} className="mb-contract-box" product={product} notip={true} />
                    }
                    if(name=="product"){
                        return <div key={v} className={(isFut?"":"spot-trading-skin")+" mb-product-menu "+(block.showProduct?"mb-product-show":"")}>
                            <MobileProductList selected={product} headHide={false} />
                            {block.HS&&<div className="mb-product-close" onClick={()=>this.toggleBlock("product")}><i className="iconfont icon-close"></i></div>}
                        </div>
                    }
                    if(name=="resolution"&&block.showKline){
                        return <div key={v} className={"mb-kLine-resolution "+(block.showResolution?"h-auto":"")}>
                            <div className="mb-resolution-bg"></div>
                            <div className="mb-resolution-btnBox">
                                {solutionMap.map((item, v)=>{
                                    return <span key={v} className={item.key==Resolution?"current":""} onClick={()=>this.setResolution(item)}>{item.text}</span>
                                })}
                                {block.HS&&<div className="mb-resolution-close" onClick={()=>this.toggleBlock("resolution")}><i className="iconfont icon-close fem125"></i></div>}
                            </div>
                        </div>
                    }
                    if(name=="logBar"){
                        return <div key={v} className="mb-kline-head f-clear mt-5"><span>{Intl.lang("mobile.futures.menu.2")}</span>
                            <i className={"iconfont pd010 fs14 fr "+(block.showLog?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("log")}></i>
                            {/*<i className={"iconfont fem pd010 fr "+(maxLog?"icon-suoxiao":"icon-fangda")} onClick={()=>this.maxHistory()}></i>*/}
                        </div>
                    }
                    if(name=="log"){
                        return <div key={v} className={(maxLog?"mb-hscreen":"")+" mb-trade-history "+(block.showLog?"mb-show":"")} style={logStyle}>
                            {(block.hideStat && maxLog) && <i className={"iconfont fem125 mb-minIcon icon-suoxiao"} onClick={()=>this.maxHistory()}></i>}
                            {(block.hideStat) && <div className="mb-asset-box"><StatBar code={code} hideAssetIcon={!block.HS} showIcon={false} /></div>}
                            <ErrorBoundary showError={true}>
                            <FuturesHistory className="futures-fullTrade-history widget" style={bgConfig} code={code} isExpert={true} height={200} hideStatBar={block.hideStat} hideAssetIcon={block.hideStat} showIcon={block.showLogIcon} onChange={()=>this.toggleBlock("log")}/>
                            </ErrorBoundary>
                        </div>
                    }
                    if(name=="menu"){
                        return <div key={v} className={"mb-trade-menuBox "+(block.showMenu?"":"mb-hide")} onClick={(event)=>this.toggleMenu(event)}>
                            <div className="mb-trade-menu fs12" onClick={(event)=>event.stopPropagation()}>
                                <MainMenu uInfo={uInfo} onChange={(type, flag)=>this.toggleBlock(type, flag)}/>
                            </div>
                        </div>
                    }
                    if(name=="mainBtn"){
                        return <MainMenuButton key={v} showMenu={showMenu} transType={ForceHSreen} onChange={(event)=>this.toggleMenu(event)}/>
                    }
                    if(name=="spotTrade"){
                        return <div key={v} className="mb-spot-trade">
                            <ErrorBoundary showError={true}><TradeFullForm code={code} isMobile={true} /></ErrorBoundary>
                        </div>
                    }
                    if(name=="spotDeep"){
                        return <div key={v} className="mb-spot-order">
                            <div className="mb-kline-head f-clear mt-5"><span>{Intl.lang("CommOrderBook.101")}</span><i className={"iconfont fr pd010 "+(block.showSpotDeep?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("spotDeep")}></i></div>
                            {block.showSpotDeep &&<div className="mb-spot-order">
                                <div className="trade-order-detail lh-22 c-8 fs12 hide">
                                    <ul>
                                        <li><span>{Intl.lang("TradeHistory.105")}</span><span>{Intl.lang("tradeHistory.1_9")}</span><span>{Intl.lang("TradeExpert.100")}</span></li>
                                    </ul>
                                </div>
                                <ErrorBoundary showError={true}><CommOrderBook code={code} isMobile={true}/></ErrorBoundary></div>}
                        </div>
                    }
                    if(name=="spotOrder"){
                        return <ErrorBoundary key={v} showError={true}>
                            <div className="mb-kline-head f-clear mt-5"><span>{Intl.lang("Trade.100")}</span><i className={"iconfont fr pd010 "+(block.showSpotOrder?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("spotOrder")}></i></div>
                            {block.showSpotOrder && <div className="mb-spot-order">
                                <div className="trade-order-detail lh-22 c-8 fs12">
                                    <ul>
                                        <li><span>{Intl.lang("TradeHistory.105")}</span><span>{Intl.lang("tradeHistory.1_9")}</span><span>{Intl.lang("accountSafe.1_102")}</span></li>
                                    </ul>
                                </div>
                                <CloseOrderBook code={code} className="trade-order-detail "/>
                            </div>}
                        </ErrorBoundary>
                    }
                    if(name=="spotLog"){
                        return <div key={v} className={(maxLog?"mb-hscreen":"")+" mb-spot-log"} style={logStyle}>
                            <div className="mb-kline-head f-clear mt-5"><span>{Intl.lang("mobile.futures.menu.2")}</span>
                                <i className={"iconfont fr pd010 "+(block.showSpotLog?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("spotLog")}></i>
                                {/*!block.HS &&<i className={"iconfont fem125 fr pd010 "+(maxLog?"icon-fangda":"icon-suoxiao")} onClick={()=>this.maxHistory()}></i>*/}
                            </div>
                            {(block.showSpotLog||maxLog) &&<ErrorBoundary showError={true}><TradeHistory isExpert={true} code={code} isMobile={true}/></ErrorBoundary>}
                        </div>
                    }

                })}

                <div className="mb-footer c-8"><span className="fem75 ml-10">{Intl.lang("Footer.109")}</span></div>
            </div>
        )
    }
}

export default FutTradeExpert;

class MobileProductList extends PureComponent{
    componentWillMount() {
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onPriceUpdate.bind(this), this);
    }
    onPriceUpdate(){
        this.forceUpdate();
    }
    render(){
        const {selected, headHide, onChange} = this.props;
        return <ProductList selected={selected} headHide={headHide} onChange={onChange} entry={CONST.TRADE_TYPE.FUT}/>
    }
}

class NewOrder extends PureComponent{
    constructor(props) {
        super(props);

        this.isSimple = FutTradeModel.loadSetting("isExpert");
        this.state = {
            panelShow: true
        }
    }
    toggleBlock(type, flag){
        this.props.onChange(type, flag);
    }
    showTrade(){
        this.setState({panelShow:!this.state.panelShow});
    }
    render(){
        const { code, className, direct } = this.props, { panelShow } = this.state;
        var products = FutTradeModel.getProduct(code);
        const product = products && products.length ? products[0] : null;
        const HSreen = direct;

        return (
            <section className={className} id="order_new">
                {HSreen?<header className="dialog-head tc lh-25">
                    <h3 className="ft-dialog-head fem875 tb"><span></span><span></span></h3>
                    <i className="iconfont icon-close transit fem875" onClick={()=>this.toggleBlock("order", true)}></i>
                </header>
                    :
                    <header className="dialog-head tc lh-25 pos-r">
                        <h3 className="ft-dialog-head fem875 tb"><span>{Intl.lang("trade.new_order")}</span></h3>
                        <div className="mb-order-setting">
                            <FutSettingMenu name="newOrder" code={product ? product.Code : ""} />
                            <i className={"iconfont fs14 "+(panelShow?" icon-hide":" icon-show")} onClick={()=>this.showTrade()}></i>
                        </div>
                    </header>
                }
                <div className={"ft-order-box pd010 fem75 pdb-10 border-none "+(panelShow?"":"hide")}>
                    <FutNewOrderComp className="ft-order-market pdt-1" product={product} isExpert={this.isSimple} expandKey={""} tradingType={true}></FutNewOrderComp>
                </div>
            </section>
        )
    }
}
class HeaderBar extends PureComponent {
    constructor(props) {
        super(props);

        this.langue = Intl.getLang();
        this.state = {}
    }
    sayHello(){
        var hour = new Date().getHours();
        if(hour < 6) return Intl.lang("LoginBox.101");
        else if (hour < 9) return Intl.lang("LoginBox.102");
        else if (hour < 12) return Intl.lang("LoginBox.103");
        else if (hour < 14)return Intl.lang("LoginBox.104");
        else if (hour < 17)return Intl.lang("LoginBox.105");
        else if (hour < 19)return Intl.lang("LoginBox.106");
        else if (hour < 24) return Intl.lang("LoginBox.107");
    }
    changeLangue(){
        let lang = this.langue == 'en-us'?"zh-cn":"en-us";
        if (lang && lang!=Intl.getLang()){
            Intl.setLang(lang);
            this.langue = lang;
        }
    }
    logout(evt){
        AuthModel.logout();
    }
    render() {
        const { uInfo, className } = this.props;
        const loginTip = this.sayHello()+ uInfo.Email;

        const langImg = this.langue == 'en-us'? "en":"zh";
        return (
            <div className={className}>
            {uInfo.Email?
                <span className="fs12">
                    <Link to="/personal" className="pd010 warn">{loginTip}</Link>
                    <a href="javascript:;" className="w-60 tc fr" onClick={this.logout}>{Intl.lang("header.1_2")}</a>
                </span>
                :
                <Link className="pd-10 white2 fs16" to="/login">{Intl.lang("LoginBox.100")}</Link>
            }
                <span className="fr pd-10 lh-16"><img src={process.env.PUBLIC_URL +"/images/icons/"+ langImg +".jpg"} onClick={this.changeLangue.bind(this)}/> </span>
            </div>
        )
    }
}
class MainMenu extends PureComponent{
    constructor(props) {
        super(props);
        this.state = {}
    }
    toggleBlock(type, flag){
        this.props.onChange(type, flag);
    }
    render(){
        const { uInfo } = this.props;
        return (
            <dl className="tc fs12">
                <dd className="mt-10">
                    <div onClick={()=>this.toggleBlock("resolution", true)}>
                        <i className="iconfont icon-resolution fem-225"></i>
                        <p>{Intl.lang("mobile.futures.menu.1")}</p>
                    </div>
                </dd>
                <dd className="pos-dd1">
                    <div onClick={()=>this.toggleBlock("log", true)}>
                        <i className="iconfont icon-edit-order fem-275"></i>
                        <p>{Intl.lang("mobile.futures.menu.2")}</p>
                    </div>
                </dd>
                <dd className="pos-dd2">
                    <div onClick={()=>this.toggleBlock("product", true)}>
                        <i className="iconfont icon-Kline fem-275"></i>
                        <p>{Intl.lang("mobile.futures.menu.4")}</p>
                    </div>
                </dd>
                <dd className="pos-dd3">
                    <div onClick={()=>this.toggleBlock("order", true)}>
                        <i className="iconfont icon-trade-order fem-275"></i>
                        <p>{Intl.lang("mobile.futures.menu.3")}</p>
                    </div>
                </dd>
                <dd className="pos-dd4">
                    {uInfo.Email?
                        <Link to="/personal">
                            <i className="iconfont icon-user fem-275"></i>
                            <p>{Intl.lang("NavBar.104")}</p>
                        </Link>
                        :
                        <Link to="/login">
                            <i className="iconfont icon-user fem-275"></i>
                            <p>{Intl.lang("LoginBox.100")}</p>
                        </Link>
                    }
                </dd>
                <dt className="pos-dd5">
                    <div className="m-tradeMenu-icon-main mg-md" onClick={()=>this.toggleBlock("main")}><i></i></div>
                    <p>{Intl.lang("mobile.futures.menu.0")}</p>
                </dt>
            </dl>
        )
    }
}
class MainMenuButton extends PureComponent{
    constructor(props){
        super(props);

        this.transType = false;    // 强制 横屏
        this.directH = false;      // Horizontal screen
        this.effTime = null;
        this.isDrag = false;
        this.winW = 300;
        this.winH = 300;
        this.state = {
            isClick: false,
            X:0,
            Y:0,
            /**鼠标点击元素的原始位置，单位是px */
            originX: 0,
            originY: 0,
            /**已经移动的位移，单位是px */
            lastX: 0,
            lastY: 0,
        }
    }
    componentWillMount(){
        this.winW = $(window).width();
        this.winH = $(window).height();
        if(this.winW > this.winH){
            this.directH = true;
        }
        this.transType = this.props.transType;
    }
    componentWillUnmount() {
        clearTimeout(this.effTime);
    }
    openMenu(){
        this.setState({isClick: true});
        this.setClickEffect(300);
    }

    setClickEffect(delay, type){
        if(this.effTime){ clearTimeout(this.effTime); this.effTime = null;}

        this.effTime = setTimeout(()=>{
            if(type){
                this.setState({isClick: false});
            }else{
                this.props.onChange();
            }
        }, delay);
    }

    componentWillReceiveProps(nextProps){
        const cur = nextProps.showMenu, old = this.props.showMenu;
        if(!cur && old){
            this.setClickEffect(2000, "hide");      //  console.log(cur, old)
        }
    }

    dragStart = (e)=>{
        if($('#klineMask')){
            $('#klineMask').removeClass('hide');
        }
        e.stopPropagation();

        document.addEventListener('touchmove',this.dragMove);
        document.addEventListener('touchend', this.dragEnd);

        let deltaX = e.touches[0].clientX;
        let deltaY = e.touches[0].clientY;
        console.log(deltaX, deltaY);
        this.setState({
            originX: deltaX,
            originY: deltaY,
            lastX: this.state.X,
            lastY: this.state.Y
        })
    };

    dragMove = (e)=>{
        e.stopPropagation();
        this.isDrag = true;

        let { originX, originY, lastX, lastY } = this.state;

        let deltaX = 0, deltaY = 0;
        if(this.directH || !this.transType) {
            deltaX = e.touches[0].clientX - originX + lastX;
            deltaY = e.touches[0].clientY - originY + lastY;

            let fixLeft = -(this.winW - 105), fixTop = -(this.winH - 105);

            deltaX = deltaX > 45 ? 45 : deltaX;
            deltaY = deltaY > 45 ? 45 : deltaY;
            deltaX = deltaX < fixLeft ? fixLeft : deltaX;
            deltaY = deltaY < fixTop ? fixTop : deltaY;

            this.setState({
                X: deltaX,
                Y: deltaY,
                isClick: true
            })
        }else{
            deltaX = -(e.touches[0].clientX - originX - lastY);
            deltaY = (e.touches[0].clientY - originY + lastX);

            let fixRight = (105 - this.winW), fixTop = (105 - this.winH);

            deltaX = deltaX > 45 ? 45 : deltaX;
            deltaY = deltaY > 45 ? 45 : deltaY;
            deltaX = deltaX < fixRight ? fixRight : deltaX;
            deltaY = deltaY < fixTop ? fixTop : deltaY;
            //console.log(deltaX, deltaY, fixRight, fixTop);

            this.setState({
                X: deltaY,
                Y: deltaX,
                isClick: true
            })
        }
    };

    dragEnd = (e)=>{
        if($('#klineMask')){
            $('#klineMask').addClass('hide');
        }
        e.stopPropagation();

        document.removeEventListener('touchmove',this.dragMove);
        document.removeEventListener('touchend', this.dragEnd);
        if(this.isDrag){
            this.isDrag = false;
            this.setClickEffect(2000, "hide");
        }else{
            this.openMenu();
        }
    };

    render(){
        const { showMenu } = this.props, { X, Y, isClick } = this.state;

        return <div className={(isClick?"active":"")+" mb-trade-menu-btn "+(showMenu?"hide":"")} onTouchStart={(e)=>this.dragStart(e)} style={{transform: "translate("+ X +"px,"+ Y+"px)"}}><p><span><i></i></span></p></div>

    }
}
