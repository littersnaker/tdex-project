import Intl from '../intl';
import React from 'react';

import PureComponent from '../core/PureComponent'

import TradeHistory from './SpotTradeHistory';
import CommOrderBook from './SpotCommOrderBook';
import CloseOrderBook from './SpotCloseOrderBook';
import TradeFullForm from './SpotTradeFullForm';
import KlineDiv from './KlineDiv';
import ErrorBoundary from "./ErrorBoundary";

class SpotTradeMobile extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {}
    }
    componentWillMount() {

    }
    getShowBockConfig() {
        const { VerticalScreen, showKline, showMenu, showResolution, showNewOrder, showLog, showProduct } = this.state;

        let Config = {};
        if (!this.isFut) {
            Config.showChart = true;
            Config.showResolution = true;
            if (showKline) {
                Config.showKline = true;
            }

            Config.BlockMap = ['header', 'product', 'chart', 'resolution', 'kline'];
            return Config;
        }
        return Config;
    }
    render(){

        return(
            <div className="full-font unselect spot-trading-skin">
                <KlineDiv style={{ backgroundColor: "#262d33", zIndex:5}} code={code} theme="dark"/>
            </div>
        )
    }

}


export default SpotTradeMobile;