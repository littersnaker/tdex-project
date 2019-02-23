import React from 'react';
import PureComponent from '../core/PureComponent';
import CFDSearchProducts from './CFDSearchProducts';
import PopDialog from "../utils/popDialog"
import CFDNewOrderForm from './CFDNewOrderForm';
import Intl from '../intl';
import Event from "../core/event";
import CfdTradeModel from '../model/cfd-trade';
import Notification from "../utils/notification";
import AuthModel from "../model/auth";

export default class CFDRightPanel extends PureComponent{
    constructor(props){
        super(props);

        this.state = {

        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.MARGIN_CURRENCY_UPDATE, this.onMarginCurrencyUpdate.bind(this), this);
    }

    onMarginCurrencyUpdate(){
        this.forceUpdate();
    }

    openNewOrder(code, currency, isSupport, e){
        e.stopPropagation();

        if (!AuthModel.checkAuthAndRedirect(window.location.pathname)) return;

        var product = CfdTradeModel.getProduct(code);
        if (!isSupport){
            Notification.error(Intl.lang("trade.openError.currency", product.DisplayName, CfdTradeModel.getCurrencySymbol(currency)));
            return;
        }

        PopDialog.open(<CFDNewOrderForm code={code}/>, "", false, (obj)=>{return {top:Math.min(90, obj.top), left:obj.left}}, true);
    }

    render(){
        const {layoutName, height, code, isMobile} = this.props;

        if (!isMobile){
            var style = {}, floatPriceStyle = {top:"50px", right:"411px"};
            var lName = layoutName();
            // if (lName!='KlineDiv'){
            //     // style = {marginLeft:'10px'}
            //     floatPriceStyle = {top:"50px", left:"411px"};
            // }
            var currency = CfdTradeModel.getCurrency();
            var isSupport = CfdTradeModel.checkSupportCurrency(code, currency);
        }

        return <React.Fragment>
            {!isMobile ?
                <div className="trading-exchange-depth" style={{marginLeft:'10px'}}>
                    <CFDSearchProducts style={style} height={height-60} code={code} />

                    <div className={"trading-exchange-btn"+(isSupport?"":" disable")} onClick={this.openNewOrder.bind(this, code, currency, isSupport)} style={lName!='KlineDiv'?{marginLeft:"-10px"}:{}}>
                        {Intl.lang("contract.online.text9")}
                    </div>
                    {/*<ul className="trading-exchange-business-order" style={Object.assign({transform:"translate(0, 0)"}, floatPriceStyle)}>*/}
                        {/*<li className="sell">*/}
                            {/*<p>3860</p>*/}
                            {/*<p>卖空</p>*/}
                        {/*</li>*/}
                        {/*<li className="buy">*/}
                            {/*<p>3860</p>*/}
                            {/*<p>买多</p>*/}
                        {/*</li>*/}
                    {/*</ul>*/}
                </div>
                    :
                <div className="trading-exchange-depth" style={{padding:0}}>
                    <CFDNewOrderForm code={code} isMobile={isMobile}/>
                </div>}
            </React.Fragment>
    }
}
