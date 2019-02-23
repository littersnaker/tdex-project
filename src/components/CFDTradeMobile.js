import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';

//import ExpertHeader from './ExpertHeader'

import CFDKlineDiv from './CFDKlineDiv'
import {CFDHistory} from './CFDHistory';
import CFDRightPanel from './CFDRightPanel'
import ProductList from './ProductList'
import CFDProductDetail from './CFDProductDetail'
import MobileMenu from "./MobileMenu";

import AuthModel from '../model/auth';
import TradeMgr from '../model/trade-mgr';
import ChartModel from '../model/chart';
import Event from '../core/event';
import ErrorBoundary from "./ErrorBoundary";
import {CONST} from "../public/const";

const $ = window.$;

export default class CFDTradeMobile extends PureComponent {
    constructor(props) {
        super(props);

        this.Resolution = AuthModel.loadPreference("klType", "5MIN");
        this.tradeType = CONST.TRADE_TYPE.CFG;
        this.code = this.props.code;
        this.state = {
            product: TradeMgr.getProduct(this.code, this.tradeType),
            Resolution: this.Resolution,
            showOrder: this.getTypeVal("showOrder"),
            showKline: this.getTypeVal("showKline"),
            showLog: this.getTypeVal("showLog"),
            showDetail: this.getTypeVal("showDetail")
        }
    }
    getTypeVal(type){
        const blockParams = AuthModel.loadPreference("cfdBlock", false);
        return blockParams?blockParams[type]:true;
    }
    componentWillMount(){
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdateProduct.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onUpdateProduct.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_SELECT, this.onSelectProduct.bind(this), this);

        this.onUpdateProduct();
    }
    onUpdateProduct(info){
        var data = {code: this.code};
        if (!info || info[this.code]){
            data.product = TradeMgr.getProduct(this.code, this.tradeType);
        }
        this.setState(data);
    }
    onSelectProduct(code){
        this.code = code;
        this.setState({code: code, product:TradeMgr.getProduct(this.code, this.tradeType)});
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
    setResolution(item){
        let value = item.value || this.Resolution;

        this.Resolution = value;
        ChartModel.setResolution(value);

        AuthModel.savePreference("klType", item.key);
        this.setState({Resolution:item.key});
    }
    toggleBlock(type){
        const { showKline, showLog, showOrder} = this.state;
        var params = {showKline:showKline, showLog:showLog, showOrder:showOrder};

        if(type=="kline"){
            params.showKline = !this.state.showKline;
        }else if(type=="log"){
            params.showLog = !this.state.showLog;
        }else if(type=="order"){
            params.showOrder = !this.state.showOrder;
        }else if(type=="detail"){
            params.showDetail = !this.state.showDetail;
        }

        this.setState(params);

        AuthModel.savePreference("cfdBlock", params);
    }
    render(){
        const {product, Resolution, showKline, showLog, showOrder, showDetail} = this.state, {user, uInfo, code} = this.props;

        const solutionMap = this.getSolutionMap();
        return (
            <React.Fragment>
                <MobileMenu user={user} uInfo={uInfo} />

                <div id="mb-futures-center" className="trading-exchange-config futures-bg-primary" style={{overflowY:"auto"}}>
                    <ProductList selected={product} entry={CONST.TRADE_TYPE.CFG} visible={true}/>

                    <div className="trading-exchange-body">
                        <div className="mb-kline-head f-clear mt-10"><span>{Intl.lang("trade.new_order")}</span>
                            <i className={"iconfont pd010 fs14 fr "+(showOrder?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("order")}></i>
                        </div>
                        {showOrder &&<CFDRightPanel code={code} isMobile={true} />}

                        <div className="mb-kline-head f-clear mt-10"><span>{Intl.lang("mobile.futures.chart")}</span>
                            <i className={"iconfont pd010 fs14 fr "+(showKline?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("kline")}></i>
                        </div>
                        {showKline &&<React.Fragment>
                            <div className="mb-kLine-resolution h-auto">
                                <div className="mb-resolution-bg"></div>
                                <div className="mb-resolution-btnBox">
                                    {solutionMap.map((item, v)=>{
                                        return <span key={v} className={item.key==Resolution?"current":""} onClick={()=>this.setResolution(item)}>{item.text}</span>
                                    })}
                                </div>
                            </div>
                            <div key="KlineDiv" className="KlineDiv futures-bg-primary" style={{height:355}}><CFDKlineDiv code={code} isMobile={true} /></div>
                        </React.Fragment>}

                        <div className="mb-kline-head f-clear mt-10"><span>{Intl.lang("mobile.futures.menu.2")}</span>
                            <i className={"iconfont pd010 fs14 fr "+(showKline?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("log")}></i>
                        </div>
                        {showLog &&<div key="CFDHistory" className="CFDHistory">
                            <ErrorBoundary showError={true}><CFDHistory isMobile={true} ref={(hr)=>this.hRef=hr} height={500}/></ErrorBoundary>
                        </div>}

                        <div className="mb-kline-head f-clear mt-10"><span>{Intl.lang("Billlog.table.detail")}</span>
                            <i className={"iconfont pd010 fs14 fr "+(showDetail?"icon-hide":"icon-show")} onClick={()=>this.toggleBlock("detail")}></i>
                        </div>
                        {(product && showDetail) &&<ErrorBoundary showError={true}><CFDProductDetail isMobile={true} product={product} /></ErrorBoundary>}


                        <div className="mb-footer c-8"><span className="fem75 ml-10">{Intl.lang("Footer.109")}</span></div>
                    </div>

                    <span id="drag-order-panel"></span>
                </div>

            </React.Fragment>
        )
    }
}
