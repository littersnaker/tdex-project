import React from 'react';
import history from '../core/history';
import Intl from '../intl';
import PureComponent from '../core/PureComponent';
//import {APP_URL} from '../config';
import Net from '../net/net';
import {CONST} from "../public/const";
import Event from '../core/event';
import TradeMgr from '../model/trade-mgr';
import AccountModel from "../model/account";
import {getCurrencySymbol} from "../utils/common";
import {IS_SIMULATE_TRADING, IS_TRANFER_OPEN} from "../config";
import Decimal from "../utils/decimal";
import ToolTip from "../components/ToolTip";
import AssetMenu from  '../components/AssetMenu';
import Echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/pie';
import 'echarts/lib/component/tooltip';

export default class Asset extends PureComponent {
    constructor(props) {
        super(props);

        this.sidebarList = [Intl.lang('Asset.all.asset'), Intl.lang('Asset.bit'), Intl.lang('Asset.cfd_text'), Intl.lang('Asset.ff_text')];

        this.ProductsData = null;
        this.isMobile = props.isMobile;
        this.digit = 8;
        this.state = {
            walletMap: AccountModel.getWalletMap(),
            walletTotal: AccountModel.getWalletTotal(),
            tab: Number(props.location.query.tab) ? Number(props.location.query.tab) : 0,
            ProductsMap: null,
            usdPrice: 0
        };
    }
    getSubNav(){
        return [
            {pathLink: '/asset',pathIcon: 'icon-wallet', pathName: Intl.lang('NavBar.103')},
            {pathLink: '/recharge',pathIcon: 'icon-recharge', pathName: Intl.lang('account.1_2')},
            {pathLink: '/withdrawals',pathIcon: 'icon-withdrawal', pathName: Intl.lang('account.1_3')},
            {pathLink: '/walletTransfer',pathIcon: 'icon-exchange', pathName: Intl.lang('WalletTransfer.theme')},
            {pathLink: '/transfer',pathIcon: 'icon-transfer', pathName: Intl.lang('Asset.102')},
            {pathLink: '/personal/billlog',pathIcon: 'icon-history', pathName: Intl.lang('Personal.billLog')}
        ];
    }
    componentWillUnmount(){
        super.componentWillUnmount();
    }
    componentWillMount() {
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
        Event.addListener(Event.EventName.WALLET_TOTAL_UPDATE, this.onUpdateWallet.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.loadProducts.bind(this), this);
        Event.addListener(Event.EventName.EXCHANGERATE_UPDATE, this.onUpdateExchange.bind(this), this);

        this.loadProducts();
    }

    onUpdateExchange(){
        this.onUpdateWallet();
    }

    onUpdateWallet() {
        this.setState({
            walletMap: AccountModel.getWalletMap(),
            walletTotal: AccountModel.getWalletTotal(),
            usdPrice: this.loadUsdPrice()
        });
    }
    loadUsdPrice(){
        let usdPrice = TradeMgr.getForwardPrice("BTCUSD");

        //console.log(usdPrice);
        return usdPrice || 0;
    }

    getWelletTotalForBTC(walletTotal) {
        let allCounts = 0, spotCount = 0, futCount = 0, cfdCount=0, allCountsToUsd=0, spotCountToUsd=0, futCountToUsd=0, cfdCountToUsd=0, { usdPrice } = this.state;
        try {
            if (walletTotal) {
                if (walletTotal[CONST.WALLET.TYPE.SPOT] && walletTotal[CONST.WALLET.TYPE.SPOT][1]) spotCount = walletTotal[CONST.WALLET.TYPE.SPOT][1].gross;
                if (walletTotal[CONST.WALLET.TYPE.FUT] && walletTotal[CONST.WALLET.TYPE.FUT][1]) futCount = walletTotal[CONST.WALLET.TYPE.FUT][1].gross;
                if (walletTotal[CONST.WALLET.TYPE.CFD] && walletTotal[CONST.WALLET.TYPE.CFD][1]) cfdCount = walletTotal[CONST.WALLET.TYPE.CFD][1].gross;
                allCounts = Decimal.accAdd(cfdCount,Decimal.accAdd(spotCount, futCount, this.digit, true),this.digit, true);

                if(usdPrice){
                    allCountsToUsd = Decimal.accMul(usdPrice, allCounts, 1, true);
                    spotCountToUsd = Decimal.accMul(usdPrice, spotCount, 1, true);
                    futCountToUsd = Decimal.accMul(usdPrice, futCount, 1, true);
                    cfdCountToUsd = Decimal.accMul(usdPrice, cfdCount, 1, true);
                }
            }
        } catch (e) {
            allCounts = 0;
            spotCount = 0;
            futCount = 0;
            cfdCount = 0;
            allCountsToUsd = 0;
            spotCountToUsd = 0;
            futCountToUsd = 0;
            cfdCountToUsd = 0
        }
        return {
            AllCounts: (Decimal.format(allCounts, this.digit)),
            SpotCounts: (Decimal.format(spotCount, this.digit)),
            FutCounts: (Decimal.format(futCount, this.digit)),
            CfdCounts: (Decimal.format(cfdCount, this.digit)),
            AllCountsToUsd: (allCountsToUsd),
            SpotCountToUsd: (spotCountToUsd),
            FutCountToUsd: (futCountToUsd),
            CfdCountToUsd: (cfdCountToUsd),
            UsdPrice: usdPrice
        }
    }

