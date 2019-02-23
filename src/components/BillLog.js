import React from 'react';
import history from "../core/history";
import DatePicker from 'react-datepicker';
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import PureComponent from '../core/PureComponent';
import Intl from "../intl";
import Net from '../net/net';
import Event from "../core/event";
import Pager from "./Pager";
import Decimal from '../utils/decimal';
import {getCurrencySymbol} from "../utils/common";
import TransferConfirm from '../components/TransferConfirm'
import {CONST} from "../public/const";
import { isMobile } from '../utils/util';
import {toast} from "../utils/common";
import AssetMenu from "./AssetMenu";

export default function BillLog(props) {
    const path = [
        {pathLink: '/asset',pathIcon: 'icon-wallet', pathName: Intl.lang('NavBar.103')},
        {pathLink: '/recharge',pathIcon: 'icon-recharge', pathName: Intl.lang('account.1_2')},
        {pathLink: '/withdrawals',pathIcon: 'icon-withdrawal', pathName: Intl.lang('account.1_3')},
        {pathLink: '/walletTransfer',pathIcon: 'icon-exchange', pathName: Intl.lang('WalletTransfer.theme')},
        {pathLink: '/transfer',pathIcon: 'icon-transfer', pathName: Intl.lang('Asset.102')},
        {pathLink: '/personal/billlog',pathIcon: 'icon-history', pathName: Intl.lang('Personal.billLog')}
    ];
    return (
        <div className="inside-page-web">
            <div className="inside-web-part">
                <AssetMenu path={path} />
                <MoreRecordTab {...props}/>
            </div>
        </div>
    )
}

class MoreRecordTab extends PureComponent {
    constructor(props) {
        super(props)

        var defaultInfo = {PageSize:10, Page:1};
        this.defaultInfo = defaultInfo;

        this.state = {
            tab: this.props.t ? this.props.t : "1",
            logInfo: defaultInfo,
            detailTab: {},
            dateType: 3,
            startDate: null,
            endDate: null,
            isMobile: isMobile()
        }
    }

    componentWillUnmount(){
        super.componentWillUnmount();
    }

    componentWillMount() {
        this.onChangeTabData(this.state.tab, 1);

        Event.addListener(Event.EventName.MSG_TRANSFER_OVER,this.refreshTransfer.bind(this), this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.t && nextProps.t!=this.state.tab){
            this.onChangeTab(nextProps.t);
        }
    }

    onChangeTabData(tab, page) {
        const { dateType } = this.state;
        tab = Number(tab);
        this._onChangeLoadData(tab, dateType, page);
    }

    onChangeTab(tab){
        if (tab !== this.state.tab) {
            this.setState({tab, logInfo: this.defaultInfo, startDate: null, endDate: null}, ()=>{
                this._onChangeLoadData(tab, this.state.dateType, 1);
            });
        }
    }

    changeListTab(tab) {
        if (tab !== this.state.tab) {
            history.push("/personal/billlog?t="+tab);
        }
    }

    refreshTransfer(){
        if (this.state.tab==7) {
            this.onChangeTabData(7, 1);
        }
    }

    _onChangeLoadData(tab, dateType, page){
        tab = Number(tab);
        switch (tab) {
            case 1:
            case 2:
            case 3:
                this.loadWalletOrders(tab, page);
                break;
            // case 4:
            //             //     this.loadFenfa(page); // ????
            //             //     break;
            //             // case 5:
            //             //     this.loadFenhong(page); // ????
            //             //     break;
            case 6:
                this.loadWalletOrders(4, page);
                break;
            case 7:
                this.loadWalletOrders(100, page);
                break;
        }
    }

    loadWalletOrders(type, page) {
        var params = {Type: type, Page: page, PageSize: this.state.logInfo.PageSize};
        const {startDate, endDate} = this.state;
        if (startDate || endDate){
            if(!startDate || !endDate) {
                toast(Intl.lang("error.date"), true);
                return;
            }
            params.BeginTime = startDate.format("YYYY-MM-DD");
            params.EndTime = endDate.format("YYYY-MM-DD");
        }

        Net.httpRequest("wallet/orders", params, (data) => {
            if (data.Status == 0) {
                this.setState({logInfo: data.Data})
            }
        }, this);
    }

    // loadFenfa(page){
    //     Net.httpRequest("wallet/orders", {Type:7, Action:7000, Page:page, PageSize:this.state.logInfo.PageSize}, (data)=>{
    //         if (data.Status == 0){
    //             this.setState({logInfo: data.Data});
    //         }
    //     }, this);
    // }
    //
    // loadFenhong(page){
    //     Net.httpRequest("wallet/bonus", {Page:page, PageSize:this.state.logInfo.PageSize}, (data)=>{
    //         if (data.Status == 0){
    //             this.setState({logInfo: data.Data});
    //         }
    //     }, this);
    // }

