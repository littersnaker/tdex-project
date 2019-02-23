import Intl from '../intl';
import React from 'react';
// import ScrollArea from 'react-scrollbar';

import PureComponent from "../core/PureComponent"
import SpotTradeModel from "../model/spot-trade";

import Event from '../core/event';
import Decimal from '../utils/decimal';
import {getCurrencySymbol} from "../utils/common"
import {CONST} from "../public/const"

//import ReactTooltip from 'react-tooltip'

const $ = window.$;

class CommOrderBook extends PureComponent {
    constructor(props) {
        super(props);

        this.code = this.props.code;
        this.state = {
            product: this.code ? SpotTradeModel.getProduct(this.code) : null,
            depth: SpotTradeModel.getCurrDepth(),
            showCount: props.isSimple? 5 : this.props.isExpert ? 19 : 10
        };
    }

    componentWillMount(){
        Event.addListener(Event.EventName.DEPTH_UPDATE, this.onUpdateProductPrice.bind(this), this);
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdateProductPrice.bind(this), this);

        this.onUpdateProductPrice(SpotTradeModel.getProducts());
    }

    componentDidMount() {
        //ReactTooltip.rebuild();

        if(!this.props.isSimple){
            this.changeShowCount();

            $(window).on('resize', this.onWindowResize);
        }
    }

    onWindowResize = () => {
        this.changeShowCount();
    };

    componentWillUnmount() {
        $(window).off('resize', this.onWindowResize);

        super.componentWillUnmount();
    }

    changeShowCount(){
        var allHeight = $("#depthDiv").height();
        var priceHeight = $("#depthPriceDiv").height()+50;
        var height = parseInt((allHeight-priceHeight)/2);
        var showCount = parseInt(height/16);
        if (this.state.showCount!=showCount){
            this.setState({showCount});
        }
    }

    componentWillReceiveProps(nextProps){
        var code = nextProps.code;
        if (code!=this.props.code || !this.state.product){
            this.onChangeCode(code);
        }
        // if(this.scroll){
        //     this.scroll.scrollBottom();
        // }
    }
    onChangeCode(code){
        this.code = code;

        this.setState({product: SpotTradeModel.getProduct(this.code), depth: SpotTradeModel.getCurrDepth()});
    }
    onUpdateProductPrice(data){
        if (data && this.code && data[this.code]){
            // console.log(JSON.stringify(data));
            this.setState({product: SpotTradeModel.getProduct(this.code)});
        }
    }
    selectPrice(event, direction, price){
        event.preventDefault();

        Event.dispatch(Event.EventName.PRICE_SELECT, {Direction:direction, Price:price});
    }
    changeDepth(e){
        e.preventDefault();
        e.stopPropagation();

        var val = $(e.target).val();
        if(val=='-1') return false;

        SpotTradeModel.changeDepthSubscribe(val);
        if (this.state.depth!=val) this.setState({depth:parseInt(val)});
    }
    render() {
        const {isExpert, isMobile, isSimple} = this.props;
        const Lang = Intl.getLang();
        const {product, depth, showCount} = this.state;

        var askList = Object.keys(Array.apply(null, {length:showCount})).map((item,i)=>{
            return showCount-i;
        });
        var bidList = Object.keys(Array.apply(null, {length:showCount})).map((item,i)=>{
            return i+1;
        });

        var depthList, price, volFixed,cs, cnycs;
        var UD = 0, RANGE = 0, LAST_CHANGED = 0;
        var vol1 = 0, vol2 = 0;
        if (product){
            price = product.price;
            // var maxBar = bidList[bidList.length-1];
            // console.log("showCount:"+showCount);

            volFixed = product.VolFixed;
            cs = getCurrencySymbol(CONST.CURRENCY[product.toCode]);
            cnycs = getCurrencySymbol(CONST.CURRENCY.CNY);
            if (price){
                UD = parseFloat(price.change);
                RANGE = price.chg;
                LAST_CHANGED = price && price.hasOwnProperty("LAST_CHANGED") ? price.LAST_CHANGED : 0;
                LAST_CHANGED = LAST_CHANGED==price.LAST ? 0 : LAST_CHANGED;

                for (var i=0,l=askList.length; i<l; i++){
                    var v = askList[i];
                    if (!price.hasOwnProperty("ASK"+v)) continue;
                    vol1 = Decimal.toFixed(Decimal.accAdd(vol1, Decimal.round(price["AVOL"+v], product.VolFixed)), product.VolFixed);
                }
            }

            // const volFixed = SpotTradeModel.getVolFixed(this.code);
            depthList = SpotTradeModel.getDepthList(this.code);

            var self = this;

            // console.log("Spot LAST_CHANGED:",LAST_CHANGED);

        }
        return (
            isSimple?
                <div className="spot-trading-depth">
                    <div className="spot-trading-list-config">
                        <ul className="list-config-title" style={{marginBottom:"18px"}}>
                            <li>{Intl.lang("trade.history.SideTxt")}</li>
                            <li>{Intl.lang("TradeHistory.105")+"("+(cs ? cs.sn:"")+")"}</li><li>{Intl.lang("tradeHistory.1_9")}</li><li>{Intl.lang("TradeExpert.100")+"("+(cnycs ? cnycs.sn : "")+")"}</li>
                        </ul>
                        {askList.map((v, i)=>{
                            if (!price || !price.hasOwnProperty("ASK"+v)) return <ul className="list-config-content" key={'kong'+i}><li></li><li></li><li></li></ul>
                            //if (v<maxBar) vol1 = Decimal.toFixed(Decimal.accSubtr(vol1, Decimal.round(price["AVOL"+(v+1)], price.VolFixed)), price.VolFixed);
                            var cnyPrice = SpotTradeModel.calcPriceToCny(self.code, price["ASK"+v]);
                            return <ul className="list-config-content" key={'ask'+i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.BID, price["ASK"+v])}>
                                <li className="spot-color-b50a5c">{Intl.lang("trade.price.sell",(showCount-i))}</li>
                                <li>{price["ASK"+v] ? Decimal.formatAmount(price["ASK"+v], depth) : "--"}</li>
                                <li>{price["AVOL"+v] ? Decimal.formatAmount(price["AVOL"+v], volFixed) : "--"}</li>
                                <li>{cnyPrice ? String(Decimal.formatAmount(cnyPrice, 2)) : "--"}</li>
                            </ul>
                        })}
                        <ul className="list-config-content" style={{height:"40px"}}></ul>
                        {bidList.map((v, i)=>{
                            if (!price || !price.hasOwnProperty("BID"+v)) return <ul className="list-config-content" key={'emt'+i}><li></li><li></li><li></li></ul>
                            //vol2 = Decimal.toFixed(Decimal.accAdd(vol2, Decimal.round(price["BVOL"+v], price.VolFixed)), price.VolFixed);
                            var cnyPrice = SpotTradeModel.calcPriceToCny(self.code, price["BID"+v]);
                            return <ul className="list-config-content" key={'bid'+i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.ASK, price["BID"+v])}>
                                <li className="spot-color-81a417">{Intl.lang("trade.price.buy",(i+1))}</li><li>{price["BID"+v] ? Decimal.formatAmount(price["BID"+v],depth) : "--"}</li><li>{price["BVOL"+v] ? Decimal.formatAmount(price["BVOL"+v], volFixed) : "--"}</li><li>{cnyPrice ? String(Decimal.formatAmount(cnyPrice, 2)):"--"}</li>
                            </ul>
                        })}
                    </div>
                </div>
                :
            // isExpert ?
            <div className="trade-order-detail flex-box flex-md flex-jc" id="depthDiv">
                <div className={"order-deep-select book-order-deep-select "+Lang}>
                    <span>{Intl.lang("CommOrderBook.103")}</span>
                    <select onChange={this.changeDepth.bind(self)} className="deep-select sel-cus" value={depth}>
                        {/*<option value="-1">{Intl.lang("CommOrderBook.103")}</option>*/}
                        {depthList && depthList.map((v, i)=>{
                            return <option value={v} key={i} className={depth==v?"red1":null}>{Intl.lang("CommOrderBook.102", v)}</option>
                        })}
                    </select>
                </div>
                <dl className="trade-full-price-title">
                    <dd><span>{Intl.lang("TradeHistory.105")}</span><span>{Intl.lang("tradeHistory.1_9")}</span><span>{Intl.lang("TradeExpert.100")}</span></dd>
                </dl>
                <div className="t3-sa order-sell-box f-oh">
                    <ul className="order-sell fem75">
                        {askList.map((v, i)=>{
                            if (!price || !price.hasOwnProperty("ASK"+v)) return <li key={i}><span></span><span></span><span></span></li>
                            //if (v<maxBar) vol1 = Decimal.toFixed(Decimal.accSubtr(vol1, Decimal.round(price["AVOL"+(v+1)], price.VolFixed)), price.VolFixed);
                            var cnyPrice = SpotTradeModel.calcPriceToCny(self.code, price["ASK"+v]);
                            return <li key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.BID, price["ASK"+v])}>
                                <span>{price["ASK"+v] ? cs.sb+Decimal.formatAmount(price["ASK"+v], depth) : "--"}</span>
                                <span>{price["AVOL"+v] ? Decimal.formatAmount(price["AVOL"+v], volFixed) : "--"}</span>
                                <span>{cnyPrice ? cnycs.sb+String(Decimal.formatAmount(cnyPrice, 2)) : "--"}</span>
                            </li>
                        })}
                    </ul>
                </div>
                <div className="order-current order-center-full f-clear" id="depthPriceDiv">
                    <span><span className={"fem15"+(LAST_CHANGED>0?' green5':(LAST_CHANGED<0?' hotpink1':''))}>{price && price.LAST>0 ? Decimal.formatAmount(price.LAST, product.PriceFixed) : '--'}<i className={(LAST_CHANGED<0?"iconfont icon-down red1":(LAST_CHANGED>0?"iconfont icon-up green4":"iconfont"))}></i></span><span className={"pdl-10"+(Number(RANGE)>0?' green5':(Number(RANGE)<0?' hotpink1':''))}>{(price && price.LAST>0 ? (Number(RANGE)>0?'+ '+RANGE:RANGE):'--')+'%'}</span></span>
                </div>
                <div className="t3-sa f-oh">
                    <ul className="order-buy fem75">
                        {bidList.map((v, i)=>{
                            if (!price || !price.hasOwnProperty("BID"+v)) return <li key={i}><span></span><span></span><span></span></li>
                            //vol2 = Decimal.toFixed(Decimal.accAdd(vol2, Decimal.round(price["BVOL"+v], price.VolFixed)), price.VolFixed);
                            var cnyPrice = SpotTradeModel.calcPriceToCny(self.code, price["BID"+v]);
                            return <li key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.ASK, price["BID"+v])}><span>{price["BID"+v] ? cs.sb+Decimal.formatAmount(price["BID"+v],depth) : "--"}</span><span>{price["BVOL"+v] ? Decimal.formatAmount(price["BVOL"+v], volFixed) : "--"}</span><span>{cnyPrice ? cnycs.sb+String(Decimal.formatAmount(cnyPrice, 2)):"--"}</span></li>
                        })}
                    </ul>
                </div>
            </div>
            // :
            // <div className="okk-trade-left">
            //     {!isMobile &&<ul className="trade-order-head f-clear">
            //         <li>{Intl.lang("CommOrderBook.101")}</li>
            //     </ul>}
            //     <div className="trade-order-detail"  id="depthDiv">
            //         <ul className="order-sell fem75">
            //             {askList.map((v, i)=>{
            //                 if (!price.hasOwnProperty("ASK"+v)) return;
            //                 //if (v<maxBar) vol1 = Decimal.toFixed(Decimal.accSubtr(vol1, Decimal.round(price["AVOL"+(v+1)], price.VolFixed)), price.VolFixed);
            //                 var cnyPrice = SpotTradeModel.calcPriceToCny(self.code, price["ASK"+v]);
            //                 return <li key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.BID, price["ASK"+v])}><span>{price["ASK"+v] ? cs.sb+Decimal.formatAmount(price["ASK"+v], depth) : "--"}</span><span>{price["AVOL"+v] ? Decimal.formatAmount(price["AVOL"+v], volFixed) : "--"}</span><span>{cnyPrice ? cnycs.sb+String(Decimal.formatAmount(cnyPrice,2)):"--"}</span></li>
            //             })}
            //         </ul>
            //         <div className="order-current f-clear f-oh pdl-10" id="depthPriceDiv">
            //             <span className={UD>0?'green5':'hotpink1'}><span className="fem15">{price && price.LAST>0 ? Decimal.formatAmount(price.LAST, product.PriceFixed) : '--'}</span><span className="pdl-10">{(price && price.LAST>0 ? (RANGE>0?'+'+RANGE:RANGE):'--')+'%'}</span></span>
            //             <span className="order-deep-select pdr-5 fem875 fr"><span>{Intl.lang("CommOrderBook.100")}</span>
            //                  <select onChange={this.changeDepth.bind(self)} className="deep-select sel-cus" style={{"width":"80px"}} value={depth}>
            //                      {depthList.map((v, i)=>{
            //                          return <option value={v} key={i}>{v+Intl.lang("CommOrderBook.102")}</option>
            //                      })}
            //                  </select>
            //             </span>
            //         </div>
            //         <ul className="order-buy fem75">
            //             {bidList.map((v, i)=>{
            //                 if (!price.hasOwnProperty("BID"+v)) return;
            //                 //vol2 = Decimal.toFixed(Decimal.accAdd(vol2, Decimal.round(price["BVOL"+v], price.VolFixed)), price.VolFixed);
            //                 var cnyPrice = SpotTradeModel.calcPriceToCny(self.code, price["BID"+v]);
            //                 return <li key={i} onClick={(e)=>this.selectPrice(e, CONST.TRADE.DIRECTION.ASK, price["BID"+v])}><span>{price["BID"+v] ? cs.sb+Decimal.formatAmount(price["BID"+v], depth) : "--"}</span><span>{price["BVOL"+v] ? Decimal.formatAmount(price["BVOL"+v], volFixed) : "--"}</span><span>{cnyPrice ? cnycs.sb+String(Decimal.formatAmount(cnyPrice,2)):"--"}</span></li>
            //             })}
            //         </ul>
            //     </div>
            // </div>
        );

    }
}

export default CommOrderBook;