    loadProducts() {
        var pList = AccountModel.getProductCoins();

        if (pList) {
            this.setProductsMap(pList);
        } else {
            AccountModel.loadProductCoins(null, (data) => {
                if (data) {
                    this.setProductsMap(data.List);
                }
            }, this);
        }
    }

    setProductsMap(pList){
        var newPlist = {}, usdPrice = this.loadUsdPrice();
        pList.forEach((item)=>{
            newPlist[item.Id] = item;
        });
        this.ProductsData = pList;
        this.setState({ProductsMap: newPlist, usdPrice: usdPrice});
    }

    walletCounts(balance) {
        var Counts = "0.0000", freeze = "0.0000", canUse = "0.0000", fix = 8;
        if (balance) {
            Counts = Decimal.format(balance.gross, fix);
            freeze = Decimal.format(balance.freeze, fix);
            canUse = Decimal.format(balance.canUse, fix).toString();
        }
        return {Counts: Counts, Freeze: freeze, canUse: canUse}
    }

    getProductWallet() {
        const {ProductsMap, walletMap, tab} = this.state, typeMap = {1:CONST.WALLET.TYPE.SPOT, 2:CONST.WALLET.TYPE.CFD, 3:CONST.WALLET.TYPE.FUT};
        var type=typeMap[tab], list = [], wMap = walletMap[type] ? walletMap[type] : {};
        try {
            if (wMap && JSON.stringify(wMap) != "{}") {
                for (var i in wMap) {
                    var info = wMap[i], item = ProductsMap[i];
                    if (!info) {
                        info = {
                            Currency: v.Id,
                            Withdraw: 0,
                            Quantity: 0,
                            Transfer: 0,
                            Unconfirm: 0,
                            Deposit: 0,
                            Lock: 0,
                            Gift: 0
                        };
                    }
                    let element = item ? {Op: item.Op, Exchange: true, Types: item.Types} : {
                        Op: 0,
                        Exchange: false,
                        Types: 0
                    };
                    Object.assign(info, element);
                    list.push(info);
                }
            }
        } catch (e) {
            list = [];
        }
        return list;
    }

    changeTab = (index) => {
        if (index !== this.state.tab) {
            this.setState({tab: index});
            history.push("/asset?tab=" + index);
        }
    };


    render() {
        const { walletTotal, tab } = this.state;
        const money = this.getWelletTotalForBTC(walletTotal), path=this.getSubNav();

        let ProductList = this.ProductsData;
        if(tab){
            ProductList = this.getProductWallet();
        }

		return <div className="inside-page-web">
            <div className="inside-web-part">
                <AssetMenu path={path} />
                <div className="all-assets-section">
                    <ul className="assets-section-sidebar assets-border">
                        {this.sidebarList && this.sidebarList.map((item, index) => {
                            return <li key={index} className={tab === index ? 'active' : null} onClick={this.changeTab.bind(this, index)}>{item}</li>
                        })}
                    </ul>
                    {tab === 0 ? <TotalAssets money={money} productList={ProductList}/>
                    : tab === 1 ? <ExchangeAssets money={money} productList={ProductList} />
                    : tab === 2 ? <CFDAssets money={money} productList={ProductList} />
                    : tab === 3 ? <TradeAssets money={money} productList={ProductList} />
                    : null}
                </div>
            </div>
        </div>
	}
}

class TotalAssets extends PureComponent {

