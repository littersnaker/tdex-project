import Intl from '../intl';
import React from 'react';

// import Store from '../core/store';
// import connectToStore from '../core/connect-to-store';

import PureComponent from '../core/PureComponent'
// import $ from 'jquery';

import ExpertHeader from './ExpertHeader'
import TradeHistory from './SpotTradeHistory';
import CommOrderBook from './SpotCommOrderBook';
import CloseOrderBook from './SpotCloseOrderBook';
import TradeFullForm from './SpotTradeFullForm';
import KlineDiv from './KlineDiv';
import ErrorBoundary from "./ErrorBoundary";
// import storeTypes from '../core/storetypes';

// import TradeMgr from '../model/trade-mgr';
// import AuthModel from "../model/auth";

const $ = window.$;

//initialstate
// const TradeExpertStore = Store({
//     code:SpotTradeModel.getCurrCode(),
// }, storeTypes.TRADEEXPERT);

class SpotTradeExpert extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
        }
    }
    changeSetting(){

    }
    render() {
        const {user, uInfo, code} = this.props;

        var self = this;
        return (
            <div className="full-font unselect spot-trading-skin">
                <ErrorBoundary showError={true}><ExpertHeader user={user} uInfo={uInfo} onChange={this.changeSetting.bind(this)} code={code}/></ErrorBoundary>
                <div>
                    <KlineDiv style={{
                        position: "absolute",
                        right: "520px",
                        width: "calc(100% - 520px)",
                        height: "calc(100% - 355px)",
                        backgroundColor: "#262d33",
                        zIndex:5
                    }} code={code} theme="dark"/>
                    <div style={{"position":"absolute", "top":"51px", "right":0, "height":"calc(100% - 356px)", "width": "516px", "backgroundColor": "#272d33", zIndex:5}}>
                        <div style={{"height":"100%", "borderLeft":"1px #2d2d2d solid", "borderBottom": "1px #2d2d2d solid"}}>
                            {/*<ul className="trade-full-price-title">
                                <li><span>{Intl.lang("TradeHistory.105")}</span><span>{Intl.lang("tradeHistory.1_9")}</span><span>{Intl.lang("TradeExpert.100")}</span></li>
                                <li><span>{Intl.lang("TradeHistory.105")}</span><span>{Intl.lang("tradeHistory.1_9")}</span><span>{Intl.lang("accountSafe.1_102")}</span></li>
                            </ul>*/}
                            <div className="trade-full-price-box">
                                <ErrorBoundary showError={true}><CommOrderBook isExpert={true} code={code}/></ErrorBoundary>
                                <ErrorBoundary showError={true}><CloseOrderBook isExpert={true} code={code} className="trade-order-detail trade-order-detail-config r0"/></ErrorBoundary>
                            </div>
                        </div>
                    </div>
                    <div style={{"position":"absolute", "top":"51px", "right":0, "bottom":0, "width": "100%", "backgroundColor": "#000"}}>
                        <ErrorBoundary showError={true}><TradeHistory isExpert={true} code={code} user={user} uInfo={uInfo}/></ErrorBoundary>
                        <ErrorBoundary showError={true}><TradeFullForm code={code}/></ErrorBoundary>
                    </div>
                </div>
            </div>
        );
    }
}

// export default connectToStore(TradeExpertStore)();
export default SpotTradeExpert;
