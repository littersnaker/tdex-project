import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';
import { Link } from 'react-router';
import Net from "../net/net";
import Decimal from "../utils/decimal";
import {getCurrencySymbol} from "../utils/common";
import SpotTradeModel from "../model/spot-trade";
import {CONST} from "../public/const";
import AuthModel from "../model/auth";
import Event from "../core/event";

class SpotOrderHistory extends PureComponent{
    constructor(props) {

        super(props);

        this.isLogin = AuthModel.checkUserAuth();
        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        this.state = {
            pageSize: 5,
            page: 1,
            historyInfo: []
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.ORDER_UPDATE, this.fetchSpotHistory.bind(this), this);

        this.fetchSpotHistory();
    }

    fetchSpotHistory = () => {
        if (!this.isLogin) return;

        const {pageSize, page} = this.state;
        Net.httpRequest('spot/history', {PageSize: pageSize, Page: page}, (data)=>{
            if (data.Status === 0){
                this.setState({historyInfo: data.Data});
            }
        }, this);
    };

    render(){
        const { historyInfo } = this.state;
        const historyListTitle = ['ID',
            Intl.lang('ico.time'),
            Intl.lang('TradeHistory.103'),
            Intl.lang('TradeHistory.104'),
            Intl.lang('TradeHistory.Reality'),
            Intl.lang('TradeHistory.Completed'),
            Intl.lang('TradeHistory.Amount'),
            Intl.lang('tradeHistory.2_69')
        ];
        return (
            <div className="spot-trading-history-config">
                <ul className="spot-trading-tab-config no-hover">
                    <li>{Intl.lang('HistoryLog.Transaction.history')}</li>
                </ul>
                <div className="spot-trading-history-list">
                    <ul className="list-config-title">
                        {historyListTitle && historyListTitle.map((item, index) => {
                            return <li key={index}>{item}</li>
                        })}
                    </ul>

                    {historyInfo.List && historyInfo.List.map((item, key) => {
                        var cs = getCurrencySymbol(item.Currency);
                        var rcs = getCurrencySymbol(item.Rid);
                        var code = SpotTradeModel.getOrderCode(item.Rid, item.Currency);
                        var priceInfo = SpotTradeModel.getProduct(code);
                        if (!priceInfo) return;
                        var total = Decimal.accMul(item.Reality, item.Quantity, priceInfo.PriceFixed);
                        var comm = Decimal.toFixed(item.Commission, priceInfo.PriceFixed);

                        return <ul key={key} className="list-config-content">
                            <li>{item.Id}</li>
                            <li>{(item.CreateTime).substring(0, 19)}</li>
                            <li>{priceInfo.Name}</li>
                            <li>{item.Direction==CONST.TRADE.DIRECTION.BID?<span className="spot-color-81a417">{Intl.lang("TradeForm.108")}</span>:<span className="spot-color-b50a5c">{Intl.lang("TradeForm.109")}</span>}</li>
                            <li>{Decimal.toFixed(item.Reality, priceInfo.PriceFixed)}</li>
                            <li>{Decimal.toFixed(item.Quantity, priceInfo.VolFixed)}</li>
                            <li>{cs.sb+total}</li>
                            <li>{(item.Direction==CONST.TRADE.DIRECTION.BID?rcs.sb:cs.sb)+comm}</li>
                        </ul>
                    })}

                    {(!this.isLogin || !historyInfo.Total) && <div className="no-list-data back show-5">
                        <div className="no-list-data-pic"></div>
                        <p>{Intl.lang("bank.1_27")}</p>
                    </div>}

                    {(!this.isDesktop && historyInfo.hasOwnProperty('PageCount') && historyInfo.PageCount > 1) && <p className="link-config-style">
                        <Link to={'/history'} target="_blank">{Intl.lang('common.viewMore')}<i className="iconfont icon-arrow-l"/></Link>
                    </p>}
                </div>
            </div>
        )
    }
}

export default SpotOrderHistory;