    constructor(props) {
        super(props);

        this.Echart = null;
        this.code = "BTCUSD";

        this.state = {

        }
    }

    componentWillMount() {
    }

    componentWillReceiveProps(nextProps) {
        this.setEchartData(nextProps.money);
    }

    componentDidMount() {
        this.setEchartData(this.props.money);

        let logWin = document.getElementById("centerItem");
        if(logWin){
            let W = logWin.scrollWidth - logWin.clientWidth;
            logWin.scrollLeft = W/2;
        }
    }
    componentWillUnmount() {
        this.Echart = null;
        super.componentWillUnmount();
    }

    createEchart = (dom, data) => {
        var chart = Echarts.init(dom);
        chart.setOption(this.getChartOption(data));
        this.Echart = chart;
    };

    getChartOption(data){
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: "{b}: {c} ({d}%)"
            },
            series: [
                {
                    name:'',
                    type:'pie',
                    radius: ['95%', '50%'],
                    avoidLabelOverlap: false,
                    hoverAnimation:false,
                    label: {
                        normal: {
                            show: false,
                            position: 'center'
                        },
                        emphasis: {
                            show: false,
                            textStyle: {
                                fontSize: '12'
                            }
                        }
                    },
                    labelLine: {
                        normal: {
                            show: false
                        }
                    },
                    data: data,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        },
                        normal:{
                            color: params => data && data.map((item) => item.color)[params.dataIndex]
                        }
                    }
                }
            ]
        };

        return option;
    }

    setEchartData = (data) => {
        if (!data) return false;
        const saveData = [];
        const tipsName = [Intl.lang('Asset.bb_total2_',""), Intl.lang('Asset.cfd_total2',""), Intl.lang('Asset.ff_total2',"")];
        const tipsColor = ['#3188fd', '#ffa340', '#00b957'];
        const tipsValue = [data.SpotCounts, data.CfdCounts, data.FutCounts];
        tipsName && tipsName.map((item, index) => {
            const saveDataItem = {};
            saveDataItem.name = item;
            saveDataItem.color = tipsColor[index];
            saveDataItem.value = tipsValue[index];
            saveData.push(saveDataItem);
        });
        if (!this.Echart){
            this.createEchart(document.getElementById("chart"), saveData);
        }else{
            this.Echart.setOption(this.getChartOption(saveData));
        }
    };

    getAccountWallet(Currency){
        const walletMap=AccountModel.getWalletMap(), wallet={spot:'0.00000000',cfd:'0.00000000',fut:'0.00000000'};
        if(walletMap){
            if(walletMap[CONST.WALLET.TYPE.SPOT][Currency]){
                wallet.spot = Decimal.format(walletMap[CONST.WALLET.TYPE.SPOT][Currency].gross,8);
            }
            if(walletMap[CONST.WALLET.TYPE.CFD][Currency]){
                wallet.cfd = Decimal.format(walletMap[CONST.WALLET.TYPE.CFD][Currency].gross,8);
            }
            if(walletMap[CONST.WALLET.TYPE.FUT][Currency]){
                wallet.fut = Decimal.format(walletMap[CONST.WALLET.TYPE.FUT][Currency].gross,8);
            }
        }
        return wallet;
    }

    render(){
        const { money, productList } = this.props;
        const exRate = money.UsdPrice;

        return <div className="assets-section-content">
            <ul className="total-assets-head">
                <li className="assets-border">
                    <p className="title">{Intl.lang('Asset.all_total', ' (BTC)')}</p>
                    <h3 className="title-text">{money.AllCounts}<span>≈ {money.AllCountsToUsd} USD</span></h3>
                    <div className='un-line' />
                    <p>{Intl.lang('Asset.text.time',"1", exRate||"--")}</p>
                    <p>{Intl.lang('Asset.text.tips')}</p>
                </li>
                <li className="assets-border" style={{position: 'relative', overflow: 'initial'}}>
                    <p className="title">{Intl.lang('Asset.text.fenbu')}</p>
                    <div className="assets-circular"  id="chart" />
                    <ul className="assets-circular-list">
                        <li className="blue">
                            <p className="title">{Intl.lang('Asset.bb_total2_', '（BTC）')}</p>
                            <p className="text">{money.SpotCounts}</p>
                        </li>
                        <li className="yellow">
                            <p className="title">{Intl.lang('Asset.cfd_total2', '（BTC）')}</p>
                            <p className="text">{money.CfdCounts}</p>
                        </li>
                        <li className="green">
                            <p className="title">{Intl.lang('Asset.ff_total2', '（BTC）')}</p>
                            <p className="text">{money.FutCounts}</p>
                        </li>
                    </ul>
                </li>
            </ul>
            <div className="asset-config-list assets-border">
                <div className='asset-config-list-search hide'>
                    <div className="asset-config-list-search-box">
                        <input type="text" placeholder='搜索币种'/>
                        <i className="iconfont icon-search" />
                    </div>
                </div>

                <div className="log-list-overflow" id="centerItem">
                    <div className="ov-w-rows6">
                        <ul className="asset-config-list-title">
                            <li>{Intl.lang('Asset.105')}</li>
                            <li>{Intl.lang('Asset.all.asset')}</li>
                            <li>{Intl.lang('Asset.bit')}</li>
                            <li>{Intl.lang('Asset.cfd_text')}</li>
                            <li>{Intl.lang('Asset.ff_text')}</li>
                        </ul>
                        {productList && productList.map((info, i)=>{
                            const wallet = this.getAccountWallet(info.Id);

                            var total = Decimal.accAdd(Decimal.accAdd(wallet.spot, wallet.cfd), wallet.fut, 8, true);
                            return <ul className="asset-config-list-content" key={"t"+i}>
                                <li>{info.Currency==12 ? <span>{"TD ("+ Intl.lang("Asset.gift") +") "}<ToolTip title={Intl.lang("Asset.tdFree_tip")}><i className="iconfont icon-question" /></ToolTip></span> : info.Code}</li>
                                <li>{total}</li>
                                <li>{wallet.spot}</li>
                                <li>{wallet.cfd}</li>
                                <li>{wallet.fut}</li>
                            </ul>
                        })}
                        {(!productList || !productList.length) && <div className="no-list-data show-10">
                            <div className="no-list-data-pic" />
                            <p>{Intl.lang('bank.1_27')}</p>
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    }
}

