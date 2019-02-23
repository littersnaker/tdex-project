import React from 'react';
import PureComponent from "../core/PureComponent";
import TradeMgr from "../model/trade-mgr";
import Event from "../core/event";
import Decimal from "../utils/decimal";
import { CONST } from "../public/const";
import { getCurrencySymbol } from "../utils/common";
import Echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import WsMgr from "../net/WsMgr";
import Intl from '../intl';
import {FutProduct} from "../model/product";
import {isMobile} from "../utils/util";

const chartKlineStyle = {
    width: '540px',
    height: '145px',
    position: 'absolute',
    left: '-30px',
    top: '-14px'
}
const mobileChartKlineStyle = {
    width: '200px',
    height: '95px',
    position: 'absolute',
    left: '0px',
    top: '0px'
}

class TradingKline extends PureComponent {
    constructor(props) {
        super(props);
        this.isMobile = isMobile();
        this.isSub = false;
        this.period = '1DAY',
            this.productList = TradeMgr.getProductList();
        this.dataMap = {};

        this.onUpdateKlineData = this.onUpdateKlineData.bind(this);
        this.subscribe = this.subscribe.bind(this);

        this.charts = {};

        this.state = {
            productList: this.productList,
        }
    }

    componentWillMount() {
        WsMgr.on('kline', this.onUpdateKlineData);

        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onUpdatePrice.bind(this), this);
    }

    componentDidMount() {
        this.checkAndSub();
    }

    componentWillUnmount() {
        this.isSub = false;

        WsMgr.off('open', this.subscribe);
        WsMgr.off('kline', this.onUpdateKlineData);
        WsMgr.unsubAllKline();

        super.componentWillUnmount();
    }

    checkAndSub() {
        if (!this.isSub) {
            if (this.productList.length) {
                var codes = [];
                this.productList.forEach((v) => {
                    var info = v[0] ? v[0] : v;
                    if (info) {
                        if (info.Closed && info.Closed == "1") return;

                        if (info.Type==7){
                            var code = info.Code;
                            codes.push(info.Code);

                            //初始化图
                            this.charts[code] = this.initChart(document.getElementById('chart' + code), [], 'rgba(246, 238, 243, 0.5)', 'rgba(253, 231, 246, 1)')
                        }
                    }
                });
                if (codes.length) {
                    this.codes = codes;
                    WsMgr.on('open', this.subscribe);
                    this.subscribe();
                    this.isSub = true;
                }
            }
        }
    }

    subscribe() {
        if (WsMgr.isOpen()) {
            WsMgr.subscribeAllKline(this.codes, this.period, 10);
        }
    }

    onUpdateKlineData(data) {
        // console.log(data);

        var symbol = data.symbol;
        var period = data.period;
        if (this.codes.indexOf(symbol) != -1 && period == this.period) {
            var list = data.data;
            var barList = this.dataMap[symbol];
            var oldLastBar;
            if (!barList) {
                this.dataMap[symbol] = barList = [];
            } else {
                oldLastBar = barList[barList.length - 1];
            }

            for (var i = 0, l = list.length; i < l; i++) {
                var info = list[i];
                if (info) {
                    var v = info.split(",");
                    var newInfo;
                    if (v) newInfo = { time: v[0], value: Number(v[5]) };
                    if (newInfo) {
                        if (oldLastBar) {
                            if (oldLastBar.time < newInfo.time) {
                                barList.push(newInfo);
                            } else if (oldLastBar.time == newInfo.time) {
                                Object.assign(oldLastBar, newInfo);
                            } else {
                                break;
                            }
                        } else {
                            barList.push(newInfo);
                        }
                    }
                }
            }
            this.dataMap[symbol] = barList;

            var chart = this.charts[symbol];
            if (chart) {
                const dateList = barList.map(item => item.time)
                const valueList = barList.map(item => item.value)

                var index = 0;
                var v = TradeMgr.getProduct(symbol);
                if (v) {
                    var info = v[0] ? v[0] : v;
                    if (info && info.price && info.price.change) {
                        index = info.price.change >= 0 ? 0 : 1;
                    }
                }

                chart.setOption({
                    xAxis: [{
                        data: dateList
                    }],
                    yAxis: [{
                        min: Math.min.apply(null, valueList),
                        max: Math.max.apply(null, valueList)
                    }],
                    series: [{
                        data: valueList,
                        lineStyle: { normal: { color: index % 2 ? 'rgba(246, 238, 243, 0.5)' : 'rgba(240, 246, 244, 0.5)' } },
                        areaStyle: {
                            color: {
                                colorStops: [
                                    { offset: 0, color: index % 2 ? 'rgba(253, 231, 246, 1)' : 'rgba(207, 253, 235, 1)' },
                                    { offset: 1, color: '#fff' },
                                    { offset: 0, color: index % 2 ? 'rgba(253, 231, 246, 1)' : 'rgba(207, 253, 235, 1)' },
                                    { offset: 1, color: '#fff' }
                                ]
                            }
                        }
                    }]
                })
            }

        }
    }

    // 初始化图表
    initChart(elm, data, borderColor, backgroundColor) {
        if (!elm) return
        const defaultAxis = { show: false }
        const chart = Echarts.init(elm)
        const dateList = data.map(item => item.time)
        const valueList = data.map(item => item.value)
        const option = {
            grid: [{
                left: 0,
                top: '10%',
                right: 0,
                bottom: 0
            }],
            xAxis: [{
                data: dateList,
                axisTick: defaultAxis,
                axisLine: defaultAxis,
                splitLine: defaultAxis,
                axisLabel: defaultAxis
            }],
            yAxis: [{
                axisTick: defaultAxis,
                axisLine: defaultAxis,
                splitLine: defaultAxis,
                axisLabel: defaultAxis
            }],
            series: [{
                type: 'line',
                showSymbol: false,
                data: valueList,
                lineStyle: {
                    normal: { color: borderColor }
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: backgroundColor },
                            { offset: 1, color: '#fff' },
                            { offset: 0, color: backgroundColor },
                            { offset: 1, color: '#fff' }
                        ]
                    }
                }
            }]
        }
        chart.setOption(option)
        return chart
    }

    onUpdatePrice() {
        this.productList = TradeMgr.getProductList();
        var data = { productList: this.productList };

        this.setState(data);

        this.checkAndSub();
    }
    selectProduct(product){
        TradeMgr.btnSelectProduct(product);
    }

    render() {
        const { productList } = this.state;

        var remain = 2 - productList.length;
        remain = remain>0 ? remain : 0;
        return (
            <div className="trading-kline">
                <div>
                    {productList.map((v, i) => {
                        var info = v[0] ? v[0] : v;
                        if (info.Closed && info.Closed == "1") return;

                        var code = info.Code;
                        var displayName = info && info.Name ? info.Name : '';

                        var price = info.price;
                        var last = price && price.LAST ? price.LAST : 0;
                        var VOL_24h = price && price.hasOwnProperty("VOL_24h") ? price.VOL_24h : 0;

                        var RANGE = price && price.hasOwnProperty("chg") ? price.chg : '';
                        var RangeNum = Number(RANGE);

                        var toCode = info.toCode;
                        var cs = getCurrencySymbol(CONST.CURRENCY[toCode]);

                        var cnyPrice;
                        var cnycs = getCurrencySymbol(CONST.CURRENCY.CNY);
                        if (last) cnyPrice = TradeMgr.calcCurrencyCodeToCny(toCode, last);

                        return <div className="trading-kline-setion" key={"prod" + info.Code} onClick={()=>this.selectProduct(info)} style={{ overflow: 'hidden' }}>
                            <div style={this.isMobile ? mobileChartKlineStyle : chartKlineStyle} id={'chart' + code}></div>
                            <div className="kline-item" style={{ margin: 0 }}>
                                <div className={"kline-cur kline-" + info.fromCode}></div>
                                {info.fromCode=="TD" ?
                                <div className="kline-cur-data">
                                    <p className="data-title-flex"><span className="data-title">{displayName}</span></p>
                                    <p><span>{Intl.lang("trade.open.buyPrice")+": "}</span><span>{price.BID?Decimal.formatAmount(price.BID, info.PriceFixed):'--'}</span></p>
                                    <p><span>{Intl.lang("trade.open.sellPrice")+": "}</span><span>{price.ASK?Decimal.formatAmount(price.ASK, info.PriceFixed):'--'}</span></p>
                                </div>
                                    :
                                <div className="kline-cur-data">
                                    <p className="data-title-flex"><span className="data-title">{displayName}</span><span className={"data-txt" + (last > 0 ? (RangeNum < 0 ? " red" : (RangeNum > 0 ? " green" : "")) : "")}>{last > 0 ? (RangeNum > 0 ? '+' + RANGE : RANGE) + '%' : '--'}</span></p>
                                    <p><span className="data-number">{last > 0 ? cs.sb + Decimal.formatAmount(last, info.PriceFixed) : '--'}</span><span>{cnyPrice ? cnycs.sb + String(Decimal.formatAmount(cnyPrice, 2)) : "--"}</span></p>
                                    <p><span>{Intl.lang("new.home.kline.setion.1",'24h')}</span><span>{Decimal.addCommas(VOL_24h)}</span></p>
                                </div>
                                }
                            </div>
                        </div>
                    })}

                    {remain>0 && Array.apply(null, {length:remain}).map((v, i)=>{
                        return <div className="trading-kline-setion" key={"emppty" + i} style={{ overflow: 'hidden' }}>
                            <div style={this.isMobile ? mobileChartKlineStyle : chartKlineStyle}></div>
                            <div className="kline-item" style={{ margin: 0 }}>
                                <div className="kline-cur kline-TD"></div>
                                <div className="kline-cur-data" style={{cursor:"default"}}>
                                    <p className="data-title-flex"><span className="data-title">TD/BTC</span></p>
                                    <p><span>{Intl.lang("new.home.online")}</span></p>
                                    <p><span>{Intl.lang("common.coming_soon")}</span></p>
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            </div>

        )
    }
}

export default TradingKline;