    turnPage(page){
        this.onChangeTabData(this.state.tab, page);
    }

    toggleDetail(tab){
        let { detailTab } = this.state;

        detailTab[tab] = !detailTab[tab];
        this.setState({detailTab:detailTab})
    }

    refreshHistory(){
        this.onChangeTabData(7, 1);
    }

    getColumns(tab){
        var map = {
            "1": [{display:Intl.lang("trade.history.CreatedAt_O")}, {display:Intl.lang("Asset.105")}, {display:Intl.lang("tradeHistory.1_9")}, {display:Intl.lang("recharge.1_23")}],
            "2": [{display:Intl.lang("trade.history.CreatedAt_O"), width:"18%"}, {display:Intl.lang("Asset.105"), width:"10%"}, {display:Intl.lang("tradeHistory.1_9"), width:"10%"}, {display:Intl.lang("Withdrawals.address"), width:"44%"}, {display:Intl.lang("recharge.1_23"), width:"18%"}, false],
            "3": [{display:Intl.lang("trade.history.CreatedAt_O")}, {display:Intl.lang("Asset.105")}, {display:Intl.lang("tradeHistory.1_9")}, {display:Intl.lang("Billlog.transfer.side")}, {display:Intl.lang("recharge.1_23")}],
            "4": [{display:Intl.lang("trade.history.CreatedAt_O")}, {display:Intl.lang("Asset.105")}, {display:Intl.lang("tradeHistory.1_9")}, {display:Intl.lang("bank.1_21")}],
            "5": [{display:Intl.lang("personal.create.2")}, {display:Intl.lang("personal.create.3")}, {display:Intl.lang("personal.create.4")}, {display:Intl.lang("personal.create.6")}, {display:Intl.lang("personal.create.8")}],
            "6": [{display:Intl.lang("trade.history.CreatedAt_O")}, {display:Intl.lang("Asset.105")}, {display:Intl.lang("tradeHistory.1_9")}, {display:Intl.lang("Personal.walletLogType")}],
            "7": [{display:Intl.lang("Personal.walletLogType")}, {display:Intl.lang("trade.history.CreatedAt_O")}, {display:Intl.lang("Asset.105")}, {display:Intl.lang("tradeHistory.1_9")}, {display:Intl.lang("recharge.1_23")}, {display:Intl.lang("accountSafe.1_99")}]
        };
        return map[tab];
    }