class ExchangeAssets extends PureComponent {

    constructor(props) {
        super(props);
    }

    walletCounts(balance) {
        var Counts = "0.0000", freeze = "0.0000", canUse = "0.0000", fix = 8;
        if (balance) {
            Counts = Decimal.format(balance.gross, fix);
            freeze = Decimal.format(balance.freeze, fix);
            canUse = Decimal.format(balance.canUse, fix).toString();
        }
        return {Counts: Counts, Freeze: freeze, canUse: canUse}
    }

    returnToWalletTransfer(codeId, from) {
        history.push({pathname: '/walletTransfer', query: {'currency': codeId, tab: from}});
    }

    returnToTransfer(codeId, from) {
        history.push({pathname: '/transfer', query: {'currency': codeId, 'from':from}});
    }

    returnToRecharge(codeId, from) {
        history.push({pathname: '/recharge', query: {'currency': codeId, 'from':from}});
    }

    returnToWithdrawals(codeId, from) {
        history.push({pathname: '/withdrawals', query: {'currency': codeId, 'from':from}});
    }

    render(){
        const {money, productList} = this.props, spotType = CONST.WALLET.TYPE.SPOT;

        return <div className="assets-section-content">
            <div className="asset-config-head assets-border">
                <p className='title'>{Intl.lang('Asset.bb_total2_', ' (BTC)')}</p>
                <h3 className='title-text'>{money.SpotCounts}<span>≈ {money.SpotCountToUsd} USD</span></h3>
            </div>
            <div className="asset-config-list assets-border">
                <div className='asset-config-list-search hide'>
                    <div className="asset-config-list-search-box">
                        <input type="text" placeholder={Intl.lang('Asset.list.search')}/>
                        <i className="iconfont icon-search" />
                    </div>
                </div>
                <ul className="asset-config-list-title">
                    <li>{Intl.lang('Asset.105')}</li>
                    <li>{Intl.lang('recharge.canUse')}</li>
                    <li>{Intl.lang('Asset.100')}</li>
                    <li>{Intl.lang('recharge.total')}</li>
                    <li>{Intl.lang('futures.hist_title8')}</li>
                </ul>
                {productList && productList.map((info, i)=>{
                    var cs = getCurrencySymbol(info.Currency);
                    var asset = this.walletCounts(info);
                    return <ul className="asset-config-list-content" key={"sp"+i}>
                        <li>{info.Currency==12 ? <span>{"TD ("+ Intl.lang("Asset.gift") +") "}<ToolTip title={Intl.lang("Asset.tdFree_tip")}><i className="iconfont icon-question" /></ToolTip></span> : cs && cs.sn}</li>
                        <li>{asset.canUse || '0.0000'}</li>
                        <li>{asset.Freeze || '0.0000'}</li>
                        <li>{asset.Counts || '0.0000'}</li>
                        <li>
                            {(info.Op & 0x01)>0 ? <a href="javascript:;" onClick={()=>this.returnToRecharge(info.Currency, spotType)}>{Intl.lang("account.1_2")}</a>:<span></span>}
                            {(info.Op & 0x02)>0 ? <a  href="javascript:;" onClick={()=>this.returnToWithdrawals(info.Currency, spotType)}>{Intl.lang("account.1_3")}</a>:<span></span>}
                            {(!IS_SIMULATE_TRADING && ((info.Op & 0x04)>0)) ? <a  href="javascript:;" onClick={()=>this.returnToTransfer(info.Currency, spotType)}>{Intl.lang("Asset.102")}</a>:<span></span>}
                            {(IS_TRANFER_OPEN && (info.Op & 0x08)>0) ? <a  href="javascript:;" onClick={()=>this.returnToWalletTransfer(info.Currency, spotType)}>{Intl.lang("WalletTransfer.transfer")}</a>:<span></span>}
                        </li>
                    </ul>
                })}
                {(productList == '') && <div className="no-list-data show-10">
                    <div className="no-list-data-pic" />
                    <p>{Intl.lang('bank.1_27')}</p>
                </div>}
            </div>
        </div>
    }
}

