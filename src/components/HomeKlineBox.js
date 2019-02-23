import Intl from '../intl';
import React, {PropTypes} from 'react';

import PureComponent from "../core/PureComponent"
import KlineDiv from './KlineDiv';

import Event from '../core/event';
// import SpotTradeModel from '../model/spot-trade';
import {getCurrencySymbol} from "../utils/common"
import {CONST} from "../public/const"
import TradeMgr from '../model/trade-mgr';
import {FutProduct} from '../model/product';
import Decimal from '../utils/decimal';

class HomeKlineBox extends PureComponent{
    constructor(props) {
        super(props);

        this.code = TradeMgr.getCurrCode();

        this.state = {
            code: this.code,
            selected: TradeMgr.getSelectedProduct(this.productList, this.code),
            type: TradeMgr.getType(this.code),
            typeList: TradeMgr.getTypeList()
        };
    }
    componentWillMount(){
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onUpdatePrice.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_SELECT, this.onSelectProduct.bind(this), this);
    }
    onUpdatePrice(info){
        this.productList = TradeMgr.getProductList();
        var data = {productList: this.productList};
        if (info[this.code]){
            data.selected = TradeMgr.getSelectedProduct(this.productList, this.code)
        }
        this.setState(data);
    }
    onSelectProduct(code){
        this.code = code;
        this.setState({code: code, selected:TradeMgr.getSelectedProduct(this.productList, this.code),type: TradeMgr.getType(this.code)});
    }

    selectCode(code, isFut){
        TradeMgr.btnSelectCode(code, isFut);
    }
    changeType(type, e){
        if (e){
            e.preventDefault();
            e.stopPropagation();
        }

        if (this.state.type!=type){
            this.setState({type:type});
        }
    }
    render() {
        const {code, productList, selected, typeList, type} = this.state;
        var data = selected;
        var priceFixed = data.PriceFixed;
        var volFixed = data.VolFixed;
        var price = data.price;
        var RANGE = price && price.chg ? price.chg : 0;
        var toCode = data.toCode;
        var cs = getCurrencySymbol(CONST.CURRENCY[toCode]);
        var subCode = data.fromCode;
        var ss = getCurrencySymbol(CONST.CURRENCY[subCode]);

        return (
            <div className="klinebox">
                <div className="contain pdt-1" style={{maxWidth:1300, width:1300}}>
                    {/*
                    <div className="kline-theme-border"></div>
                    <div className="kline-theme">{Intl.lang("HomeKlineBox.100")}</div>
                     */}
                    <div className="f-clear">
                        <ul className="market-nav fl">
                        {typeList.map((v, i)=>{
                            var vt=v;
                            return <li className={type==v.Code?"current":""} key={i}>
                                <div onClick={(e)=>this.changeType(v.Code, e)}><span>{v.Name ? v.Name+Intl.lang("ProductList.100") : (v.LangKey ? Intl.lang(v.LangKey) : '')}</span><i className={"iconfont ml-10 icon-"+ (type==v.Code?"shouqi":"xiala")}></i></div>

                                <dl className="market-child" ref={"market_menu" + v.Code}>
                                    {productList.map((c, j) => {
                                        var info = c[0] ? c[0] : c;
                                        if (info.Type==vt.Code) return <dd className={code == info.Code ? "current" : ""} onClick={() => this.selectCode(info.Code, info instanceof FutProduct)} key={j}>
                                            <span><i className={"iconfont icon-" + info.fromCode}></i><span className="menu-st">{info.Name}</span></span><i className="triangle-right"></i></dd>
                                    })}
                                </dl>

                        </li>
                        })}
                        </ul>
                        <div className="fr" style={{width:1140}}>
                            <ul className="kline-info-box tc mt-40 f-clear">
                                <li>
                                    <p>{Intl.lang("HomeKlineBox.101")}</p>
                                    <p className="fem-175">{cs.sb+Decimal.formatAmount(price.LAST, priceFixed)}</p>
                                </li>
                                <li>
                                    <p>{Intl.lang("HomeKlineBox.102")}</p>
                                    <p className="fem-175">{(RANGE>0?'+'+RANGE:RANGE)+'%'}</p>
                                </li>
                                <li>
                                    <p>{Intl.lang("HomeKlineBox.103")}</p>
                                    <p className="fem-175">{cs.sb+Decimal.formatAmount(price.HIGH, priceFixed)}</p>
                                </li>
                                <li>
                                    <p>{Intl.lang("HomeKlineBox.104")}</p>
                                    <p className="fem-175">{cs.sb+Decimal.formatAmount(price.LOW, priceFixed)}</p>
                                </li>
                                <li>
                                    <p>{Intl.lang("HomeKlineBox.105")}</p>
                                    <p className="fem-175"><i className={"iconfont fem icon-"+subCode}></i>{Decimal.formatAmount(price.VOL, volFixed)}</p>
                                </li>
                            </ul>

                            <KlineDiv className="kline-chart-contain" code={code} theme="dark"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default HomeKlineBox;