    parseData(tab, v, i) {
        switch (tab){
            case "1":{
                var cs = getCurrencySymbol(v.Currency);
                return <ul className="list-config-content" key={"t"+tab+i}>
                    <li>{v.CreateTime.substr(0,16)}</li>
                    <li>{cs ? cs.sn : "--"}</li>
                    <li>{Decimal.toFixed(v.Amount)}</li>
                    <li>{Intl.lang({key:"EXCHANGE.STATUS."+v.Status, def:"EXCHANGE.STATUS.3"})}</li>
                </ul>
            }
            case "2":{
                var cs = getCurrencySymbol(v.Currency);
                return <ul className="list-config-content" key={"t"+tab+i}>
                    <li style={{width:"18%"}}>{v.CreateTime.substr(0,16)}</li>
                    <li style={{width:"10%"}}>{cs ? cs.sn : "--"}</li>
                    <li style={{width:"10%"}}>{Decimal.toFixed(v.Amount)}</li>
                    <li style={{width:"44%"}}>{v.Address}</li>
                    <li style={{width:"18%"}}>{Intl.lang({key:"EXCHANGE.STATUS."+v.Status, def:"EXCHANGE.STATUS.3"})}</li>
                </ul>
            }
            case "3":{
                var cs = getCurrencySymbol(v.Currency);
                var csName = v.Currency==CONST.CURRENCY["TD-Freeze"] ? "TD ("+ Intl.lang("Asset.gift") +") " : (cs ? cs.sn : "--");
                return <ul className="list-config-content" key={"t"+tab+i}>
                    <li>{v.CreateTime.substr(0,16)}</li>
                    <li>{csName}</li>
                    <li>{Decimal.toFixed(v.Amount)}</li>
                    <li>{Intl.lang({key:"Asset.Action.type"+v.Action, def:"Personal.walletLogType9"})}</li>
                    <li>{Intl.lang({key:"EXCHANGE.STATUS."+v.Status, def:"EXCHANGE.STATUS.3"})}</li>
                </ul>
            }
            case "4":{
                var cs = getCurrencySymbol(v.Currency);
                var csName = v.Currency==CONST.CURRENCY["TD-Freeze"] ? "TD ("+ Intl.lang("Asset.gift") +") " : (cs ? cs.sn : "--");
                return <ul className="list-config-content" key={"t"+tab+i}>
                    <li>{v.CreateTime.substr(0,16)}</li>
                    <li>{csName}</li>
                    <li>{Decimal.toFixed(v.Amount)}</li>
                    <li>{Intl.lang("award.action"+v.Action)}</li>
                </ul>
            }
            case "5":{
                return <ul className="list-config-content" key={"t"+tab+i}>
                <li>{moment(v.Time*1000).format("YYYY-MM-DD HH:mm")}</li>
                    <li>{v.UserTD}</li>
                    <li>{Decimal.toPercent(Decimal.accDiv(v.UserTD, v.TotalTD), 2)}</li>
                    <li>{v.Commission}</li>
                    <li>{v.Bonus}</li>
                </ul>
            }
            case "6":{
                var cs = getCurrencySymbol(v.Currency);
                var csName = v.Currency==CONST.CURRENCY["TD-Freeze"] ? "TD ("+ Intl.lang("Asset.gift") +") " : (cs ? cs.sn : "--");
                return <ul className="list-config-content" key={"t"+tab+i}>
                    <li>{v.CreateTime.substr(0,16)}</li>
                    <li>{csName}</li>
                    <li>{Decimal.toFixed(v.Amount)}</li>
                    <li>{Intl.lang({key:"billLog.Action.type" + v.Action, def:"Personal.walletLogType9"})}</li>
                </ul>
            }
            case "7":{
                let cs = getCurrencySymbol(v.Currency);
                let target = getCurrencySymbol(v.Target);
                let isShow = this.state.detailTab[i];

                var csName = v.Currency==CONST.CURRENCY["TD-Freeze"] ? "TD ("+ Intl.lang("Asset.gift") +") " : (cs ? cs.sn : "--");
                return  <React.Fragment key={"t"+tab+i}>
                    <ul className="list-config-content">
                        <li>{Intl.lang({key:"billLog.Action.type" + v.Action, def:"Personal.walletLogType9"})}</li>
                        <li>{v.CreateTime.substr(0,16)}</li>
                        <li>{csName}</li>
                        <li>{Decimal.toFixed(v.Amount)}</li>
                        <li>
                            <TransferConfirm order={v} onChange={this.refreshHistory.bind(this)}/>
                        </li>
                        <li onClick={this.toggleDetail.bind(this, i)}>
                            {v.Type==8 ?<span className="cur-hover point">{Intl.lang("Billlog.table.detail")} <i className={"iconfont fs14 "+ (isShow?"icon-dropUp":"icon-dropDown")}></i></span>:<span>--</span>}
                        </li>
                    </ul>
                    {v.Type==8 && <ul className={"list-sub-detail "+ (!isShow?"hide":"")}>
                        <li><span></span><span></span><span>{Intl.lang("Transfer.uid")}</span><span>{Intl.lang("Transfer.asset.text5")}</span><span>{Intl.lang("Transfer.asset.text6")}</span><span></span></li>
                        <li><span></span><span></span><span>{v.TargetUid}</span><span>{target.sn}</span><span>{v.TargetAmount}</span><span></span></li>
                    </ul>
                    }
                </React.Fragment>
            }
        }
    }

    endDateChange(date) {
        this.setState({endDate: date, dateType: 0});
    }

    startDateChange(date) {
        this.setState({startDate: date, dateType: 0});
    }

    changeDateType(type) {
        switch (type) {
            case 0:
                this.setState({dateType: type});
                break;
            case 1:
                this.setState({startDate: moment().subtract(7, 'days'), endDate: moment(), dateType: type}, () => {
                    this.selectPeriod();
                });
                break;
            case 2:
                this.setState({startDate: moment().subtract(1, 'month'), endDate: moment(), dateType: type}, () => {
                    this.selectPeriod();
                });
                break;
            case 3:
                this.setState({startDate: null, endDate: null, dateType: type}, () => {
                    this.selectPeriod();
                });
                break;
        }
    }

    selectPeriod() {
        const {tab, dateType } = this.state;
        const page = 1;

        this._onChangeLoadData(tab, dateType, page);
    }

