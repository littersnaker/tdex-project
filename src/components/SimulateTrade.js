import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from "../intl";
import Icon1 from "../images/icons/mine-share1.png";
import Icon2 from "../images/icons/mine-share2.png";
import Icon3 from "../images/icons/mine-share3.png";
import Icon4 from "../images/icons/mine-share4.png";
import '../less/minetrade.less';
import {toast} from "../utils/common";
import Clipboard from 'clipboard';
import GlobelStore from '../stores';
import history from '../core/history';
import { isMobile, checkAgent } from '../utils/util';
import PopDialog from "../utils/popDialog";
import ModifyPhone from "./BindPhone";
import Net from "../net/net";
import Auth from "../model/auth";
import SimulateMask from './SimulateMask';
import {getStorage} from "../utils/util";
import wxIocn from "../images/icons/mine-share-wx.png";
import BrowserOpen from "./BrowserOpen";
import Event from "../core/event";

const WeChat = window.wx;
class SimulateTrade extends PureComponent {

    constructor(props) {
        super(props);

        this.changeMask = this.changeMask.bind(this);
        this.shareContent = this.shareContent.bind(this);
        this.checkUserInfo = this.checkUserInfo.bind(this);
        this.jumpToMod = this.jumpToMod.bind(this);

        this.wx = checkAgent().weixin;
        this.isMobile = isMobile();
        this.turnTimer = null;
        this.state = {
            isShare: false,
            showMask: false,
            popMode: ''
        }
    }
    componentDidMount() {
        Event.addListener(Event.EventName.SIMULATE_AWARD, this.onUserAward.bind(this), this);

        this.shareInit();
        this.setClipboard();
    }
    componentWillUnmount() {
        this.clearTimer();
        this.clipboard.destroy();

        super.componentWillUnmount();
    }
    onUserAward(){
        let param = this.getSimulateMaskArg("afterBind");
        PopDialog.open(<SimulateMask {...param} />, 'simulate_panel');
    }
    shareInit() {
        window._bd_share_config = {
            common: {
                'bdMini': 2,
                'bdSize': 16,
                "onBeforeClick": function (cmd, config) {
                    return {
                        "bdText": Intl.lang('trading.dig.33_',120,60),
                        "bdUrl": "https://sim.tdex.com/activities/simulatetrade"
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
    changeMask(){
        this.setState({ showMask: !this.state.showMask });
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
    clearTimer(){
        clearTimeout(this.turnTimer);
        this.turnTimer = null;
    }
    checkUserInfo(){
        var uInfo = GlobelStore.getUserInfo();
        if(!this.isMobile){
            if(!uInfo || !uInfo.Uid){
                this.setState({showMask: true, popMode:'unLogin'});
            }
            else if(!uInfo.Mobile){
                let simulateMoney = getStorage("simulateMoney_"+uInfo.Uid, true);
                if(!simulateMoney){
                    this.setState({showMask: true, popMode:"unBind"});
                }else{
                    history.replace('/trade');
                }
            } else if(uInfo || uInfo.Mobile) {
                //设置setStorage统一account.js中监听weboscket后处理
                // let simulateMoney = getStorage("simulateMoney_"+uInfo.Uid, true);
                history.replace('/trade');
            }
        }else{
            this.clearTimer();
            let ua = checkAgent();
            if(ua.ios){
                window.location = 'app://com.by.tdex';
                this.turnTimer = setTimeout(function(){
                    history.push('/appdownload');
                    history.push('/appdownload');
                },2000);
            }else if(ua.android){
                window.location = 'app://com.by.tdex';
                this.turnTimer = setTimeout(function(){
                        history.push('/appdownload');
                },2000);
            }
        }

    //    活动尚未开始 this.setState({showMask: true, maskType: 'clock', maskTitle: Intl.lang("mimic.panel.trading.22"), maskBtn: Intl.lang("mimic.panel.trading.22"), maskPath: false});
    }
    getSimulateMaskArg(mode){
        let Arg = {
            'unLogin': {type: 'lock', title: Intl.lang("mimic.panel.trading.16"), btnMsg: Intl.lang("mimic.panel.trading.17"), maskPath: '/login', onChange:this.jumpToMod, closeMask:this.changeMask},
            'unBind': {type: 'phone', title: Intl.lang("mimic.panel.trading.18",100), btnMsg: Intl.lang("mimic.panel.trading.19"), maskPath: false, onChange:this.jumpToMod, closeMask:this.changeMask},
            'afterBind': {type: 'building', title: Intl.lang("mimic.panel.trading.20",100), btnMsg: Intl.lang("mimic.panel.trading.21"), url: "/asset"}
        };
        return Arg[mode];
    }
    jumpToMod(){
        if(this.state.popMode == "unBind"){
            let uInfo = GlobelStore.getUserInfo();
            let simulateMoney = getStorage("simulateMoney_"+uInfo.Uid, true);
            if(simulateMoney){
                PopDialog.open(<ModifyPhone hadBind={false} onChange={(type,item)=>this.onBindAuthItem(type,item)}/>, 'modify_phone');
            }
            this.changeMask();
            return false;
        }

        let ModeArg = this.getSimulateMaskArg(this.state.popMode);
        history.push({ pathname: ModeArg.maskPath, query: { return_to: '/activities/simulatetrade' }});
    }
    // 绑定、解绑 验证方式
    onBindAuthItem(type, item){
        var that = this;
        Net.httpRequest("user/mobile", item, (data)=>{
            if (data.Status == 0){
                that.refreshUerInfo();
                PopDialog.closeByDomID("modify_phone");
                toast(Intl.lang("Personal.111"));
            }
        }, this);
    }
    // 刷新 用户信息
    refreshUerInfo(){
        Auth.loadUserInfo();
    }
    gotoBrowserOpen(){
        if(this.state.openNew){
            this.setState({openNew: false});
        }else {
            this.setState({openNew: true});
        }
    }
    render() {
        const { isShare, showMask, popMode, openNew } = this.state;
        const rankTitle = [Intl.lang("mimic.panel.trading.1"), Intl.lang("mimic.panel.trading.2"), Intl.lang("mimic.panel.trading.3")];
        const rankMsg = [];//{user: 'PangHu', curMoney: '100000000TD'}, {user: 'test', curMoney: '100000000TD'}, {user: '222', curMoney: '100000000TD'}, {user: 'awda', curMoney: '100000000TD'}, {user: 'dwdaw', curMoney: '100000000TD'}];
        const currencyList = [{cur:'ETH', amount:'30ETH'}, {cur:'ETH', amount:'20ETH'}, {cur:'ETH', amount:'10ETH'}, {cur:'TD', amount:'20000TD'}, {cur:'TD', amount:'10000TD'}, {cur:'TD', amount:'50000TD'},];
        let Arg = null;
        if(popMode){
            Arg = this.getSimulateMaskArg(popMode);
        }
        return (
            <React.Fragment>
                <div className={"mimic-panel-trading "+Intl.getLang()}>
                    {showMask == true ?
                        <SimulateMask {...Arg}/> : null
                    }
                    <div onClick={this.shareContent} className="panel-head-share pc-hide">{Intl.lang("Invite.share")}</div>
                    <div className="panel-head-top-title">{Intl.lang("mimic.panel.trading.4", '60')}</div>
                    <h1 className="panel-head-top-h1"><span>TDEx</span>{Intl.lang("mimic.panel.trading.5_")}</h1>
                    <p className="panel-head-top-p">{Intl.lang("mimic.panel.trading.5")}</p>
                    <div className="panel-head-top-time">{Intl.lang("mimic.panel.trading.6")}</div>
                    <div onClick={this.checkUserInfo} className="panel-head-top-btn">{Intl.lang("mimic.panel.trading.7")}</div>
                    <div className="panel-head-section">
                        <div className="panel-head-section-title">{Intl.lang("mimic.panel.trading.8")}</div>
                        <div className="panel-head-section-con">
                            <p>{Intl.lang("mimic.panel.trading.9",100)}</p>
                            <p>{Intl.lang("mimic.panel.trading.10")}</p>
                            <p>{Intl.lang("mimic.panel.trading.10_",5000)}</p>
                            <p>{Intl.lang("mimic.panel.trading.11")}</p>
                            <a className="panel-head-section-a" href="https://support.tdex.com/hc/zh-cn/articles/360015679551-%E6%A8%A1%E6%8B%9F%E7%9B%98%E6%B4%BB%E5%8A%A8%E7%BB%86%E5%88%99" target="_blank">{Intl.lang("mimic.panel.trading.12")}</a>
                        </div>
                    </div>
                    <div className="panel-head-section">
                        <div className="panel-head-section-title">{Intl.lang("mimic.panel.trading.13")}</div>
                        <div className="panel-head-section-flex">
                            {currencyList && currencyList.map((item, i) => {
                                return  <div key={i} className={"panel-section-flex-"+i}>
                                    <div className={"panel-section-flex-img img"+i}></div>
                                    <div className={"panel-section-flex-text panel-section-logo"+item.cur}>{item.amount}</div>
                                </div>
                            })}
                        </div>
                    </div>
                    <div className="panel-head-section hide">
                        <div className="panel-head-section-title">{Intl.lang("mimic.panel.trading.14")}</div>
                        <ul className="panel-section-ranking panel-section-ranking-con">
                            {rankTitle && rankTitle.map((item, i)=>{
                                return <li key={i}>{item}</li>
                            })}
                        </ul>
                        {rankMsg && rankMsg.map((item, i)=>{
                            return <ul key={i} className="panel-section-ranking-txt">
                                <li>
                                    {i == 0 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(i+1)+".png"}/>
                                    : i == 1 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(i+1)+".png"}/>
                                    : i == 2 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(i+1)+".png"}/>
                                    : <span>{i}</span>}</li>
                                <li>{item.user}</li>
                                <li>{item.curMoney}</li>
                            </ul>
                        })}
                        {(!rankMsg|| !rankMsg.length) && <p className="panel-section-ranking-none">{Intl.lang("common.not_open")}</p>}
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
                    <p className="panel-section-last-txt">{Intl.lang("activity.registered.15")}</p>
                </div>
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} />}
            </React.Fragment>
        )
    }
}

export default SimulateTrade;