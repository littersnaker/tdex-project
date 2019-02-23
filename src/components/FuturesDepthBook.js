import React from 'react';
import FutTradeModel from "../model/fut-trade";
import Decimal from "../utils/decimal";
import Intl from "../intl";
import {CONST} from "../public/const";
import AuthModel from "../model/auth";
import Event from "../core/event";
import {isEmptyObject} from "../utils/util";
import PureComponent from "../core/PureComponent";
import FutSettingMenu from "./FuturesSettingMenu"
import FutContractDetail from "./FuturesContractDetail"
import ToolTip from "./ToolTip";

export default class FutDepthOrderBook extends PureComponent {
    constructor(props) {
        super(props);

        this.preferenceKey = 'fcob';
        this.state = {
            product: this.props.product,
            expanded: AuthModel.loadPreference(this.preferenceKey, true),
            depthColumn: FutTradeModel.loadSetting("depthColumn"),
            colorTheme: FutTradeModel.loadSetting("colorTheme"),
            depthCount: FutTradeModel.loadSetting("depthCount"),
            showBg: FutTradeModel.loadSetting("showBg"),
            showVolSum: FutTradeModel.loadSetting("showVolSum"),
        };
    }

    componentWillMount(){
        // Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdateProductPrice.bind(this), this);
        Event.addListener(Event.EventName.DEPTH_UPDATE, this.onUpdateProductPrice.bind(this), this);
        Event.addListener(Event.EventName.SETTING_UPDATE, this.onUpdateSetting.bind(this), this);

        this.onUpdateProductPrice(FutTradeModel.getPrices());
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
    toggle(show, val) {
        if(this.state.expanded === val){
            return false;
        }
        var expanded = show ? val : !this.state.expanded;
        this.setState({expanded});
        AuthModel.savePreference(this.preferenceKey, expanded);
    }
    onUpdateProductPrice(data){
        if (data && this.props.product && data[this.props.product.Code]){
            // console.log(JSON.stringify(data));
            var products = FutTradeModel.getProduct(this.props.product.Code);
            this.setState({product: products[0]});
        }
    }
    onUpdateSetting(data){
        var state = {};
        ["colorTheme", "depthCount", "showBg", "showVolSum", "depthColumn"].forEach((v, i)=>{
            if (data.hasOwnProperty(v)){
                state[v] = data[v];
            }
        });
        if (!isEmptyObject(state)) this.setState(state);
    }

    selectPrice(event, direction, price, vol){
        event.preventDefault();

        Event.dispatch(Event.EventName.PRICE_SELECT, {Direction:direction, Price:price, Volume:vol});
    }

    openNewPanel(event){
        event.preventDefault();

        this.props.onChange("open", [this.props.ind, "FutCommOrderBook"]);
        this.toggle('show', false);
    }
    closeNewOpen(event){
        event.preventDefault();
        this.props.onChange("close", [this.preferenceKey]);
    }
    render() {
        const {isExpert, ind, open, notip, className} = this.props;
        const {product, expanded, colorTheme, depthCount, showBg, showVolSum,depthColumn} = this.state;

        var UD = 0, RANGE = 0;
        var price = {}, priceFixed, volFixed;
        var volTotal = {}, bVolTotal = 0;
        var askGray = {};
        var subIndex = -2;
        var prevBStr = "";
        var maxVol = FutTradeModel.getMaxVolProg();
        if (product){
            price = product.price;
            var askList = [1,2,3,4,5,6,7,8,9,10];
            var bidList = [1,2,3,4,5,6,7,8,9,10];
            var maxBar = bidList[bidList.length-1];
            priceFixed = product.PriceFixed;
            volFixed = product.VolFixed;
            //var cs = getCurrencySymbol(CONST.CURRENCY[product.toCode]);
            //var cnycs = getCurrencySymbol(CONST.CURRENCY.CNY);
            if (price){
                UD = parseFloat(price.change);
                RANGE = price.chg;
                // if (price.VOL_MAX) maxVol = Number(price.VOL_MAX)>maxVol ? price.VOL_MAX : maxVol;
                // var vol = 0;
                // // var prevBStr = "";
                // for (var i=askList.length-1; i>=0; i--){
                //     vol = Decimal.toFixed(Decimal.accAdd(vol, Decimal.round(price["AVOL"+askList[i]], volFixed)), volFixed);
                //     volTotal["AVOL"+askList[i]] = vol;
                //
                //     //标记前几位数字相同的变灰
                //     // var ap = price["ASK"+askList[i]];
                //     // if (ap){
                //     //     ap = Decimal.formatAmount(ap, priceFixed);
                //     //     var bstr = ap.slice(0, subIndex);
                //     //     if (bstr==prevBStr){
                //     //         askGray[askList[i]] = {b:bstr, a:ap.slice(subIndex)};
                //     //     }else{
                //     //         prevBStr = bstr;
                //     //     }
                //     // }
                // }
                // prevBStr = "";
            }
        }

        var self = this;
        var bTotal = 0, bVol = 0, aTotal = 0, aVol = 0;
        var isShow = (expanded || open);
        //单列显示时，卖价深度倒序排
        var askRows;
        if (isShow && depthColumn==1){
            askRows = askList.map((v, i)=>{
                // var vol = price["AVOL"+v];
                // bVolTotal = Decimal.toFixed(Decimal.accAdd(bVolTotal, Decimal.round(vol, product.VolFixed)), product.VolFixed);
                if (v <= depthCount){
                    aVol = Decimal.accAdd(price["AVOL"+v], aVol);
                    aTotal = Decimal.accAdd(Decimal.accMul(price["ASK"+v], price["AVOL"+v]), aTotal);
                    var vol = price["AVOL"+v] ? Decimal.formatAmount(price["AVOL"+v], volFixed) : "--";
                    var volSum = Number(price["ASK"+v]) ? Decimal.formatAmount(String(aVol), volFixed) : '--';
                    var percentWidth = Decimal.accMul(Math.min(1, Number(Decimal.accDiv(price["AVOL"+v], maxVol))), 297, 0);

                    return <tr key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.BID, price["ASK"+v], price["AVOL"+v])} className="point">
                        <td><span className="sell">{price["ASK"+v] ? Decimal.formatAmount(price["ASK"+v], priceFixed) : "--"}</span></td>
                        <td><span>{vol}</span></td>
                        <td><div className="deep-bg-r db-row" style={{width: percentWidth+"px"}}></div>
                            <span>{volSum}</span></td>
                    </tr>
                }
            });
            askRows.reverse();
        }
        return (
            <div ref="orderBook" className={className}>
                {open ?
                    <div className="dialog-head tc lh-25">
                        <span className="handle"></span>
                        <h3 className="ft-dialog-head fem875 tb"><span>{Intl.lang("trade.settingMenu.depth")}</span></h3>
                        <i className="iconfont icon-close transit fs14" onClick={(e)=>{this.closeNewOpen(e)}}></i>
                    </div>
                    :
                    <div className="mt-10 ft-new-deal flex-box flex-jc" onDoubleClick={(e)=>{this.openNewPanel(e)}}>{!notip&& <ToolTip title={Intl.lang("trade.drag.dragbarTip")}><span className="handle"></span></ToolTip>}
                        <span>{Intl.lang("trade.open.depth")}</span>
                        <div>
                            {product && <FutSettingMenu name="depth" side={!expanded && ind==3 ? 'top' : 'bottom'} />}
                            <i className={expanded ? "iconfont icon-hide fs12": "iconfont icon-show fs12"} onClick={()=>this.toggle()}></i>
                        </div>
                    </div>
                }
                <div className={"ft-order-deep skin-dif-table mt-5"+(showBg ? " color-pg1" : "")}>
                    {(isShow && depthColumn==2) && <div className="flex-box flex-jc div-table-bd table-double">
                        <table className="table-book-deep wp-50" cellPadding="0" cellSpacing="0">
                            <thead>
                            {depthCount>0 && <tr className="tc">
                                <th>{Intl.lang(showVolSum?"trade.open.volSum":"futures.hist_title2")}</th>
                                <th>{Intl.lang("trade.open.buyPrice")}</th>
                            </tr>}
                            </thead>
                            <tbody>
                            {bidList && bidList.map((v, i)=>{
                                if (v <= depthCount || depthCount==0){
                                    bVol = Decimal.accAdd(price["BVOL"+v], bVol);
                                    bTotal = Decimal.accAdd(Decimal.accMul(price["BID"+v], price["BVOL"+v]), bTotal);
                                    var percentWidth, vol;
                                    if (showVolSum){
                                        vol = Number(price["BID"+v]) ? Decimal.formatAmount(String(bVol), volFixed) : '--';
                                        percentWidth = Decimal.accMul(Math.min(1, Number(Decimal.accDiv(bVol, maxVol))), 150, 0);
                                    }else{
                                        vol = Number(price["BID"+v]) ? Decimal.formatAmount(price["BVOL"+v], volFixed) : "--";
                                        percentWidth = Decimal.accMul(Math.min(1, Number(Decimal.accDiv(price["BVOL"+v], maxVol))), 150, 0);
                                    }
                                    if (depthCount>0) return <tr key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.ASK, price["BID"+v], price["BVOL"+v])} className="point">
                                        <td><span>{vol}</span></td>
                                        <td><div className="deep-bg-l" style={{width: percentWidth+"px"}}></div>
                                            <span className="buy">{price["BID"+v] ? Decimal.formatAmount(price["BID"+v], priceFixed) : "--"}</span></td>
                                    </tr>
                                }
                            })}
                            </tbody>
                        </table>
                        <table className="table-book-deep wp-50 bd-l-none" cellPadding="0" cellSpacing="0">
                            <thead>
                            {depthCount>0 && <tr className="tc">
                                <th>{Intl.lang("trade.open.sellPrice")}</th>
                                <th>{Intl.lang(showVolSum?"trade.open.volSum":"futures.hist_title2")}</th>
                            </tr>}
                            </thead>
                            <tbody>
                            {askList && askList.map((v, i)=>{
                                // var vol = price["AVOL"+v];
                                // bVolTotal = Decimal.toFixed(Decimal.accAdd(bVolTotal, Decimal.round(vol, product.VolFixed)), product.VolFixed);
                                if (v <= depthCount || depthCount==0){
                                    aVol = Decimal.accAdd(price["AVOL"+v], aVol);
                                    aTotal = Decimal.accAdd(Decimal.accMul(price["ASK"+v], price["AVOL"+v]), aTotal);
                                    var percentWidth, vol;
                                    if (showVolSum){
                                        vol = Number(price["ASK"+v]) ? Decimal.formatAmount(String(aVol), volFixed) : '--';
                                        percentWidth = Decimal.accMul(Math.min(1, Number(Decimal.accDiv(aVol, maxVol))), 150, 0);
                                    }else{
                                        vol = Number(price["ASK"+v]) ? Decimal.formatAmount(price["AVOL"+v], volFixed) : "--";
                                        percentWidth = Decimal.accMul(Math.min(1, Number(Decimal.accDiv(price["AVOL"+v], maxVol))), 150, 0);
                                    }
                                    if (depthCount>0) return <tr key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.BID, price["ASK"+v], price["AVOL"+v])} className="point">
                                        <td><span className="sell">{price["ASK"+v] ? Decimal.formatAmount(price["ASK"+v], priceFixed) : "--"}</span>
                                            <div className="deep-bg-r" style={{width: percentWidth+"px"}}></div></td>
                                        <td><span>{vol}</span></td>
                                    </tr>
                                }
                            })}
                            </tbody>
                        </table>
                    </div>}
                    {(isShow && depthColumn==2) && <div className="mt-5 ft-km flex-box flex-jc">
                        <span className="buy">{Number(bVol) ? Decimal.toKorM(bVol)+'/'+ String(Decimal.accDiv(bTotal, bVol, priceFixed)) : '--/--'}</span><span className="sell">{Number(aVol) ? String(Decimal.accDiv(aTotal, aVol, priceFixed))+'/'+Decimal.toKorM(aVol) : '--/--'}</span>
                    </div>}

                    {(isShow && depthColumn==1) &&
                    <div className={showBg ? "color-pg1 div-table-bd table-single" : "div-table-bd table-single"}>
                        <table className="table-book-deep" cellPadding="0" cellSpacing="0">
                            <thead>
                            {depthCount>0 && <tr className="tc"><th>{Intl.lang("trade.open.price")}</th><th>{Intl.lang("futures.hist_title2")}</th><th>{Intl.lang("trade.open.volSum")}</th></tr>}
                            </thead>
                            <tbody>
                            {askRows}
                            </tbody>
                        </table>
                        <FutContractDetail product={product} isExpert={true} inDepth={true} />
                        <table className="table-book-deep mt-5" cellPadding="0" cellSpacing="0">
                            <tbody>
                            {bidList && bidList.map((v, i)=>{
                                if (v <= depthCount){
                                    bVol = Decimal.accAdd(price["BVOL"+v], bVol);
                                    bTotal = Decimal.accAdd(Decimal.accMul(price["BID"+v], price["BVOL"+v]), bTotal);
                                    var vol = (price["BVOL"+v] ? Decimal.formatAmount(price["BVOL"+v], volFixed) : "--");
                                    var volSum = Number(price["BID"+v]) ? Decimal.formatAmount(String(bVol), volFixed) : '--';
                                    var percentWidth = Decimal.accMul(Math.min(1, Number(Decimal.accDiv(price["BVOL"+v], maxVol))), 297, 0);
                                    return <tr key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.ASK, price["BID"+v], price["BVOL"+v])} className="point">
                                        <td><span className="buy">{price["BID"+v] ? Decimal.formatAmount(price["BID"+v], priceFixed) : "--"}</span></td>
                                        <td><span>{vol}</span></td>
                                        <td><div className="deep-bg-l db-row" style={{width: percentWidth+"px"}}></div>
                                            <span>{volSum}</span></td>
                                    </tr>
                                }
                            })}
                            </tbody>
                        </table>

                    </div>
                    }

                </div>
            </div>
        )
    }
}
