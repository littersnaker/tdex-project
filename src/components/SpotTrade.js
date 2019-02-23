import React from 'react';
import PureComponent from "../core/PureComponent";
import ErrorBoundary from "./ErrorBoundary";

// import Intl from '../intl';
// import TradeMgr from "../model/trade-mgr";
// import Event from "../core/event";
// import WsMgr from "../net/WsMgr";
// import Decimal from "../utils/decimal";
// import { CONST } from "../public/const";
// import { getCurrencySymbol } from "../utils/common";


import TradeSimpleForm from './SpotTradeSimpleForm';
import CommOrderBook from './SpotCommOrderBook';
import SpotTradeHistory from './SpotTradeHistory';
import SpotOrderHistory from './SpotOrderHistory';
import Header from './Header'
import Footer from './Footer';
import ExpertHeader from './ExpertHeader'

class SpotTrade extends PureComponent {
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        this.state = {
        }
    }

    componentWillMount() {

    }

    render(){
        const {user, uInfo, code} = this.props;

        return(
            <React.Fragment>
                <ErrorBoundary showError={true}>{!this.isDesktop ? <Header user={user} uInfo={uInfo} code={code} isExpert={true}/> : <ExpertHeader user={user} uInfo={uInfo} code={code} isExpert={true}/> }</ErrorBoundary>

                <div className="spot-trading-style" style={this.isDesktop ? {paddingTop:"0px"}:{}}>
                    <div className="spot-trading-config" style={this.isDesktop ? {margin:"0px auto 0px"}:{}}>
                        <div className="trading-order-style-config">
                            {/*<!--订单-->*/}
                            <ErrorBoundary showError={true}><TradeSimpleForm code={code} /></ErrorBoundary>

                            {/* <!--深度-->*/}
                            <ErrorBoundary showError={true}><CommOrderBook isExpert={true} code={code} isSimple={true} /></ErrorBoundary>
                        </div>
                        {/*<!--历史记录-->*/}
                        <ErrorBoundary showError={true}><SpotTradeHistory isSimple={true} isExpert={true} code={code} user={user} uInfo={uInfo}/></ErrorBoundary>

                        <ErrorBoundary showError={true}><SpotOrderHistory user={user} uInfo={uInfo} /></ErrorBoundary>
                    </div>
                </div>

                {!this.isDesktop && <Footer />}
            </React.Fragment>
        )
    }
}

export default SpotTrade;