class CFDAssets extends PureComponent {
    constructor(props) {
        super(props);
    }
    walletCounts(balance) {
        var Counts = "0.0000", freeze = "0.0000", canUse = "0.0000", fix = 8;
        if (balance) {
            Counts = Decimal.format(balance.gross, fix);
            freeze = Decimal.format(balance.freeze, fix);
            canUse = Decimal.format(balance.canUse, fix).toString();
        }
        return {Counts: Counts, Freeze: freeze, canUse: canUse}
    }

    returnToWalletTransfer(codeId, from) {
        history.push({pathname: '/walletTransfer', query: {'currency': codeId, tab: from}});
    }

    returnToTransfer(codeId, from) {
        history.push({pathname: '/transfer', query: {'currency': codeId, 'from':from}});
    }

    returnToRecharge(codeId, from) {
        history.push({pathname: '/recharge', query: {'currency': codeId, 'from':from}});
    }

    returnToWithdrawals(codeId, from) {
        history.push({pathname: '/withdrawals', query: {'currency': codeId, 'from':from}});
    }
    render(){
        const { money, productList } = this.props, futType = CONST.WALLET.TYPE.CFD;

        return <div className="assets-section-content">
            <div className="asset-config-head assets-border">
                <p className='title'>{Intl.lang('Asset.cfd_total2', ' (BTC)')}</p>
                <h3 className='title-text'>{money.CfdCounts}<span>≈ {money.CfdCountToUsd} USD</span></h3>
            </div>
            <div className="asset-config-list assets-border">
                <div className='asset-config-list-search hide'>
                    <div className="asset-config-list-search-box">
                        <input type="text" placeholder={Intl.lang('Asset.list.search')}/>
                        <i className="iconfont icon-search" />
                    </div>
                </div>
                <ul className="asset-config-list-title">
                    <li>{Intl.lang('Asset.105')}</li>
                    <li>{Intl.lang('recharge.canUse')}</li>
                    <li>{Intl.lang('Asset.100')}</li>
                    <li>{Intl.lang('recharge.total')}</li>
                    <li>{Intl.lang('futures.hist_title8')}</li>
                </ul>
                {productList && productList.map((info, i)=>{
                    var cs = getCurrencySymbol(info.Currency);
                    var asset = this.walletCounts(info);

                    return <ul className="asset-config-list-content" key={"sa"+i}>
                        <li>{info.Currency==12 ? <span>{"TD ("+ Intl.lang("Asset.gift") +") "}<ToolTip title={Intl.lang("Asset.tdFree_tip")}><i className="iconfont icon-question" /></ToolTip></span> : cs && cs.sn}</li>
                        <li>{asset.canUse || '0.0000'}</li>
                        <li>{asset.Freeze || '0.0000'}</li>
                        <li>{asset.Counts || '0.0000'}</li>
                        <li>
                            {(!IS_SIMULATE_TRADING && ((info.Op & 0x04)>0)) && <a  href="javascript:;" onClick={()=>this.returnToTransfer(info.Currency, futType)}>{Intl.lang("Asset.102")}</a>}
                            {(IS_TRANFER_OPEN && (info.Op & 0x08)>0) && <a  href="javascript:;" onClick={()=>this.returnToWalletTransfer(info.Currency, futType)}>{Intl.lang("WalletTransfer.transfer")}</a>}
                        </li>
                    </ul>
                })}
                {(productList == '') && <div className="no-list-data show-10">
                    <div className="no-list-data-pic" />
                    <p>{Intl.lang('bank.1_27')}</p>
                </div>}
            </div>
        </div>
    }
}

