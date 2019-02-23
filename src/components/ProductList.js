import Intl from '../intl';
import React from 'react';

// import history from '../core/history';

import PureComponent from "../core/PureComponent"
import ProductItem from './ProductItem'
import TradeMgr from '../model/trade-mgr';
import {CONST} from "../public/const";
import CFDSearchProducts from './CFDSearchProducts';

const $ = window.$;
class ProductList extends PureComponent {
    constructor(props) {
        super(props);

        var selected = this.props.selected;
        this.state = {
            tradeType: selected ? TradeMgr.getProductTradeType(selected) : 0,
            isShow: true
        };
    }
    componentWillReceiveProps(nextProps){
        if (this.props.selected != nextProps.selected || !this.state.tradeType){
            this.changeTradeType(TradeMgr.getProductTradeType(nextProps.selected));
        }
    }
    selectProduct(product){
        TradeMgr.btnSelectProduct(product);
        // if(this.props.onChange){
        //     this.props.onChange(code);
        // }
    }
    changeTradeType(tradeType, e){
        // console.log("changeType")
        if (e){
            e.stopPropagation();
        }
        if (this.state.tradeType!=tradeType){
            this.setState({tradeType, isShow:true});
        }
    }
    toggleProduct(){
        this.setState({isShow:!this.state.isShow});
    }
    render() {
        const {entry, className, selected, visible} = this.props;
        const {tradeType, isShow} = this.state;
        const tradeTypeList = TradeMgr.getTradeTypeList();

        const productList = TradeMgr.getListByTradeType(tradeType);
        // const isFutEntry = entry == CONST.TRADE_TYPE.FUT;
        // console.log(productList);
        const height = Math.min($(window).height() - 50 - 10 - 46, 600);

        return (<div className={"show-head-options"+(className ? ` ${className}` : "")}>
            <ul className="trading-exchange-order-tab-title">
                {tradeTypeList && tradeTypeList.map((v, i) => {
                    return <li key={i} className={v == tradeType ? "active" : ""}
                               onClick={(e) => this.changeTradeType(v, e)}>{v == CONST.TRADE_TYPE.CFG ? Intl.lang("cfd.name") : (v == CONST.TRADE_TYPE.FUT ? Intl.lang("fut.type.7") : Intl.lang("new.home.header.2"))}</li>
                })}
            </ul>
            <div className={"pc-hide product-toggle "+(!isShow?"on":"")} onClick={this.toggleProduct.bind(this)}><i className="iconfont icon-shouqi fs18"></i></div>

            {(isShow && tradeType != CONST.TRADE_TYPE.CFG) && <div className="trading-exchange-list">
                {tradeType == CONST.TRADE_TYPE.FUT ?
                    (<ul className="trading-exchange-list-title contrac-trading-title">
                        <li>{Intl.lang("ProductList.100")}</li>
                        <li>{Intl.lang("TradeHistory.105")}</li>
                        <li>{Intl.lang("ProductList.wave")}</li>
                        <li>{Intl.lang("HomeKlineBox.105")}</li>
                    </ul>)
                    :
                    (tradeType == CONST.TRADE_TYPE.SPOT && <ul className="trading-exchange-list-title contrac-trading-title">
                                <li>{Intl.lang("ProductList.100")}</li>
                                <li className="tc">{Intl.lang("trade.open.buyPrice")}</li>
                                <li>{Intl.lang("trade.open.sellPrice")}</li>
                            </ul>
                    )}
                {(tradeType == CONST.TRADE_TYPE.FUT || tradeType == CONST.TRADE_TYPE.SPOT) && productList.map((v, i) => {
                    var info = v[0] ? v[0] : v;
                    if (info.Closed && info.Closed == "1") return;
                    return <ProductItem inMenu={true} data={info} tradeType={tradeType}
                                        onSelect={this.selectProduct.bind(this)}
                                        key={'plim' + i}/>
                })}
            </div>}
            {(isShow && tradeType == CONST.TRADE_TYPE.CFG) && <CFDSearchProducts height={height-60} isMenu={true} visible={visible} code={selected ? (TradeMgr.getProductTradeType(selected)==CONST.TRADE_TYPE.CFG ? selected.Code : "") : ""} />}
        </div>)
    }
}

export default ProductList;