    render() {
         //const listTitle = [Intl.lang("Billlog.recharge"), Intl.lang("Billlog.withdrawal"), Intl.lang("Billlog.transfer"), Intl.lang("Billlog.fenfa"), Intl.lang("Billlog.fenhong"), Intl.lang("Billlog.other")];
        const listTitle = [Intl.lang("Billlog.recharge"), Intl.lang("Billlog.withdrawal"), Intl.lang("Billlog.transfer"), "", "",Intl.lang("Billlog.reward"), Intl.lang("Billlog.other")];
        //const listTitle = [Intl.lang("Billlog.recharge"), Intl.lang("Billlog.withdrawal"), Intl.lang("Billlog.transfer"), Intl.lang("Billlog.fenfa"), Intl.lang("Billlog.fenhong")];
        const {tab, logInfo, startDate, endDate, dateType, isMobile} = this.state;

        const columns = this.getColumns(tab);

        let withTab = "";
        if (logInfo.List && logInfo.List.length) withTab = "overWith" + columns.length;
        const dateList =[Intl.lang("Asset.109"), Intl.lang("Asset.110"), Intl.lang('connect.1_1')];

        return (
            <div className="tab-data-list">
                <div className="list-header-text list-header-tab">
                    {listTitle && listTitle.map((item, i) => {
                        if (item) return <h3 key={i} onClick={this.changeListTab.bind(this, i+1)} className={tab == i+1 ? "active" : null}>{item}</h3>
                    })}
                </div>
                {isMobile ? <div className="selection-date-config">
                    <div className="selection-date-config-box">
                        <DatePicker dateFormat="YYYY-MM-DD"
                                    selected={startDate}
                                    locale="zh-gb"
                                    minDate={moment().subtract(10, 'year')}
                                    maxDate={endDate || moment()}
                                    readOnly={true}
                                    placeholderText={Intl.lang("common.startDate")}
                                    onChange={this.startDateChange.bind(this)} />
                        <p>{Intl.lang('selection.date.config')}</p>
                        <DatePicker dateFormat="YYYY-MM-DD"
                                    locale="zh-gb"
                                    selected={endDate}
                                    minDate={startDate || moment().subtract(10, 'year')}
                                    maxDate={moment()}
                                    readOnly={true}
                                    placeholderText={Intl.lang("common.endDate")}
                                    onChange={this.endDateChange.bind(this)}/>
                    </div>
                    <button onClick={this.selectPeriod.bind(this)} className="btn with-btn logBtn date-picket-box-btn">{Intl.lang("Asset.111")}</button>
                    <p className="selection-time-config-box">
                        {dateList && dateList.map((item, index) => {
                            return <span key={index} className={dateType == Number(index + 1) ?"current":""} onClick={()=>this.changeDateType(Number(index + 1))}>{item}</span>
                        })}
                    </p>
                </div> : <div className="selection-date-config">
                    <span className="date-picket-box">
                    <i className="iconfont icon-date pdl-5 pos-a" />
                    <DatePicker dateFormat="YYYY-MM-DD"
                                selected={startDate}
                                locale="zh-gb"
                                minDate={moment().subtract(10, 'year')}
                                maxDate={endDate || moment()}
                                readOnly={true}
                                placeholderText={Intl.lang("common.startDate")}
                                onChange={this.startDateChange.bind(this)}>
                    </DatePicker>
                    </span>
                    <span className="pd010">--</span>
                    <span>
                        <span className="date-picket-box">
                            <i className="iconfont icon-date pdl-5 pos-a" />
                            <DatePicker dateFormat="YYYY-MM-DD"
                                        locale="zh-gb"
                                        selected={endDate}
                                        minDate={startDate || moment().subtract(10, 'year')}
                                        maxDate={moment()}
                                        readOnly={true}
                                        placeholderText={Intl.lang("common.endDate")}
                                        onChange={this.endDateChange.bind(this)}/>
                        </span>
                    </span>
                    <span className="date-time-box">
                    <span className={dateType == 1 ?"current":""} onClick={()=>this.changeDateType(1)}>{Intl.lang("Asset.109")}</span>
                    <span className={dateType == 2 ?"current":""} onClick={()=>this.changeDateType(2)}>{Intl.lang("Asset.110")}</span>
                    <span className={dateType == 3 ?"current":""} onClick={()=>this.changeDateType(3)}>{Intl.lang('connect.1_1')}</span>
                    </span>
                    <button onClick={this.selectPeriod.bind(this)} className="btn with-btn logBtn ml-50 date-picket-box-btn">{Intl.lang("Asset.111")}</button>
                </div>}
                <div className={"list-global-config " + withTab}>
                    <ul className="list-config-title">
                        {columns && columns.map((v, i)=>{
                            if(v){
                                return <li key={"t"+i} style={v.width?{width:v.width}:{}}>{v.display}</li>
                            }
                        })}
                    </ul>
                    {(logInfo.hasOwnProperty("PageCount") && logInfo.PageCount>0) && logInfo.List.map((v, i)=>{
                        return this.parseData(tab, v, i);
                    })}
                    {(logInfo.hasOwnProperty("PageCount") && logInfo.PageCount>0) && <Pager className="public-pages-config mt-20" data={logInfo} onChange={this.turnPage.bind(this)}></Pager>}

                    {(logInfo.hasOwnProperty("PageCount") && logInfo.PageCount==0) && <div className="no-list-data show-10">
                        <div className="no-list-data-pic"></div>
                        <p>{Intl.lang("bank.1_27")}</p>
                    </div>}

                </div>
            </div>
        )
    }
}
