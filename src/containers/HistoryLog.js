import Intl from '../intl';
import React from 'react';
import history from '../core/history';
import PureComponent from '../core/PureComponent';
import Net from '../net/net';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {CONST} from '../public/const';
import Decimal from '../utils/decimal';
import {getCurrencySymbol, toast} from '../utils/common';
import Pager from '../components/Pager'
import SpotTradeModel from '../model/spot-trade';
import FutTradeModel from '../model/fut-trade';
import {IS_TRADE_V2} from '../config';
import DownloadCsv from '../components/DownloadCsv'
import Event from '../core/event';
import CrumbsLink from '../components/CrumbsLink';
import Product from "../model/product";

export default class HistoryLog extends PureComponent{

    constructor(props) {
        super(props);

        var tab = this.props.location.query && this.props.location.query.t ? this.props.location.query.t : "1";
        this.state = {
            tab,
            dateType: 4,
            startDate: null,
            endDate: null,
            historys: {List: [], PageSize: 50},
            pHistorys: {List: [], PageSize: 50},

            ScreeningType: false
        }
    }

    componentWillMount(){
        const { tab } = this.state;
        this.turnPage(tab, 1);

        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLang.bind(this), this);
    }

    onChangeLang(){
        if (this.state.tab == "2"){
            this.loadPositionHistory(this.state.pHistorys.Page);
        }
    }

    turnPage(tab, page) {
        switch (tab) {
            case '1':
                this.loadHistory(page);
                break;
            case '2':
                this.loadPositionHistory(page);
                break;
        }
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.location.query.t!=this.props.location.query.t){
            this.onChangeTab(nextProps.location.query.t);
        }
    }

    compareDateResult(params={}){
        const {startDate, endDate} = this.state;

        if(startDate || endDate){
            if(!startDate || !endDate){
                toast(Intl.lang("error.date"), true);
                params.isError = true;
            }else{
                params.BeginTime = startDate.format("YYYY-MM-DD");
                params.EndTime = endDate.format("YYYY-MM-DD");
            }
        }
        return params;
    }

    loadPositionHistory(page) {
        if (page < 1) return;
        if (this.state.pHistorys && this.state.pHistorys.PageCount) {
            if (page > this.state.pHistorys.PageCount) {
                page = this.state.pHistorys.PageCount;
            }
        }

        let params = this.compareDateResult();
        if(params.isError) return false;

        FutTradeModel.loadPositionHistory(page, this.state.pHistorys.PageSize, [params.BeginTime, params.EndTime, this.state.ScreeningType], this, (data) => {
            this.setState({pHistorys: data})
        });
    }

    loadHistory(page){
        if (page < 1) return;

        if (this.state.historys && this.state.historys.PageCount){
            if (page > this.state.historys.PageCount){
                page = this.state.historys.PageCount;
            }
        }

        let params = {Page:parseInt(page), PageSize: this.state.historys.PageSize, ScreeningType: this.state.ScreeningType};
        params = this.compareDateResult(params);
        if(params.isError) return false;

        Net.httpRequest("spot/history", params, (data)=>{
            if (data.Status == 0){
                this.setState({historys: data.Data})
            }
        }, this);
    }

    endDateChange(date) {
        this.setState({endDate: date, dateType: 0});
    }

    startDateChange(date) {
        this.setState({startDate: date, dateType: 0});
    }

    changeDateType(type) {
        switch (type) {
            case 1:
                this.setState({startDate: moment().subtract(24, 'hours'), endDate: moment(), dateType: type, ScreeningType: true}, () => {
                    this.handleSubmit();
                });
                break;
            case 2:
                this.setState({startDate: moment().subtract(7, 'days'), endDate: moment(), dateType: type, ScreeningType: true}, () => {
                    this.handleSubmit();
                });
                break;
            case 3:
                this.setState({startDate: moment().subtract(1, 'month'), endDate: moment(), dateType: type, ScreeningType: true}, () => {
                    this.handleSubmit();
                });
                break;
            case 4:
                this.setState({startDate: null, endDate: null, dateType: type, ScreeningType: false}, () => {
                    this.handleSubmit();
                });
                break;
        }
    }

    onToggleTab(tab){
        if (this.state.tab != tab){
            history.push(`/history?t=${tab}`)
        }
    }

    onChangeTab(tab){
        tab = tab || "1";
        this.setState({tab, startDate: null, endDate: null}, ()=>{
            this.turnPage(tab, 1);
        });
    }

    handleSubmit(){
        const { tab } = this.state;
        this.turnPage(tab, 1);
    }

    render(){
        var self = this;
        const {startDate, endDate, historys, dateType, tab, pHistorys} = this.state;
        const { isMobile } = this.props;
        var headers = [], rows = [];
        if (tab == 1) {
            headers = [
                {id: 'Id', display: 'ID'},
                {id: 'CreateTime', display: Intl.lang("trade.history.CreatedAt_O")},
                {id: 'Code', display: Intl.lang('TradeHistory.103')},
                {id: 'Direction', display: Intl.lang('Billlog.transfer.side')},
                {id: 'Reality', display: Intl.lang('TradeHistory.Reality')},
                {id: 'Completed', display: Intl.lang('TradeHistory.Completed')},
                {id: 'Amount', display: Intl.lang('TradeHistory.Amount')},
                {id: 'Fee', display: Intl.lang('tradeHistory.2_69')}
            ];
            if (historys && historys.List && historys.List.length) rows = historys.List.map((item)=> {
                var cs = getCurrencySymbol(item.Currency);
                var rcs = getCurrencySymbol(item.Rid);
                var code = SpotTradeModel.getOrderCode(item.Rid, item.Currency);
                var priceInfo = SpotTradeModel.getProduct(code);
                if (!priceInfo) return;
                var total = Decimal.accMul(item.Reality, item.Quantity, priceInfo.PriceFixed);
                var comm = Decimal.toFixed(item.Commission, priceInfo.PriceFixed);
                return {
                    Id: item.Id,
                    CreateTime: (item.CreateTime).substring(0, 19),
                    Code: item.Rid?priceInfo.Name:'',
                    Direction: item.Direction==CONST.TRADE.DIRECTION.BID?Intl.lang("TradeForm.108"):Intl.lang("TradeForm.109"),
                    Direction2: item.Direction,
                    // PriceDesc: Number(item.Price)==0 ? Intl.lang("trade.order.Strategy00") : Decimal.toFixed(item.Price, priceInfo.PriceFixed),
                    // Volume: Decimal.toFixed(item.Quantity, priceInfo.VolFixed),
                    Completed: Decimal.toFixed(item.Quantity, priceInfo.VolFixed),
                    Reality: Decimal.toFixed(item.Reality, priceInfo.PriceFixed),
                    Amount: cs.sb+total,
                    Fee: (item.Direction==CONST.TRADE.DIRECTION.BID?rcs.sb:cs.sb)+comm,
                    // State: Intl.lang("SORDER.STATE."+item.State)
                }
            });
        }else{
            headers = [
                {id:'ID', display: Intl.lang('trade.history.ID')}, {id:'CName', display: Intl.lang("trade.history.CName"), width:'6%' },
                {id:'SideTxt', display: Intl.lang('trade.history.SideTxt'), width:'5%'}, {id:'ScaleTxt', display: Intl.lang('trade.history.ScaleTxt'), width:'5%'},
                {id:'Volume', display: Intl.lang('trade.history.Volume')}, {id:'PriceDesc', display: Intl.lang('trade.history.PriceDesc')},
                {id:'MarginTotalDesc', display: Intl.lang('trade.history.MarginTotalDesc')}, {id:'OperateDesc', display: Intl.lang('trade.history.TypeDesc_O')}, {id:'DealPrice', display:  Intl.lang('trade.history.tab5_t11')},
                {id:'ProfitDesc', display: Intl.lang('trade.history.tab5_t14'), width:'8%'},
                {id:'FundFeeDesc', display: Intl.lang('trade.history.FundFeeDesc')},
                {id:'ChargeDesc', display: Intl.lang('trade.history.ChargeFeeDesc'), width:'8%'},{id:'ChargeTD', display:Intl.lang("trade.history.tdoff")},
                {id:'CreatedAt', display: Intl.lang('trade.history.CreatedAt_O'), width:'12%'}
            ];
            var allColumnName = headers.map((v)=>v.id);
            if (pHistorys && pHistorys.List && pHistorys.List.length) rows = pHistorys.List.map((v,i)=>{
                var newInfo = {};
                allColumnName.forEach((key)=>{
                    if (key=='ChargeTD'){
                        var tdInfo = Product.getCoinInfo(CONST.CURRENCY.TD);
                        var chargeTD = Decimal.accAdd(v.Coin1Fee, v.Coin2Fee);
                        newInfo[key] = Number(chargeTD) ? Decimal.toFixed(chargeTD, tdInfo ? tdInfo.ShowDigits : 0) : '--';
                    }
                    else if(key=='ChargeDesc'){
                        var sb = getCurrencySymbol(v.Product.Currency);
                        newInfo[key] = Number(v.CoinFee) ? sb.sb+Decimal.toFixed(v.CoinFee, v.Product.ShowFixed) : '--';
                    }
                    else newInfo[key] = v[key] ? v[key] : "";
                });
                return newInfo
            });
        }
        const columnCount = headers.length;
        const dataList = [Intl.lang('Asset.108'), Intl.lang('Asset.109'), Intl.lang('Asset.110'), Intl.lang('connect.1_1')];
        return(
            isMobile ? <div className="inside-page-web">
                <div className="trading-web-part">
                    <div className="tab-data-list trading-web-part-head">
                        <div className="list-header-text list-header-tab">
                            <h3 key="t0" className={tab == "2" ? "active" : null} onClick={() => this.onToggleTab(2)}>{Intl.lang("HistoryLog.101")}</h3>
                            <h3 key="t1" className={tab == "1" ? "active" : null} onClick={() => this.onToggleTab(1)}>{Intl.lang("HistoryLog.100")}</h3>
                        </div>
                        <div className="selection-date-config">
                            <div className="selection-date-config-box">
                                <DatePicker dateFormat="YYYY-MM-DD"
                                            selected={startDate}
                                            locale="zh-gb"
                                            minDate={moment().subtract(10, 'year')}
                                            placeholderText={Intl.lang("common.startDate")}
                                            maxDate={endDate || moment()}
                                            readOnly={true}
                                            onChange={this.startDateChange.bind(this)} />
                                <p>{Intl.lang('selection.date.config')}</p>
                                <DatePicker dateFormat="YYYY-MM-DD"
                                            selected={endDate}
                                            locale="zh-gb"
                                            minDate={startDate || moment().subtract(10, 'year')}
                                            maxDate={moment()}
                                            placeholderText={Intl.lang("common.endDate")}
                                            readOnly={true}
                                            onChange={this.endDateChange.bind(this)}/>
                            </div>
                            <button onClick={this.handleSubmit.bind(self)} className="btn with-btn logBtn date-picket-box-btn">{Intl.lang("Asset.111")}</button>
                            <p className="selection-time-config-box">
                                {dataList && dataList.map((item, index) => {
                                    return <span key={index} className={dateType == Number(index + 1) ? "current" : ""} onClick={() => this.changeDateType(Number(index + 1))}>{item}</span>
                                })}
                            </p>
                        </div>
                    </div>
                </div>
                {tab == 1 ? <div className="m-list-global-config-auto">
                    {(historys.hasOwnProperty("Total") && historys.Total == 0) && <div className="no-list-data show-10 ov-w-1200">
                        <div className="no-list-data-pic"/>
                        <p>{Intl.lang("bank.1_27")}</p>
                    </div>}
                    {(historys.hasOwnProperty("Total") && historys.Total > 0) && (rows.map((v, index) => {
                        return <ul className="m-list-global-config" key={index}>
                            <li className="m-list-config-title">
                                <p>
                                    <span className={v.Direction2 == CONST.TRADE.DIRECTION.BID ? 'green' : 'red'}>{v.Direction}</span>
                                    <span className="title">{v.Code}</span>
                                </p>
                                <p>
                                    {v.CreateTime}
                                </p>
                            </li>
                            <li>
                                <span>ID：</span>
                                <span>{v.Id}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('TradeHistory.Completed')}：</span>
                                <span>{v.Completed}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('TradeHistory.103')}：</span>
                                <span>{v.Code}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('TradeHistory.Reality')}：</span>
                                <span>{v.Reality}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('TradeHistory.Amount')}：</span>
                                <span>{v.Amount}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('tradeHistory.2_69')}：</span>
                                <span>{v.Fee}</span>
                            </li>
                        </ul>
                    }))}
                    {(historys.hasOwnProperty("Total") && historys.Total > 0) && <Pager className="public-pages-config mt-20" data={historys} onChange={this.turnPage.bind(self, tab)}/>}
                </div> : <div className="m-list-global-config-auto">
                    {(pHistorys.hasOwnProperty("Total") && pHistorys.Total == 0) && <div className="no-list-data show-10  ov-w-1200">
                        <div className="no-list-data-pic"></div>
                        <p>{Intl.lang("bank.1_27")}</p>
                    </div>}
                    {(pHistorys.hasOwnProperty("Total") && pHistorys.Total > 0) && (rows.map((v, index) => {
                        return <ul className="m-list-global-config" key={index}>
                            <li className="m-list-config-title">
                                <p>
                                    <span className={v.SideTxt == '卖出' ? 'red' : 'green'}>{v.SideTxt}</span>
                                    <span className="title">{v.CName}</span>
                                </p>
                                <p>
                                    {v.CreatedAt}
                                </p>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.ID')}：</span>
                                <span>{v.ID}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.ScaleTxt')}：</span>
                                <span>{v.ScaleTxt}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.Volume')}：</span>
                                <span>{v.Volume}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.PriceDesc')}：</span>
                                <span>{v.PriceDesc}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.MarginTotalDesc')}：</span>
                                <span>{v.MarginTotalDesc}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.TypeDesc_O')}：</span>
                                <span>{v.OperateDesc}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.tab5_t11')}：</span>
                                <span>{v.DealPrice}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.tab5_t14')}：</span>
                                <span>{v.ProfitDesc}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.FundFeeDesc')}：</span>
                                <span>{v.FundFeeDesc}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.ChargeFeeDesc')}：</span>
                                <span>{v.ChargeDesc}</span>
                            </li>
                            <li>
                                <span>{Intl.lang('trade.history.tdoff')}：</span>
                                <span>{v.ChargeTD}</span>
                            </li>
                        </ul>
                    }))}
                    {(pHistorys.hasOwnProperty("Total") && pHistorys.Total > 0) && <Pager className="public-pages-config mt-20" data={pHistorys} onChange={this.turnPage.bind(self, tab)}/>}
                </div>}
            </div> : <div className="inside-page-web">
                <div className="inside-web-part">
                    <div className="tab-data-list">
                        <div className="list-header-text list-header-tab">
                            <h3 key="t0" className={tab == "2" ? "active" : null} onClick={() => this.onToggleTab(2)}>{Intl.lang("HistoryLog.101")}</h3>
                            <h3 key="t1" className={tab == "1" ? "active" : null} onClick={() => this.onToggleTab(1)}>{Intl.lang("HistoryLog.100")}</h3>
                        </div>
                        <div className="selection-date-config">
                            <React.Fragment>
                                <span className="date-picket-box">
                                <i className="iconfont icon-date pdl-5 pos-a"/>
                                <DatePicker dateFormat="YYYY-MM-DD"
                                            selected={startDate}
                                            locale="zh-gb"
                                            minDate={moment().subtract(10, 'year')}
                                            maxDate={endDate || moment()}
                                            readOnly={true}
                                            placeholderText={Intl.lang("common.startDate")}
                                            onChange={this.startDateChange.bind(this)} />
                                </span>
                                <span className="pd010">--</span>
                                <span>
                                    <span className="date-picket-box">
                                        <i className="iconfont icon-date pdl-5 pos-a"/>
                                        <DatePicker dateFormat="YYYY-MM-DD"
                                                    selected={endDate}
                                                    locale="zh-gb"
                                                    minDate={startDate || moment().subtract(10, 'year')}
                                                    maxDate={moment()}
                                                    readOnly={true}
                                                    placeholderText={Intl.lang("common.endDate")}
                                                    onChange={this.endDateChange.bind(this)}/>
                                    </span>
                                </span>
                                <span className="date-time-box">
                                    {dataList && dataList.map((item, index) => {
                                        return <span key={index} className={dateType == Number(index + 1) ? "current" : ""} onClick={() => this.changeDateType(Number(index + 1))}>{item}</span>
                                    })}
                                </span>
                                <button onClick={this.handleSubmit.bind(self)} className="btn with-btn logBtn ml-50 date-picket-box-btn">{Intl.lang("Asset.111")}</button>
                            </React.Fragment>
                            <DownloadCsv headers={headers} rows={rows} filename={(tab==1?'Spot':'Fut')+'History'+moment().format('YYYYMMDD')}>
                                <span className="download-csv-icon">{Intl.lang("Asset.112")}<i className="iconfont icon-download" /></span>
                            </DownloadCsv>
                        </div>
                        <div className="list-global-config log-list-overflow">
                            <ul className="list-config-title ov-w-1200">
                                {headers && headers.map((v, i)=>{
                                    return <li key={tab+'_'+i} style={{width: v.hasOwnProperty("width") ? v.width : (100/columnCount)+'%'}}>{v.display}</li>
                                })}
                            </ul>
                            {tab == 1 ? (<React.Fragment>
                                {(historys.hasOwnProperty("Total") && historys.Total == 0) && <div className="no-list-data show-10 ov-w-1200">
                                    <div className="no-list-data-pic"/>
                                    <p>{Intl.lang("bank.1_27")}</p>
                                </div>}
                                {(historys.hasOwnProperty("Total") && historys.Total > 0) && (rows.map((v, index) => {
                                    return <ul className="list-config-content ov-w-1200" key={index}>
                                        {headers.map((item, i) => {
                                            return <li style={{width: item.hasOwnProperty("width") ? item.width : (100 / columnCount) + '%'}} key={tab + '1_' + i}>{v[item.id]}</li>
                                        })}
                                    </ul>
                                }))}
                                {(historys.hasOwnProperty("Total") && historys.Total > 0) && <Pager className="public-pages-config mt-20" data={historys} onChange={this.turnPage.bind(self, tab)}/>}
                            </React.Fragment>) : (<React.Fragment>
                                {(pHistorys.hasOwnProperty("Total") && pHistorys.Total == 0) && <div className="no-list-data show-10  ov-w-1200">
                                    <div className="no-list-data-pic"></div>
                                    <p>{Intl.lang("bank.1_27")}</p>
                                </div>}
                                {(pHistorys.hasOwnProperty("Total") && pHistorys.Total > 0) && (rows.map((v, index) => {
                                    return <ul className="list-config-content ov-w-1200" style={{fontSize: 12}} key={index}>
                                        {headers.map((item, i) => {
                                            return <li style={{width: item.hasOwnProperty("width") ? item.width : (100 / columnCount) + '%'}} key={tab + '2_' + i}>{v[item.id]}</li>
                                        })}
                                    </ul>
                                }))}
                                {(pHistorys.hasOwnProperty("Total") && pHistorys.Total > 0) && <Pager className="public-pages-config mt-20" data={pHistorys} onChange={this.turnPage.bind(self, tab)}/>}
                            </React.Fragment>)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
