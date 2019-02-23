import React from 'react';

import PureComponent from "../core/PureComponent"
import {formatStr} from "../utils/common"
import {CONST} from "../public/const"
import Decimal from '../utils/decimal';
import Intl from '../intl';
import TradeMgr from '../model/trade-mgr';

export default class ProductItem extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    clickCode(data, evt){
        evt.preventDefault();
        evt.stopPropagation();

        if (data && this.props.onSelect){
            this.props.onSelect(data);
        }
    }

    componentWillUnmount(){
        document.title = "TDEx | Turing Derivatives Exchange"
    }

    render() {
        const {inMenu, data, isTrade} = this.props;
        // const lang = Intl.getLang();
        var tradeType = this.props.tradeType;
        if (data){
            tradeType = TradeMgr.getProductTradeType(data);

            var price = data.price;
            var RANGE = price && price.hasOwnProperty("chg") ? price.chg : 0;
            var RangeNum = Number(RANGE);
            var VOL_24h = price && price.hasOwnProperty("VOL_24h") ? price.VOL_24h : 0;
            // var codeName = data && data.Code ? data.fromCode.toUpperCase() : '';
            var displayName = data && data.DisplayName ? data.DisplayName : '';
            var last = price && price.LAST ? price.LAST : 0;
            var LAST_CHANGED = price && price.hasOwnProperty("LAST_CHANGED") ? price.LAST_CHANGED : 0;
            LAST_CHANGED = LAST_CHANGED==last ? 0 : LAST_CHANGED;

            // var toCode = data.toCode;
            // var cs = getCurrencySymbol(CONST.CURRENCY[toCode]);

            var priceTxt, lastTxt;
            if (tradeType!=CONST.TRADE_TYPE.CFG){
                if (last>0){
                    lastTxt = last>0?Decimal.formatAmount(last, data.PriceFixed):'--';
                    priceTxt = lastTxt;
                }
            }else{
                priceTxt = price && price.ASK>0?Decimal.formatAmount(price.BID, data.PriceFixed)+"/"+Decimal.formatAmount(price.ASK, data.PriceFixed):"--";
            }
            if (!inMenu){
                if (isTrade){
                    document.title = formatStr("{1} {2} TDEx | Turing Derivatives", priceTxt, displayName);
                }else{
                    document.title = "TDEx | Turing Derivatives Exchange"
                }
            }

            // console.log("ProductItem", JSON.stringify(data));

            // console.log(inMenu, data.Code, "LAST_CHANGED:",LAST_CHANGED);
            return (
                inMenu ?  (tradeType==CONST.TRADE_TYPE.FUT ?
                        <ul className="trading-exchange-list-content contrac-trading-content" onClick={this.clickCode.bind(this, data)}>
                            <li className="item">
                                <ul className="item-content">
                                    <li>{displayName}</li>
                                    <li className={last>0?(LAST_CHANGED<0?"exchange-red":(LAST_CHANGED>0?"exchange-green":"")):""}>{lastTxt}</li>
                                    <li className={last>0?(RangeNum<0?"exchange-red":(RangeNum>0?"exchange-green":"")):""}>{last>0?(RangeNum>0?'+'+RANGE:RANGE)+'%':'--'}</li>
                                    <li>{Decimal.addCommas(VOL_24h)}</li>
                                </ul>
                            </li>
                        </ul>
                        :
                        <ul className="trading-exchange-list-content contrac-trading-content" onClick={this.clickCode.bind(this, data)}>
                            <li className="item">
                                <ul className="item-content">
                                    <li>{displayName}</li>
                                    <li className="exchange-green tc">{price && Number(price.BID) ? Decimal.formatAmount(price.BID, data.PriceFixed) : '--'}</li>
                                    <li className="exchange-red">{price && Number(price.ASK) ? Decimal.formatAmount(price.ASK, data.PriceFixed) : '--'}</li>
                                </ul>
                            </li>
                        </ul>
                    )
                    : (<div className="tick-price fl ml-20">
                        {tradeType == CONST.TRADE_TYPE.FUT ?
                            <span>{Intl.lang("trade.open.lastPrice") + Intl.lang("common.symbol.colon")}<span
                                className={last > 0 ? (LAST_CHANGED < 0 ? "red1" : (LAST_CHANGED > 0 ? "green4" : "")) : ""}>{lastTxt}<i
                                className={last > 0 ? (LAST_CHANGED < 0 ? "iconfont icon-down fem125" : (LAST_CHANGED > 0 ? "iconfont icon-up fem125" : "iconfont fem125")) : "iconfont fem125"}></i></span></span>
                            :
                            <React.Fragment>
                            <span>{Intl.lang("trade.open.sell") + Intl.lang("common.symbol.colon")}<span
                                className="exchange-red">{price && Number(price.BID) ? Decimal.formatAmount(price.BID, data.PriceFixed) : '--'}</span></span>
                            <span className="pdl-15">{Intl.lang("trade.open.buy") + Intl.lang("common.symbol.colon")}<span
                                    className="exchange-green">{price && Number(price.ASK) ? Decimal.formatAmount(price.ASK, data.PriceFixed) : '--'}</span></span>
                            </React.Fragment>
                        }
                        <span className="pdl-15">{Intl.lang("ProductList.wave")+Intl.lang("common.symbol.colon")}<span className={Number(RANGE)<0?"red1":(Number(RANGE)>0?"green4":"")}>{(Number(RANGE)>0?'+'+RANGE:RANGE)+'%'}</span></span>
                        {tradeType==CONST.TRADE_TYPE.FUT &&
                        <React.Fragment>
                            <span className={"pdl-15"}>{Intl.lang("trade.history.Mark")+Intl.lang("common.symbol.colon")}<span>{(price && Number(price.MARK)?Decimal.formatAmount(price.MARK, data.AvgPriceFixed) : '--')}</span></span>
                            <span className={"pdl-15"}>{Intl.lang("trade.price.index")+Intl.lang("common.symbol.colon")}<span>{(price && Number(price.INDEX)?Decimal.formatAmount(price.INDEX, data.AvgPriceFixed) : '--')}</span></span>
                        </React.Fragment>
                        }
                    </div>)
            );

        }
        return (
            inMenu ?  (tradeType==CONST.TRADE_TYPE.FUT ? <ul className="trading-exchange-list-content contrac-trading-content"><li className="item"><ul className="item-content"><li>--</li><li>--</li><li>--</li><li>--</li></ul></li></ul> :
                <ul className="trading-exchange-list-content contrac-trading-content"><li className="item"><ul className="item-content"><li>--</li><li className="exchange-green tc">--</li><li className="exchange-red">--</li></ul></li></ul>)
                : (<div className="tick-price fl ml-20">
                    <span>{Intl.lang("trade.open.lastPrice")+Intl.lang("common.symbol.colon")}<span>--</span></span>
                    <span className="pdl-15">{Intl.lang("ProductList.wave")+Intl.lang("common.symbol.colon")}<span>--</span></span>
                    {tradeType==CONST.TRADE_TYPE.FUT &&
                    <React.Fragment>
                        <span className={"pdl-15"}>{Intl.lang("trade.history.Mark")+Intl.lang("common.symbol.colon")}<span>--</span></span>
                        <span className={"pdl-15"}>{Intl.lang("trade.price.index")+Intl.lang("common.symbol.colon")}<span>--</span></span>
                    </React.Fragment>
                    }
                </div>)
        )
    }
}
