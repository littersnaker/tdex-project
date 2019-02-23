import React from 'react';
import PureComponent from "../core/PureComponent";
import history from '../core/history';
import Intl from "../intl";
import Net from "../net/net";
import Event from "../core/event";

import Header from "../components/Header";
import BrowserOpen from "./BrowserOpen";

import Decimal from '../utils/decimal';
import Clipboard from 'clipboard';
import { isMobile, checkAgent } from '../utils/util';
import {getStorage} from "../utils/util";
import {toast} from "../utils/common";

import '../less/minetrade.less';
import '../css/trading-contest.css';
import wxIocn from "../images/icons/mine-share-wx.png";
import Icon1 from "../images/icons/mine-share1.png";
import Icon2 from "../images/icons/mine-share2.png";
import Icon3 from "../images/icons/mine-share3.png";
import Icon4 from "../images/icons/mine-share4.png";

const WeChat = window.wx;
class TradingContest extends PureComponent {

    constructor(props) {
        super(props);

        this.shareContent = this.shareContent.bind(this);
        this.joinTrading = this.joinTrading.bind(this);

        this.wx = checkAgent().weixin;
        this.isMobile = isMobile();
        this.state = {
            isShare: false
        }
    }
    componentDidMount() {

        if(this.isMobile){
            this.shareInit();
        }
        this.setClipboard();
    }
    componentWillUnmount() {
        this.clipboard.destroy();

        super.componentWillUnmount();
    }
    shareInit() {
        window._bd_share_config = {
            common: {
                'bdMini': 2,
                'bdSize': 16,
                "onBeforeClick": function (cmd, config) {
                    return {
                        "bdText": Intl.lang('trading.dig.33_',120,60),
                        "bdUrl": "https://sim.tdex.com/activities/tradingContest"
                    }
                }
            },
            'share': {}
        }
        if (window._bd_share_main) {
            window._bd_share_main.init()
        } else {
            $('body').append("<script>with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script')).src='/static/api/js/share.js?cdnversion='+Date.now()];</script>")
        }
    }
    shareContent() {
        this.setState({ isShare: !this.state.isShare })
    }
    setClipboard(){
        const clipboard = new Clipboard('.copy-link-share')
        clipboard.on('success', e => {
            this.shareContent()
            toast(Intl.lang("Recharge.120"), 0, 1000)
        })
        clipboard.on('error', function (e) {
            console.log(e)
        })
        this.clipboard = clipboard
    }
    joinTrading(){
        history.replace('/trade');
    }

