import React from 'react';
import FutTradeModel from "../model/fut-trade";
import Intl from "../intl";
import Decimal from "../utils/decimal";
import {CONST} from "../public/const";
import moment from "moment/moment";
import AuthModel from "../model/auth";
import SysTime from "../model/system";
import Event from "../core/event";
import {isEmptyObject} from "../utils/util";
import PureComponent from "../core/PureComponent";
import FutSettingMenu from "./FuturesSettingMenu"
import ToolTip from "./ToolTip";

export default class FutCloseOrderBook extends PureComponent {
    constructor(props) {
        super(props);

        this.preferenceKey = 'fclob';
        this.state = this.initState(this.props);
    }
    componentWillMount(){
        Event.addListener(Event.EventName.TRADE_UPDATE, this.onUpdateProductTrade.bind(this), this);
        Event.addListener(Event.EventName.SETTING_UPDATE, this.onUpdateSetting.bind(this), this);

        this.onUpdateProductTrade(FutTradeModel.getTradeMap());
    }

    initState(props){
        var product = props.product;
        if (product){
            return {
                trade: FutTradeModel.getTradeInfo(product.Code),
                tradeCount: FutTradeModel.loadSetting("tradeCount"),
                expanded: AuthModel.loadPreference(this.preferenceKey, false)
            }
        }
        return {
            trade: [],
            tradeCount: 0,
            expanded: false
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.product && this.props.product!=nextProps.product){
            var state = this.initState(nextProps);
            this.setState(state);
        }
    }

    onUpdateProductTrade(data){
        if (this.props.product && data[this.props.product.Code]){
            this.setState({trade:data[this.props.product.Code]});
        }else{
            this.setState({trade:[]});
        }
    }
    onUpdateSetting(data){
        var state = {};
        ["tradeCount"].forEach((v, i)=>{
            if (data.hasOwnProperty(v)){
                state[v] = data[v];
            }
        });
        if (!isEmptyObject(state)) this.setState(state);
    }
    selectPrice(event, direction, price){
        event.preventDefault();
    }
    // getStyle(expanded){
    //     return expanded ? {height:"calc(100% - 39px)", transition:"height 300ms"} : {height:0, transition:"height 300ms"}
    // }
    toggle(show, val) {
        if(this.state.expanded === val){
            return false;
        }
        var expanded = show ? val : !this.state.expanded;
        this.setState({expanded});

        AuthModel.savePreference(this.preferenceKey, expanded);
    }

    componentDidUpdate(props) {
        if(!props.open && props.expandKey===this.preferenceKey && !this.state.expanded){
            this.props.onChange('reset', false);
            this.toggle("show", true);
        }
    }
    openNewPanel(event){
        event.preventDefault();

        this.props.onChange("open", [this.props.ind, "FutCloseOrderBook"]);
        this.toggle('show', false);
    }
    closeNewOpen(event){
        event.preventDefault();
        this.props.onChange("close", [this.preferenceKey]);
    }
    render() {
        const {ind, isExpert, product, open, notip, className} = this.props;
        const {trade, expanded, tradeCount} = this.state;
        const showNum = Number(tradeCount);
        var PriceFixed, VolFixed;
        if (product) {
            PriceFixed = product.PriceFixed;
            VolFixed = product.PriceFixed;
        }
        // const volFixed = SpotTradeModel.getVolFixed(code);
        return (
            <div ref="orderDeep" className={className}>
                {open ?
                    <div className="dialog-head tc lh-25">
                        <span className="handle"></span>
                        <h3 className="ft-dialog-head fem875 tb"><span>{Intl.lang("Trade.100")}</span></h3>
                        <i className="iconfont icon-close transit fs14" onClick={(e)=>{this.closeNewOpen(e)}}></i>
                    </div>
                    :
                    <div className="mt-10 ft-new-deal flex-box flex-jc" onDoubleClick={(e)=>{this.openNewPanel(e)}}>{!notip&& <ToolTip title={Intl.lang("trade.drag.dragbarTip")}><span className="handle"></span></ToolTip>}
                        <span>{Intl.lang("Trade.100")}</span>
                        <div>
                            {product && <FutSettingMenu name="trade" side={!expanded && ind==3 ? 'top' : 'bottom'}/>}
                            <i className={expanded ? "iconfont icon-hide fs12": "iconfont icon-show fs12"} onClick={()=>this.toggle()}></i>
                        </div>
                    </div>}
                <div className="ft-order-deep">
                    {(expanded || open) && <table className="table-new-deal mt-5" cellPadding="0" cellSpacing="0">
                        <thead>
                        <tr className="tc">
                            <th>{Intl.lang("TradeHistory.105")}</th>
                            <th>{Intl.lang("futures.hist_title.u")}</th>
                            <th>{Intl.lang("accountSafe.1_102")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {trade ? trade.map((v, i)=>{
                            var side = Number(v.Side);
                            if (i < showNum) return <tr key={i} onClick={(e)=>this.selectPrice(e, side, v.LastPrice)}><td className={side==CONST.FUT.Side.BUY?"buy":"sell"}>{Decimal.formatAmount(v.LastPrice, PriceFixed)}</td><td>{Decimal.formatAmount(v.Volume, VolFixed)}</td><td className="c-8">{moment(Number(v.Time)).utcOffset(SysTime.svrTzMin).format('HH:mm:ss')}</td></tr>
                        }) : <tr><td>--</td><td>--</td><td>--</td></tr>}
                        </tbody>
                    </table>}
                </div>
            </div>
        );
    }
}