class TradeAssets extends PureComponent {

    constructor(props) {
        super(props);
    }

    walletCounts(balance) {
        var Counts = "0.0000", freeze = "0.0000", canUse = "0.0000", fix = 8;
        if (balance) {
            Counts = Decimal.format(balance.gross, fix);
            freeze = Decimal.format(balance.freeze, fix);
            canUse = Decimal.format(balance.canUse, fix).toString();
        }
        return {Counts: Counts, Freeze: freeze, canUse: canUse}
    }

    returnToWalletTransfer(codeId, from) {
        history.push({pathname: '/walletTransfer', query: {'currency': codeId, tab: from}});
    }

    returnToTransfer(codeId, from) {
        history.push({pathname: '/transfer', query: {'currency': codeId, 'from':from}});
    }

    returnToRecharge(codeId, from) {
        history.push({pathname: '/recharge', query: {'currency': codeId, 'from':from}});
    }

    returnToWithdrawals(codeId, from) {
        history.push({pathname: '/withdrawals', query: {'currency': codeId, 'from':from}});
    }

    render(){
        const {money, productList } = this.props, futType = CONST.WALLET.TYPE.FUT;

        return <div className="assets-section-content">
            <div className="asset-config-head assets-border">
                <p className='title'>{Intl.lang('Asset.ff_total2', ' (BTC)')}</p>
                <h3 className='title-text'>{money.FutCounts}<span>≈ {money.FutCountToUsd} USD</span></h3>
            </div>
            <div className="asset-config-list assets-border">
                <div className='asset-config-list-search hide'>
                    <div className="asset-config-list-search-box">
                        <input type="text" placeholder={Intl.lang('Asset.list.search')} />
                        <i className="iconfont icon-search" />
                    </div>
                </div>
                <ul className="asset-config-list-title">
                    <li>{Intl.lang('Asset.105')}</li>
                    <li>{Intl.lang('recharge.canUse')}</li>
                    <li>{Intl.lang('Asset.100')}</li>
                    <li>{Intl.lang('recharge.total')}</li>
                    <li>{Intl.lang('futures.hist_title8')}</li>
                </ul>
                {productList && productList.map((info, i)=>{
                    var cs = getCurrencySymbol(info.Currency);
                    var asset = this.walletCounts(info);

                    return <ul className="asset-config-list-content" key={"sa"+i}>
                        <li>{info.Currency==12 ? <span>{"TD ("+ Intl.lang("Asset.gift") +") "}<ToolTip title={Intl.lang("Asset.tdFree_tip")}><i className="iconfont icon-question" /></ToolTip></span> : cs && cs.sn}</li>
                        <li>{asset.canUse || '0.0000'}</li>
                        <li>{asset.Freeze || '0.0000'}</li>
                        <li>{asset.Counts || '0.0000'}</li>
                        <li>
                            {(!IS_SIMULATE_TRADING && ((info.Op & 0x04)>0)) && <a  href="javascript:;" onClick={()=>this.returnToTransfer(info.Currency, futType)}>{Intl.lang("Asset.102")}</a>}
                            {(IS_TRANFER_OPEN && (info.Op & 0x08)>0) && <a  href="javascript:;" onClick={()=>this.returnToWalletTransfer(info.Currency, futType)}>{Intl.lang("WalletTransfer.transfer")}</a>}
                        </li>
                    </ul>
                })}
                {(productList == '') && <div className="no-list-data show-10">
                    <div className="no-list-data-pic" />
                    <p>{Intl.lang('bank.1_27')}</p>
                </div>}

            </div>
        </div>
    }
}