    gotoBrowserOpen(){
        if(this.state.openNew){
            this.setState({openNew: false});
        }else {
            this.setState({openNew: true});
        }
    }
    render() {
        const { isShare, openNew } = this.state;
        const currencyList = [{cur:'iPhoneXS Max', amount:' +10,000TD'}, {cur:'iPhoneXS', amount:' +6,000TD'}, {cur:'iPhoneX', amount:' +3,000TD'}, {cur:Intl.lang("activity.TradingContest.award1"), amount:' +1,000TD'}, {cur:Intl.lang("activity.TradingContest.award2"), amount:' +500TD'}, {cur:Intl.lang("activity.TradingContest.award3"), amount:''},];
        const logoList = [
            'https://www.wanlianzhijia.com',
            'https://www.tuoluocaijing.cn',
            'https://www.walian.cn',
            'https://bihu.com/',
            'http://bitejie.net',
            'http://www.dayqkl.com',
            'http://www.chainb.com/',
            'http://www.tmtpost.com',
            'http://www.biiquan.com/'
        ];
        return (
            <React.Fragment>
                <div className={"mimic-panel-trading trading-contest "+Intl.getLang()}>
                    <div className="trading-contest-bg">
                        <div onClick={this.shareContent} className="panel-head-share pc-hide">{Intl.lang("Invite.share")}</div>
                        {/*<div className="national-activities-bi-bg"></div>*/}
                        <div className="panel-head-top-title">{Intl.lang("activity.TradingContest.tet3")}</div>
                        <div className={"panel-head-top-h1 "+Intl.getLang()}></div>
                        <p className="panel-head-top-p">{Intl.lang("activity.TradingContest.tet5")}</p>
                        <div className="panel-head-top-time">{Intl.lang("activity.TradingContest.tet6")}</div>
                        <div onClick={this.joinTrading} className="panel-head-top-btn">{Intl.lang("activity.TradingContest.tet7")}</div>
                    </div>
                    <div className="panel-head-section">
                        <div className="panel-head-section-title">{Intl.lang("mimic.panel.trading.8")}</div>
                        <div className="panel-head-section-con">
                            <p>{Intl.lang("activity.TradingContest.tet8")}</p>
                            <p>{Intl.lang("mimic.panel.trading.10")}</p>
                            <p>{Intl.lang("mimic.panel.trading.10_",5000)}</p>
                            <p>{Intl.lang("activity.TradingContest.tet10")}</p>
                            <a className="panel-head-section-a" href="https://support.tdex.com/hc/zh-cn/articles/360016532991-%E5%B8%81%E4%B9%8B%E5%AE%B6%E8%81%94%E5%90%88TDEx-%E5%B7%A5%E7%A8%8B%E7%89%88%E4%BA%A4%E6%98%93%E5%A4%A7%E8%B5%9B%E6%B4%BB%E5%8A%A8" target="_blank">{Intl.lang("mimic.panel.trading.12")}</a>
                        </div>
                    </div>
                    <div className="panel-head-section">
                        <div className="panel-head-section-title">{Intl.lang("mimic.panel.trading.13")}</div>
                        <div className="panel-head-section-flex">
                            {currencyList && currencyList.map((item, i) => {
                                return  <div key={i} className={"panel-section-flex-"+i}>
                                    <div className={"trading-contest-flex-img img"+i}></div>
                                    <p className="trading-contest-flex">{item.cur+item.amount}</p>
                                    <div className={Intl.getLang()+" panel-section-flex-img img"+i}></div>
                                </div>
                            })}
                        </div>
                    </div>
                    <ContestRank />
                    <div className="panel-head-section">
                        <div className="panel-head-section-title">{Intl.lang("activity.TradingContest.media")}</div>
                        <div className="media-support-section">
                            <a className="media-support-icon0"></a>
                            {logoList && logoList.map((item, i)=>{
                                return <a key={i} className={"media-support-icon"+(i+1)} href={item} target="_blank"></a>
                            })}
                        </div>
                    </div>

                    <div className="mine-trade-share" style={{ bottom: isShare ? true : '-350px' }}>
                        <input className="mine-trade-share-input" type="text" id="copy-share-text" defaultValue={window.location.href} />
                        <div className="bdsharebuttonbox">
                            <a href="javascript:;" className="share-item copy-link-share" data-clipboard-action="copy" data-clipboard-target="#copy-share-text">
                                <img src={Icon1} alt="mine-share" />
                                <p>{Intl.lang('activity.registered.btn')}</p>
                            </a>
                            {this.wx && <a href="javascript:;" className="bds_tsina share-item">
                                <img onClick={this.gotoBrowserOpen.bind(this)} src={wxIocn}/>
                                <p>{Intl.lang('trading.dig.wx')}</p>
                            </a>}
                            <a href="javascript:;" className="bds_tsina share-item">
                                <img src={Icon2} alt="mine-share"  data-cmd="tsina"/>
                                <p>{Intl.lang('trading.dig.32')}</p>
                            </a>
                            <a href="javascript:;" className="bds_twi share-item">
                                <img src={Icon3} alt="mine-share"  data-cmd="fbook"/>
                                <p>Twitter</p>
                            </a>
                            <a href="javascript:;" className="bds_fbook share-item">
                                <img src={Icon4} alt="mine-share"  data-cmd="twi"/>
                                <p>Facebook</p>
                            </a>
                        </div>
                        <div className="mine-trade-share-colse" onClick={this.shareContent.bind(this)}>{Intl.lang('mining.status0')}</div>
                    </div>
                    <p className="panel-section-last-txt">{Intl.lang("activity.TradingContest.tet9")}</p>
                </div>
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} />}
            </React.Fragment>
        )
    }
}

export default TradingContest;

class ContestRank extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            showRank: false,
            rankList:{List: []} //最新成交
        };
    }
    componentWillMount(){
        this.getHistory();
    }
    getHistory(){
        var self = this;
        Net.httpRequest("activity/rank", "", (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                self.setState({rankList:Info, showRank:Info.List.length>0});
            }else{

            }
        }, this);
    }

    render(){
        const {showRank, rankList} = this.state;
        const self = this;
        return (
        showRank?
            <div className="panel-head-section">
                <div className="panel-head-section-title f-clear">{Intl.lang("mimic.panel.trading.14")}<span className="fs12 fr m-hide">{Intl.lang("activity.TradingContest.update")}{Intl.lang("common.symbol.colon")}{rankList.UpdateTime||"--:--:--"}</span></div>
                <ul className="panel-section-ranking panel-section-ranking-con">
                    <li>{Intl.lang("mimic.panel.trading.1")}</li>
                    <li>{Intl.lang("activity.TradingContest.uid")}</li>
                    <li>{Intl.lang("mimic.panel.trading.3")}</li>
                </ul>
                {rankList.List && rankList.List.map((item, i)=>{
                    return <ul key={i} className="panel-section-ranking-txt">
                        <li>
                            {i == 0 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(i+1)+".png"}/>
                                : i == 1 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(i+1)+".png"}/>
                                : i == 2 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(i+1)+".png"}/>
                                : <span>{i+1}</span>}</li>
                        <li>{item.Uid}</li>
                        <li>{Decimal.format(item.Assets,4) +" BTC"}</li>
                    </ul>
                })}
                {(!rankList.List|| !rankList.List.length) && <p className="panel-section-ranking-none">{Intl.lang("common.not_open")}</p>}
                <span className="fs12 tc pdt-10 dis-inb pc-hide">{Intl.lang("activity.TradingContest.update")}{Intl.lang("common.symbol.colon")}{rankList.UpdateTime||"--:--:--"}</span>
            </div>
            :null
        )
    }
}