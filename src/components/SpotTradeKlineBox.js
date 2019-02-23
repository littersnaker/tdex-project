import Intl from '../intl';
import React from 'react';

import PureComponent from "../core/PureComponent"
import KlineDiv from './KlineDiv';

// import Event from '../core/event';
import TradeMgr from '../model/trade-mgr';
import SpotTradeModel from '../model/spot-trade';
import AuthModel from '../model/auth';

class TradeKlineBox extends PureComponent {
    constructor(props) {
        super(props);

        this.productList = SpotTradeModel.getProductList();
        this.hideKlineKey = 'hkl';

        this.state = {
            lineHide: AuthModel.loadPreference(this.hideKlineKey) || false,
            productList: this.productList
        };
    }
    componentWillReceiveProps(nextProps){
        // console.log("next="+nextProps.code);
    }
    componentWillMount(){
        // Event.addOnce(Event.EventName.PRODUCT_PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
    }

    // onUpdatePrice(data){
    //     this.productList = SpotTradeModel.getProductInfoList();
    //     this.setState({productList: this.productList});
    // }
    // onSelectProduct(code){
    //     this.code = code;
    //     this.setState({code: code});
    // }
    hideKline(){
        var isHide = this.state.lineHide ? false : true;
        this.setState({lineHide:isHide});

        AuthModel.savePreference(this.hideKlineKey, isHide);
    }
    selectProduct(code){
        if (this.props.code != code){
            TradeMgr.btnSelectCode(code);
        }
    }
    changeType(type, e){
        if (e){
            e.preventDefault();
            e.stopPropagation();
        }

        var product = SpotTradeModel.getProduct(this.props.code);
        var toCode = product.Type;
        if (type!=toCode){
            var info = TradeMgr.defaultProduct(this.productList, type);
            if (info) this.selectProduct(info.Code);
        }
    }
    render() {
        const {code} = this.props;
        const {productList, lineHide} = this.state;
        var self = this;
        const marketList = SpotTradeModel.getMarketList();
        var product = SpotTradeModel.getProduct(code);
        var toCode = product.Type;
        // console.log(code);
        return (

            <div className="okk-trade-klinebox">
                <ul className="kline-info-box2 pos-r tc f-clear">
                    {marketList.map((v, i)=>{
                        return <li className={toCode==v.Code?"current":""} key={i} onClick={(e)=>this.changeType(v.Code, e)}><span>{v.Name+Intl.lang("ProductList.100")}</span><i className="iconfont icon-xiala ml-10"></i></li>
                    })}
                </ul>
                <div className={"sub-coin"+(lineHide?" border-bt":"")}>
                    {productList.map((v, i)=>{
                        if (v.toCode==toCode) return <span className={code==v.Code?"current":""} onClick={()=>this.selectProduct(v.Code)} key={i}><i className={"iconfont icon-"+ v.fromCode}></i><span>{v.Name}</span></span>
                    })}
                </div>
                <div className="hide-kline tc"  onClick={this.hideKline.bind(self)}><i className={lineHide?"iconfont icon-show": "iconfont icon-hide"}></i> {lineHide?Intl.lang("TradeKlineBox.100"):Intl.lang("TradeKlineBox.101")}</div>
                {!lineHide && <KlineDiv className="kline-chart-contain" code={code} theme="dark"/>}
            </div>
        );
    }
}

export default TradeKlineBox;