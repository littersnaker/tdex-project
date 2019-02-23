import React from 'react';
import FutTradeModel from "../model/fut-trade";
import Intl from "../intl";
import Decimal from "../utils/decimal";
import {CONST} from "../public/const";
import {IS_DEMO_PATH} from "../config";
import AuthModel from "../model/auth";
import SysTime from "../model/system";
import Event from "../core/event";
import {toast} from "../utils/common";
import PureComponent from "../core/PureComponent";
import ToolTip from "./ToolTip";

export default class FutContractDetail extends PureComponent {
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        this.priceTimer = 0;
        this.priceUpdateCount = 0;

        this.preferenceKey = 'fcdt';
        this.state = this.initState(this.props);
    }
    initState(props){
        const product = props.product;
        if (product){
            return {
                expanded: AuthModel.loadPreference(this.preferenceKey, true),
                product: product,
                isInd: false,
                useFunkRate: '',
                useIndFunkRate: ''
            };
        }else{
            return {
                expanded: true,
                product: product,
                isInd: false,
                useFunkRate: '',
                useIndFunkRate: ''
            }
        }
    }
    componentWillMount(){
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdateProductPriceDelay.bind(this), this);
        // Event.addListener(Event.EventName.FUT_ORDERRANK_UPDATE, this.onUpdateRank.bind(this), this);
        Event.addListener(Event.EventName.FUT_ORDER_UPDATE, this.onChangeUserFunkRate.bind(this), this);

        this.onUpdateProductPrice();
        this.onChangeUserFunkRate();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.product!=nextProps.product){
            if (!this.props.product){
                this.setState(this.initState(nextProps))
            }else {
                this.setState({product: nextProps.product});
            }
        }
    }

    onUpdateProductPriceDelay(data){
        if (data && this.props.product && data[this.props.product.Code]){
            // this.priceUpdateCount++;

            this.onUpdateProductPrice();
            // if (!this.priceTimer) this.priceTimer = Event.setTimer(()=>{
            //     this.onUpdateProductPrice();
            // }, 500, this);
        }
    }
    onUpdateProductPrice(){
        // if (this.priceUpdateCount>0){
        if (this.props.product){
            var products = FutTradeModel.getProduct(this.props.product.Code);
            this.setState({product: products[0]});
        }
        //     this.priceUpdateCount = 0;
        // }
    }
    onUpdateRank(){
        this.forceUpdate();
    }
    //componentDidMount(){
    //    this.domHeight = $('.newOrder-drag'+this.domIndex).height() + 10;
    //}
    componentDidUpdate(props) {
        if(!props.open && props.expandKey===this.preferenceKey && !this.state.expanded){
            this.props.onChange('reset', false);
            this.toggle("show", true);
        }
    }
    toggle(key, val) {
        if(this.state.expanded === val){
            return false;
        }
        var expanded = key ? val : !this.state.expanded;
        this.setState({expanded});

        AuthModel.savePreference(this.preferenceKey, expanded);
    }

    openNewPanel(event){
        event.preventDefault();

        this.props.onChange("open", [this.props.ind, "FutContractDetail"]);
        this.toggle("show", false);
    }
    closeNewOpen(event){
        event.preventDefault();
        this.props.onChange("close", [this.preferenceKey]);
    }
    notOPen(){
        toast(Intl.lang("common.not_open"),true);
    }
    openWin(url){
        if (typeof(ElectronExt)=='object' && ElectronExt.openExternal){
            ElectronExt.openExternal(`${process.env.REACT_APP_URL_ORIGIN}${url}`);
        }
    }
    remainHours (ts, now) {
        now = now || new Date().getTime();
        var remain = ts - now;
        remain = remain<0 ? 0 : remain;
        return Math.ceil(remain/(60*60*1000));
    }
    calcFundFee(fund){
        // 资金费率*仓位价值
        // 根据方向确定正负
        // 仓位价值=乘数*数量/均价
        const positionList = FutTradeModel.positionList;
        if (positionList) {
            //仓位价值
            var total = 0;
            positionList.forEach((v, i) => {
                if (v.Side == CONST.FUT.Side.BUY) {
                    total = Decimal.accAdd(Decimal.accDiv(Decimal.accMul(FutTradeModel.getCon(v.CID), v.Volume), v.Price), total);
                } else {
                    total = Decimal.accAdd((fund > 0 ? -1 : 1) * Decimal.accDiv(Decimal.accMul(FutTradeModel.getCon(v.CID), v.Volume), v.Price), total);
                }
            });
            var fee = Decimal.accMul(total, fund, 4);
            return fee;
        }
    }
    onChangeUserFunkRate(){
        var product = this.state.product;
        if (product){
            var price = product.price;
            if (price.FUND_RATE){
                var useFunkRate = this.calcFundFee(Number(price.FUND_RATE));
                var useIndFunkRate = this.calcFundFee(Number(price.IND_FUND_RATE));
                var data = {useFunkRate, useIndFunkRate};
                this.setState(data);
            }
        }
    }
    onMouseEnter(e){
        e.stopPropagation();

        this.setState({isInd:true});
    }
    onMouseLeave(e){
        e.stopPropagation();

        this.setState({isInd:false});
    }
    render() {
        const {ind, open, inDepth, className, notip} = this.props;
        const {product, isInd, useFunkRate, useIndFunkRate} = this.state;
        const price = product ? product.price : {};
        const fromCode = product ? product.fromCode : '--';
        const toCode = product ? product.toCode : '--';

        const rank = product ? FutTradeModel.getRankInPosition(product.ID) : -1;
        const ranks = [0,1,2,3,4];

        const {expanded} = this.state;
        return (
            <div className={className}>
                {!inDepth && (open ?
                        <div className="dialog-head tc lh-25">
                            <span className="handle"></span>
                            <h3 className="ft-dialog-head fem875 tb"><span>{Intl.lang("trade.contractDetail")}</span></h3>
                            <i className="iconfont icon-close transit fs14" onClick={(e)=>{this.closeNewOpen(e)}}></i>
                        </div>
                        :
                        <div className="mt-10 ft-new-deal flex-box flex-jc" onDoubleClick={(e)=>{this.openNewPanel(e)}}>{!notip&& <ToolTip title={Intl.lang("trade.drag.dragbarTip")}><span className="handle"></span></ToolTip>}
                            <span>{Intl.lang("trade.contractDetail")}</span><span className={expanded ? "iconfont icon-hide fs12":"iconfont icon-show fs12"} onClick={()=>this.toggle()}></span>
                        </div>
                )}

                {(inDepth || expanded || open) &&
                <div className="ft-order-deep">
                    <table className="table-new-deal mt-5" cellPadding="0">
                        <thead>
                        <tr className="tc tr-bg-white">
                            <th colSpan="2">
                                <div className="mt-10 tc">
                                    <p className="fem-275 lh-40 few-600">{price && price.LAST ? Decimal.toFixed(price.LAST, product.PriceFixed) : '--'}</p>
                                </div>
                                <div className="mb-10 ft-index-price">
                                    <ToolTip title={Intl.lang("trade.open.indexPriceTip")}><span>{price && price.INDEX ? Decimal.toFixed(price.INDEX, product.AvgPriceFixed) : '--'}</span></ToolTip>
                                    <ToolTip title={Intl.lang("trade.open.markPriceTip")}><span>
                                        {!this.isDesktop ?
                                            (!IS_DEMO_PATH ?
                                                <a href={AuthModel.getHelpCenterUrl(AuthModel.helpUrl(Intl.getLang(), 'markprice'))}
                                                   target="_blank">{" / " + (price && price.MARK ? Decimal.toFixed(price.MARK, product.AvgPriceFixed) : '--')}</a> :
                                                <a href="javascript:;">{" / " + (price && price.MARK ? Decimal.toFixed(price.MARK, product.AvgPriceFixed) : '--')}</a>)
                                            :
                                            (<a href="javascript:;" onClick={this.openWin.bind(this, AuthModel.getHelpCenterUrl(AuthModel.helpUrl(Intl.getLang(), 'markprice')))}>{" / " + (price && price.MARK ? Decimal.toFixed(price.MARK, product.AvgPriceFixed) : '--')}</a>)
                                        }

                                    </span></ToolTip>
                                    {/*<span className="futures-product-li" data-tip={Intl.lang("trade.open.deleverageIndicatorTip")}>*/}
                                    {/*{!this.isDesktop ?*/}
                                    {/*(!IS_DEMO_PATH ?*/}
                                    {/*<a className="cursor"*/}
                                    {/*href={AuthModel.getHelpCenterUrl(AuthModel.helpUrl(Intl.getLang(), 'adl'))}*/}
                                    {/*target="_blank">*/}
                                    {/*{ranks.map((v, i) => {*/}
                                    {/*return <span className={rank >= v ? "on" : ""}*/}
                                    {/*key={i}></span>*/}
                                    {/*})}*/}
                                    {/*</a>*/}
                                    {/*:*/}
                                    {/*<a href="javascrpt:;">*/}
                                    {/*{ranks.map((v, i) => {*/}
                                    {/*return <span className={rank >= v ? "on" : ""}*/}
                                    {/*key={i}></span>*/}
                                    {/*})}*/}
                                    {/*</a>*/}
                                    {/*)*/}
                                    {/*:*/}
                                    {/*(<a href="javascrpt:;" onClick={this.openWin.bind(this, AuthModel.getHelpCenterUrl(AuthModel.helpUrl(Intl.getLang(), 'adl')))}>*/}
                                    {/*{ranks.map((v, i) => {*/}
                                    {/*return <span className={rank >= v ? "on" : ""}*/}
                                    {/*key={i}></span>*/}
                                    {/*})}*/}
                                    {/*</a>)*/}
                                    {/*}*/}
                                    {/*</span>*/}
                                </div>
                            </th>
                        </tr>
                        </thead>
                        {!inDepth && <tbody className="lh-22">
                        <tr><td>{Intl.lang("trade.price.source")}</td><td>{product ? Intl.lang("trade."+product.Code+".source") : '--'}</td></tr>
                        <tr><td>{Intl.lang("trade.price.index")}</td><td>{price && price.INDEX ? Decimal.toFixed(price.INDEX, product.AvgPriceFixed) : '--'}</td></tr>
                        <tr><td>{Intl.lang("trade.volume.24hours")}</td><td>{((product && price && price.VOL_24h) ? Decimal.formatAmount(price.VOL_24h, product.VolFixed) : '--')}</td></tr>
                        {/*<tr><td>{Intl.lang("trade.instrument.openValue")}</td><td>{(price.MARK && Number(price.MARK) ? Decimal.formatAmount(Decimal.accDiv(price.OPEN_INTEREST, price.MARK), 4) : '')+ ' '+ fromCode}</td></tr>*/}
                        <tr onMouseEnter={this.onMouseEnter.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)}>
                            {!isInd ? (<React.Fragment>
                                    <td>{Intl.lang("trade.instrument.fundingRate")}</td>
                                    <td>{(price && price.FUND_RATE ? Decimal.toPercent(price.FUND_RATE, 4) + ' ' + Intl.lang("trade.fundingHour", this.remainHours(price.FUND_TS, SysTime.getServerTimeStamp(true))) : '--')}</td>
                                </React.Fragment>)
                                : (<React.Fragment>
                                    <td>{Intl.lang("futures.lv_info5_1")}</td>
                                    <td>{(price && price.IND_FUND_RATE ? Decimal.toPercent(price.IND_FUND_RATE, 4) + ' ' + Intl.lang("trade.fundingHour", this.remainHours(price.FUND_TS+8*3600*1000, SysTime.getServerTimeStamp(true))) : '--')}</td>
                                </React.Fragment>)
                            }
                        </tr>
                        <tr onMouseEnter={this.onMouseEnter.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)}>
                            {!isInd ? (<React.Fragment>
                                    <td>{Intl.lang("trade.funding")}</td>
                                    <td><span className={Number(useFunkRate)>0?"green5":(Number(useFunkRate)<0?"red5":"")}>{(useFunkRate ? useFunkRate : '--') + ' '}</span>{fromCode}</td>
                                </React.Fragment>)
                                :
                                (<React.Fragment>
                                    <td>{Intl.lang("trade.fundingInd")}</td>
                                    <td><span className={Number(useIndFunkRate)>0?"green5":(Number(useIndFunkRate)<0?"red5":"")}>{(useIndFunkRate ? useIndFunkRate : '--') + ' '}</span>{fromCode}</td>
                                </React.Fragment>)
                            }
                        </tr>
                        <tr><td>{Intl.lang("trade.contractValue")}</td><td>{(product ? product.Scale : '--')+ ' '+ toCode}</td></tr>
                        </tbody>}
                    </table>
                    {!inDepth && <div className="futures-info-more f-clear">
                        {!this.isDesktop &&
                            (!IS_DEMO_PATH ?
                                <a className="cursor"
                                   href={AuthModel.getHelpCenterUrl(AuthModel.helpUrl(Intl.getLang(), 'contract-specification'))}
                                   target="_blank">{Intl.lang("trade.moreDetails")}</a>
                                :
                                <a href="javascript:;"
                                   onClick={this.notOPen.bind(this)}>{Intl.lang("trade.moreDetails")}</a>)
                        }
                    </div>}
                </div>}
            </div>
        )
    }
}
