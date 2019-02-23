import Intl from '../intl';
import React from 'react';
import PureComponent from "../core/PureComponent"

import ChartModel from '../model/chart';
// import FutTradeModel from '../model/fut-trade';
import TradeMgr from '../model/trade-mgr';
import AuthModel from '../model/auth';

import PopDialog from "../utils/popDialog"
import Event from '../core/event';

import FutNewOrderComp from './FuturesNewOrder'
import {CONST} from "../public/const";

export default class KlineDiv extends PureComponent {
    constructor(props) {
        super(props);

        this.isMobile = window.isMobile;

        this.mounted = true;

        this.klineChartType = 'klineType';
        this.klineTypeKey = 'klType';
        this.klineModeKey = 'klMode';
        this.typeArr = ['1MIN', '3MIN', '5MIN', '15MIN', '30MIN', '1HOUR', '2HOUR', '3HOUR', '4HOUR', '6HOUR', '12HOUR', '1DAY', '3DAY', '1WEEK', '2WEEK'];
        this.modeArr = ['BID', 'ASK', 'LAST'];
        this.isInitedChart = false;
        this.state = {
            type: AuthModel.loadPreference(this.klineTypeKey, this.typeArr[2]),
            mode: AuthModel.loadPreference(this.klineModeKey, this.modeArr[2]),
            chartType: AuthModel.loadPreference(this.klineChartType, 1),
            // expanded: AuthModel.loadPreference(this.preferenceKey, true),
            // componentMap: AuthModel.loadPreference('FtTradeComponent') || [1,2,3,4],
            // heightMap: [{h:387},{h:310},{h:81},{h:243}],
            // expandKey: '',
            // tradingType: '',
            // isNewOrder: false,
        }
    }

    componentDidMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);

        this.lang = Intl.getChartLang();
        this.onProductUpdate();
    }

    onProductUpdate(){
        if (!this.isInitedChart){
            this.initChartModel(this.props);
        }
    }

    // 捕获图表库请求交易
    onElementEvent(evt) {
        if (!evt.data.eventType) return;
        switch (evt.data.eventType) {
            case 'Purchase':
                this.showTradePanel('buy', evt.data.value);
                break;
            case 'SellOut':
                this.showTradePanel('sell', evt.data.value);
                break;
        }
    }
    // 创建图表上下文菜单
    createContextMenu(widget) {
        // const code = this.props.code;
        if (this.props.entry==CONST.TRADE_TYPE.FUT) {
            widget.onChartReady(() => { if (widget._innerAPI())widget._innerAPI().showTraderContextMenu(true)})
        } else {
            widget.onChartReady(() => { if (widget._innerAPI())widget._innerAPI().showTraderContextMenu(false)})
        }
    }
    // 创建交易菜单  /** 不支持二级菜单 暂时放弃 */
    // createTraderMenu(unixtime, price) {
    //     return [
    //         {
    //             position: 'top',
    //             text: 'First top menu',
    //             child: [
    //                 {position: 'top',
    //             text: 'First top menu',}
    //             ]
    //         }
    //     ]
    // }
    componentDidUpdate() {
        var lang = Intl.getChartLang();
        if (this.lang != lang) {
            ChartModel.setLanguage(lang);
            this.lang = lang;
        }
    }

    initChartModel(props) {
        if (props.code){
            var product = TradeMgr.getProduct(props.code, props.entry);
            if (product){
                var symbol = ChartModel.getFullSymbol(props.entry, props.code);
                ChartModel.init(symbol, props.entry==CONST.TRADE_TYPE.FUT ? this.state.mode : 'LAST', this.state.type, this.state.chartType, this.props.theme || "", this.onChartSwitch.bind(this), this);
                this.isInitedChart = true;
                if(!this.isMobile){
                    window.addEventListener('message',this.onElementEvent.bind(this));
                    ChartModel.createContextMenu().then(widget => this.createContextMenu(widget));
                    Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
                    // this.onUpdatePrice(FutTradeModel.getPrices());
                }
            }
        }
    }
    onChartSwitch(symbol, period, mode, chartType) {
        var state = {};
        if (period) {
            state.type = period;
            AuthModel.savePreference(this.klineTypeKey, period);
        }
        if (mode){
            state.mode = mode;
            AuthModel.savePreference(this.klineModeKey, mode);
        }
        if (chartType){
            state.chartType = chartType;
            AuthModel.savePreference(this.klineChartType, chartType);
        }
        if (this.mounted) this.setState(state);
    }
    componentWillUnmount() {
        this.mounted = false;
        this.isInitedChart = false;
        PopDialog.closeAll();
        ChartModel.destroy();
        window.removeEventListener('message', this.onElementEvent);

        super.componentWillUnmount();
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.entry!=nextProps.entry || this.props.code != nextProps.code) {
            if (!this.props.code){
                this.initChartModel(nextProps);
            }else{
                var symbol = ChartModel.getFullSymbol(nextProps.entry, nextProps.code);
                if (nextProps.entry==CONST.TRADE_TYPE.FUT) ChartModel.switchMode(symbol, this.state.mode);
                ChartModel.switch(symbol, this.state.type);
            }
        }
        if (this.props.theme != nextProps.theme) {
            ChartModel.setTheme(nextProps.theme);
        }
    }
    changeType = (type) => {
        if (this.state.type != type) {
            this.setState({ type: type });

            ////1MIN, 5MIN, 15MIN, 30MIN, 60MIN, DAY, WEEK
            var symbol = ChartModel.getFullSymbol(this.props.entry, this.props.code);
            ChartModel.switch(symbol, type);
        }
    };
    changeLegend(name) {
        ChartModel.changeLegend(name);
    }
    onChangeMode(e) {
        e.preventDefault();
        e.stopPropagation();

        var mode = e.target.value;
        if (this.state.mode != mode) {
            this.setState({ mode: mode });

            var symbol = ChartModel.getFullSymbol(this.props.entry, this.props.code);
            ChartModel.switchMode(symbol, mode);
        }
    }
    onUpdatePrice(data) {
        var code = this.props.code;
        //关闭浮动交易工具栏
        if (code && this.props.entry==CONST.TRADE_TYPE.FUT && data[code]) {
            ChartModel.setFloatTradeData(data[code]);
        }
    }
    // 显示交易面板
    showTradePanel(type, value) {
        PopDialog.closeByDomID('order_new');

        var code = this.props.code;

        if (this.props.entry==CONST.TRADE_TYPE.FUT) {
            var products = FutTradeModel.getProduct(code);
            const product = products && products.length ? products[0] : {};

            var skin = FutTradeModel.getSkin();
            PopDialog.open(<section className={"ft-trade-panel shadow-w futures-bg-" + skin} id="order_new" style={{ width: 320 }}>
                <header className="dialog-head tc lh-25">
                    <h3 className="ft-dialog-head fem875 tb">
                        <span></span> <span></span></h3>
                    <i className="iconfont icon-close transit fem875" onClick={e => this.hiddenTradePanel(e)}></i>
                </header>
                <div className="ft-order-box pd010 fem75 pdb-10 border-none">
                    <FutNewOrderComp className="ft-order-market pdt-1" product={product} isExpert={true} expandKey={""} onChange={(key, param) => { this.dragEndChange(key, param) }} tradingType={type} showFloatToolbar={() => this.hiddenTradePanel()}></FutNewOrderComp>
                </div>
            </section>, "order_new", false);
        }
    }

    // 隐藏交易面板
    hiddenTradePanel() {
        PopDialog.closeByDomID('order_new');
    }

    render() {
        const { className, style, code, entry } = this.props;
        const { mode } = this.state;
        const isSpecial = entry==CONST.TRADE_TYPE.FUT || entry==CONST.TRADE_TYPE.CFG;

        return <div className={isSpecial ? "wp-100 pos-r" : "KlineDiv"} style={isSpecial ? { height: "100%" } : style}>
            {/*isFut && <div className="pos-a border-none tv-code-box" style={{ right: "5px", top: "6px" }}>
                <select onChange={this.onChangeMode.bind(this)} value={mode}>
                    {this.modeArr.map((v, i) => {
                        return <option value={v} key={i}>{v}</option>
                    })}
                </select>
            </div>*/}
            <div id="tv_chart_container" className={className} style={isSpecial ? style : { height: "100%" }}></div>
            <div className="pos-a hide" style={{ width: "100%", height: "100%", backgroundColor: "#fff", opacity: "0", top: "0px", left: "0px" }} id="klineMask"></div>
        </div>
    }
}
