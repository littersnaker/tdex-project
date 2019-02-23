import React from 'react';
// import ScrollArea from 'react-scrollbar';

import PureComponent from "../core/PureComponent"

import SpotTradeModel from "../model/spot-trade";
import Event from '../core/event';
import moment from 'moment';
import Decimal from '../utils/decimal';
import {CONST} from "../public/const"
import {getCurrencySymbol} from "../utils/common";

const $ = window.$;
class CloseOrderBook extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            trade: this.props.code ? SpotTradeModel.getTradeInfo(this.props.code) : null,
            showCount: 45
        };
    }
    componentWillReceiveProps(nextProps){
        var code = nextProps.code;
        if (code!=this.props.code){
            this.setState({trade:SpotTradeModel.getTradeInfo(code)||[]})
        }
    }
    componentWillMount(){
        Event.addListener(Event.EventName.TRADE_UPDATE, this.onUpdateProductTrade.bind(this), this);

        this.onUpdateProductTrade(SpotTradeModel.getTradeMap());
    }
    componentDidMount() {
        this.changeShowCount();

        $(window).on('resize', this.onWindowResize);
    }

    componentWillUnmount() {
        $(window).off('resize', this.onWindowResize);

        super.componentWillUnmount();
    }

    onWindowResize = () => {
        this.changeShowCount();
    };

    changeShowCount(){
        if (this.divRef){
            var allHeight = this.divRef.clientHeight;
            var priceHeight = 16;
            var showCount = Math.floor(allHeight/priceHeight);
            if (this.state.showCount!=showCount){
                this.setState({showCount});
            }
        }
    }

    onUpdateProductTrade(data){
        if (data[this.props.code]){
            this.setState({trade:data[this.props.code]});
        }else{
            this.setState({trade:null});
        }
    }
    selectPrice(event, direction, price){
        event.preventDefault();

        // Event.dispatch(Event.EventName.PRICE_SELECT, {Direction:direction, Price:price});
    }
    setRef(r){
        this.divRef = r;
    }
    render() {
        const {isExpert, className, code} = this.props;
        const {trade, showCount} = this.state;
        if (code){
            var product = SpotTradeModel.getProduct(code);
            if (product){
                const {PriceFixed, VolFixed, toCode} = product;
                var cs = getCurrencySymbol(CONST.CURRENCY[toCode]);
                // const volFixed = SpotTradeModel.getVolFixed(code);
                return (
                        <div className={className} ref={this.setRef.bind(this)}>
                            <ul className="fem75 order-book">
                                {trade && trade.map((v, i)=>{
                                    if (i < showCount) return <li key={i} onClick={(e)=>this.selectPrice(e, v.Side, v.LastPrice)}>
                                        <span className={v.Side==CONST.TRADE.DIRECTION.BID?"hotpink1":"green5"}>{cs.sb+Decimal.formatAmount(v.LastPrice, PriceFixed)}</span>
                                        <span>{Decimal.formatAmount(v.Volume, VolFixed)}</span>
                                        <span>{moment(Number(v.Time)).format('HH:mm:ss')}</span></li>
                                })}
                            </ul>
                        </div>
                );
            }
        }
        return (
            <div className={className}>
                <ul className="fem75 order-book">
                </ul>
            </div>
        )

    }
}

export default CloseOrderBook;
