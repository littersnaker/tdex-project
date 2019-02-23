import React from 'react';
import PureComponent from "../core/PureComponent";
import history from '../core/history';
import Intl from "../intl";
import Net from "../net/net";
import Event from "../core/event";
import GlobelStore from '../stores';

import BrowserOpen from "./BrowserOpen";
import BScroll from 'better-scroll'

import Decimal from '../utils/decimal';
import Clipboard from 'clipboard';
import { isMobile, checkAgent } from '../utils/util';
import {getStorage} from "../utils/util";
import {toast, Pagination} from "../utils/common";
import Pager from '../components/Pager';
import AccountModel from "../model/account";
import {CONST} from "../public/const";
import wxIocn from "../images/icons/mine-share-wx.png";
import Icon1 from "../images/icons/mine-share1.png";
import Icon2 from "../images/icons/mine-share2.png";
import Icon3 from "../images/icons/mine-share3.png";
import Icon4 from "../images/icons/mine-share4.png";

const WeChat = window.wx;
class ActivityTrading extends PureComponent {

    constructor(props) {
        super(props);

        this.shareContent = this.shareContent.bind(this);
        this.joinTrading = this.joinTrading.bind(this);

        this.wx = checkAgent().weixin;
        this.isMobile = isMobile();
        this.state = {
            isShare: false,
            showInvite: false,
            popDiv: false,
            isReceive: false,

            walletInfo:{},
            actInfo: {},
            popMsg: null
        }
    }
    componentWillUnmount() {
        this.inviteClipboard.destroy();
        if(this.clipboard) this.clipboard.destroy();

        super.componentWillUnmount();
    }
    componentWillMount(){
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
    }
    onUpdateWallet(){
        let money = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT,1);
        if(money){
            this.setState({walletInfo: money});
        }
    }
    componentDidMount() {
        this.copyInviteLink();

        if(this.isMobile){
            this.shareInit();
            this.setClipboard();
        }
        setTimeout(()=>{
            let uInfo = this.checkUserInfo();
            if(uInfo.Uid){
                this.claim("post");
                this.checkUserActivityInfo();
            }
            this.onUpdateWallet();
        }, 300);
    }
    checkUserActivityInfo(){
        Net.httpRequest("activity/userInfo", false, (data)=>{
            if (data.Status == 0){
                if(data.Data){
                    this.setState({actInfo:data.Data})
                }
            }
        }, this);
    }
    shareInit() {
        window._bd_share_config = {
            common: {
                'bdMini': 2,
                'bdSize': 16,
                "onBeforeClick": function (cmd, config) {
                    return {
                        "bdText": Intl.lang("activity.ActivityTrading.mobileShare1")+"\n"+Intl.lang("activity.ActivityTrading.mobileShare2"),
                        "bdUrl": "https://demo.tdex.com/activities/activityTrading"
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
    copyInviteLink(){
        let clipboard = new Clipboard('.copy_link_btn');
        clipboard.on('success', function(e) {
            toast(Intl.lang("Recharge.120"), 0, 1000);
        });
        clipboard.on('error', function(e) {
            console.log(e);
        });
        this.inviteClipboard = clipboard;
    }
    refreshUserInfo(){
        var uInfo = GlobelStore.getUserInfo();
        //uInfo.Demo = true;
        GlobelStore.setUserInfo(uInfo);
    }
    activateDemo(){
        Net.httpRequest("user/activateDemo", false, (data)=>{
            if (data.Status == 0){
                this.refreshUserInfo();
                this.setState({isReceive:true});
            }else if(data.Status == 10170){  // user full
                this.popOperating(3);
            }else if(data.Status == 11022){  // bind mobile
                this.popOperating(1);
            }else if(data.Status == 10171){
                this.setState({isReceive:false});
            }
        }, this);
    }
    joinTrading(uInfo){
        if(uInfo.Uid){
            if(this.state.isReceive){
                this.popOperating(4);
            }else{
                history.push('/trade');
            }
        }else{
            let param = { pathname: '/login',query:{'return_to':"activities/activityTrading"}};
            history.push(param);
        }
    }
    gotoBrowserOpen(){
        if(this.state.openNew){
            this.setState({openNew: false});
        }else {
            this.setState({openNew: true});
        }
    }
    claim(param){
        let method = param||"put";

        Net.httpRequest("activity/claim", false, (data)=>{
            if (data.Status == 0){
                if(method=="post"){
                    if(data.Data && data.Data.Result){
                        this.setState({isReceive: data.Data.Result});
                        this.popOperating(4);
                    }
                }else{
                    this.setState({isReceive: false});
                    this.popOperating(2)
                }
            }
        }, this, method);
    }
    checkIsJoinFull(){

    }
    receiveAsset(){
        var uInfo = GlobelStore.getUserInfo();
        if(!uInfo.Mobile){
            this.popOperating(1);
        }else{
            let {isReceive} = this.state;
            if(isReceive){
                this.claim();
            }
        }
    }
    popOperating(type){
        let msgArr = ["",
            {title : Intl.lang("activity.ActivityTrading.popTxt1_1"), subTitle:"", btnTxt: Intl.lang("activity.ActivityTrading.popTxt1_2"), onChange:()=>history.push("personal/modifyphone")},
            {title : Intl.lang("activity.ActivityTrading.popTxt2_1"), subTitle:Intl.lang("activity.ActivityTrading.popTxt2_3"), btnTxt: Intl.lang("activity.ActivityTrading.popTxt2_2"), onChange:()=>history.push("trade")},
            {title : Intl.lang("activity.ActivityTrading.popTxt3_1"), subTitle:Intl.lang("activity.ActivityTrading.popTxt3_3"), btnTxt: Intl.lang("activity.ActivityTrading.popTxt3_2"), onChange:()=>this.popView(false)},
            {title : Intl.lang("activity.ActivityTrading.afterBind1"), subTitle:"", btnTxt: Intl.lang("activity.ActivityTrading.receive"), onChange:()=>this.receiveAsset()}
        ];
        let msg = msgArr[type];
        msg.type = type;

        this.setState({popDiv:true, popMsg:msg});
    }
    receiveFirstAsset(){
        this.popView(false);
        this.receiveAsset();
    }
    popView(flag){
        this.setState({popDiv:flag})
    }
    viewInvite(flag){
        this.setState({showInvite:flag})
    }

    checkUserInfo() {
        var uInfo = GlobelStore.getUserData();
        if(uInfo && uInfo.Uid){
            return uInfo;
        }
        return false;
    }
    getCurrencyList(){
        return{
            1:[
                {cur:Intl.lang("activity.ActivityTrading.award1"), amount:' +30,000TD', Img:"awardImg1", Rank:"NO.1"},
                {cur:Intl.lang("activity.ActivityTrading.award2"), amount:' +20,000TD', Img:"awardImg1", Rank:"NO.2"},
                {cur:Intl.lang("activity.ActivityTrading.award3"), amount:' +10,000TD', Img:"awardImg2", Rank:"NO.3"}
            ],
            2:[
                {cur:'iPhone X 64GB', amount:' +5,000TD', Img:"awardImg3", Rank:"NO.4 ~ 5"},
                {cur:'iPad 32GB', amount:' +3,000TD', Img:"awardImg4", Rank:"NO.6 ~ 10"},
                {cur:Intl.lang("activity.ActivityTrading.award4"), amount:' +2,000TD', Img:"awardImg5", Rank:"NO.11 ~ 30"},
                {cur:Intl.lang("activity.ActivityTrading.award4"), amount:' +1,000TD', Img:"awardImg5", Rank:"NO.31 ~ 50"}
            ]
        }

    }
    render() {
        const { isShare, openNew, showInvite, popDiv, popMsg, isReceive, actInfo, walletInfo={} } = this.state;
        const currencyList = this.getCurrencyList(), uInfo = this.checkUserInfo(), Lang = Intl.getLang();
        const logoList = [
            'http://demo.bizhijia.com/index.html',
            'https://www.ihuoqiu.com',
            'https://bihu.com',
            'http://www.readblocks.com',
            'https://www.chainfor.com',
            'https://www.blockob.com/',
            'http://www.queding.cn',
            'https://www.jianshu.com',
            'https://www.zdpvt.com/',
            'https://www.xnb.la/',
            'https://www.lieyuncj.com',
            'http://www.qkzj.com/'
        ];
        let assetBTC = "";
        if(uInfo){
            var inviteLink = window.location.origin + "/register?ref=" + uInfo.Uid +"&activityId=1005";
            assetBTC = Decimal.format(walletInfo.net||0, 4);
        }

        return (
            <React.Fragment>
                <div className={"trading-contest trading-demo2 "+Lang}>
                    <div className={"trading-bg trading-bg-"+Lang}>
                        <div onClick={this.shareContent} className="panel-head-share pc-hide">{Intl.lang("Invite.share")}</div>
                        <div onClick={()=>this.joinTrading(uInfo)} className="trading-demo2-go">{Intl.lang("activity.TradingContest.tet7")}</div>
                    </div>
                    {uInfo ?
                        this.isMobile?
                        <div>
                            {isReceive ?
                                <div className="receive-btn" onClick={()=>this.receiveAsset()}>{Intl.lang("activity.ActivityTrading.receive2")}</div>
                                :
                                <div className="receive-btn btnDis curs-not">{Intl.lang("activity.ActivityTrading.tomorrow")}</div>
                            }
                            <div className="receive-asset panel-receive-view">
                                <div className="receive-user-info">
                                    <p><label>{Intl.lang("activity.ActivityTrading.receive3")}</label><span>{assetBTC||'--'}</span></p>
                                    <p><label>{Intl.lang("activity.ActivityTrading.receive4")}</label><span>{actInfo.Rank||"--"}</span></p>
                                    <p onClick={()=>this.viewInvite(true)}><label>{Intl.lang("activity.ActivityTrading.receive6")}</label><span>{actInfo.Award||"--"}</span></p>
                                </div>
                                <input className="mine-trade-share-input" type="text" id="copy_invit_text" defaultValue={inviteLink} readOnly="readonly"/>
                                <div className="receive-invite-info">
                                    <p><label>{Intl.lang("activity.ActivityTrading.receive5")+Intl.lang("common.symbol.colon")}</label><span>{actInfo.Slave||"--"}</span></p>
                                    <p><span className="copy-btn copy-bd copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_invit_text">{Intl.lang("activity.registered.btn")}</span></p>
                                </div>
                            </div>
                        </div>
                        :
                        <div className="receive-asset panel-receive-view">
                            <div>
                                <p className="fs22">{Intl.lang("activity.ActivityTrading.receive1","0.5BTC")}</p>
                                <p><label>{Intl.lang("activity.ActivityTrading.receive2")}</label></p>
                                {isReceive ?
                                    <div className="receive-btn" onClick={()=>this.receiveAsset()}>{Intl.lang("activity.buy_1")}</div>
                                    :
                                    <div className="receive-btn btnDis curs-not">{Intl.lang("activity.ActivityTrading.tomorrow")}</div>
                                }
                            </div>
                            <div>
                                <p><label>{Intl.lang("activity.ActivityTrading.receive3")+Intl.lang("common.symbol.colon")}</label><span>{assetBTC||'--'}</span></p>
                                <p><label>{Intl.lang("activity.ActivityTrading.receive4")+Intl.lang("common.symbol.colon")}</label><span>{actInfo.Rank||"--"}</span></p>
                                <input className="mine-trade-share-input" type="text" id="copy_invit_text" defaultValue={inviteLink} readOnly="readonly"/>
                                <p><label>{Intl.lang("activity.ActivityTrading.receive5")+Intl.lang("common.symbol.colon")}</label><span>{actInfo.Slave||"--"}</span><span className="copy-btn copy-bd copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_invit_text">{Intl.lang("activity.registered.btn")}</span></p>
                                <p><label>{Intl.lang("activity.ActivityTrading.receive6")+Intl.lang("common.symbol.colon")}</label><span>{actInfo.Award||"--"}</span><span className="copy-btn" onClick={()=>this.viewInvite(true)}>{Intl.lang("activity.ActivityTrading.receive7")} >></span></p>
                            </div>
                        </div>
                        :
                        <div className="receive-asset login-btn-pos">
                            <div className="my-interests-btn"><a href="/login?return_to=activities/activityTrading">{Intl.lang("activity.ActivityTrading.receive8")}</a></div>
                        </div>
                    }
                    <div className="panel-detail-section">
                        <div className="award-section-title"><span>{Intl.lang("mimic.panel.trading.13")}</span></div>
                        <div className="award-section-detail flex-tc">
                            {currencyList && currencyList[1].map((item, i) => {
                                return  <div key={i} className={"ml award-section-item-"+i}>
                                    <div className="award-rank">{item.Rank}</div>
                                    <div className={"trading-contest-flex-img "+item.Img}></div>
                                    <p className="trading-contest-flex">{item.cur}</p>
                                    <p className="trading-contest-flex mb-30">{item.amount}</p>
                                </div>
                            })}
                        </div>
                        <div className="award-section-detail flex-jc">
                            {currencyList && currencyList[2].map((item, i) => {
                                return  <div key={i}>
                                    <div className="award-rank">{item.Rank}</div>
                                    <div className={"trading-contest-flex-img "+item.Img}></div>
                                    <p className="trading-contest-flex">{item.cur}</p>
                                    <p className="trading-contest-flex mb-30">{item.amount}</p>
                                </div>
                            })}
                        </div>
                    </div>
                    <ContestRank />
                    <div className="panel-detail-section demo2-media">
                        <div className="award-section-title"><span>{Intl.lang("activity.TradingContest.media")}</span></div>
                        <div className="media-support-section media-support-iconBox">
                            {logoList && logoList.map((item, i)=>{
                                return <a key={i} href={item} target="_blank"><i className={"media"+i}></i></a>
                            })}
                        </div>
                    </div>
                    <div className="panel-detail-section">
                        <div className="award-section-title"><span>{Intl.lang("mimic.panel.trading.8")}</span></div>
                        <div className="panel-head-section-con rule-bg">
                            <p>{Intl.lang("activity.ActivityTrading.rank.rule")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.rank.rule1")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.rank.rule2")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.rank.rule3")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.rank.rule4")}</p>
                            <br/>
                            <p>{Intl.lang("activity.ActivityTrading.invite.rule")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.invite.rule1")}</p>
                            <br/>
                            <p>{Intl.lang("activity.ActivityTrading.reset.rule")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.reset.rule1")}</p>
                            <br/>
                            <p>{Intl.lang("activity.ActivityTrading.share.rule")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.share.rule1")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.share.rule2")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.share.rule3")}</p>
                            <br/>
                            <p>{Intl.lang("activity.ActivityTrading.rule.des")}</p>
                            <p>{Intl.lang("activity.ActivityTrading.rule.contact")}</p>
                            <p>{Intl.lang("activity.registered.15")}</p>
                            <a className="panel-rule-link-a" href={"https://support.tdex.com/hc/"+Intl.getLang()+"/articles/360018762332"} target="_blank">{Intl.lang("mimic.panel.trading.12")}</a>
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
                </div>
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} content={Intl.lang("activity.ActivityTrading.wxShare")} />}

                {(showInvite || popDiv) && <div className="mask act-mask-bg"></div>}
                {showInvite && <div className="panel-invite-award">
                    <div className="closeBox normal-head"><span className="iconfont icon-close" onClick={()=>this.viewInvite(false)}></span></div>
                    <InviteAward />
                </div>
                }
                {popDiv && <div className="pop-div">
                    <div className="closeBox normal-head"><span className="iconfont icon-close" onClick={()=>this.popView(false)}></span></div>
                    <PopPanel msg={popMsg}/>
                </div>}
            </React.Fragment>
        )
    }
}

export default ActivityTrading;

class ContestRank extends PureComponent {
    constructor(props) {
        super(props);

        this.RankScroll = null;
        // this.loadCount = 0;
        this.mounted = true;
        this.state = {
            updateTime:'--:--:--',
            showRank: false,
            rankList:{List: [], Page:0, PageCount:0} //最新成交
        };
    }
    componentWillUnmount(){
        this.mounted = false;
        if (this.RankScroll){
            this.RankScroll.destroy();
            this.RankScroll = null;
        }
    }
    componentWillMount(){
        this.getHistory();
    }
    componentDidUpdate(){
        this._initBScroll();
    }
    _initBScroll(){
        if(!this.state.showRank || this.RankScroll) return false;
        setTimeout(()=>{
            this.RankScroll = new BScroll(this.wrapper,{
                startY:0,
                scrollbar:true,
                pullUpLoad: {
                    threshold: -30,
                    moreTxt: "Load more",
                    noMoreTxt: "There is no more data"
                },
                mouseWheel: {
                    speed: 20,
                    invert: false,
                    easeTime: 300
                }
            });
            this.RankScroll.on('pullingUp', () => {
                // 下拉动作
                //console.log('load more'+this.state.rankList.Page+","+this.state.rankList.PageCount);
                if(this.state.rankList.Page<this.state.rankList.PageCount){
                    if (this.mounted)this.setState({rankList:this.pageFunc(this.state.rankList.Page+1)}, ()=>{
                        this.RankScroll.refresh();
                    });
                    this.RankScroll.finishPullUp();
                }else{
                    this.RankScroll.closePullUp();
                }
            })
        },200);
    }
    getHistory(){
        // var self = this;
        Net.httpRequest("activity/rank", "", (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                if(Info.List && Info.List.length){
                    this.pageFunc = Pagination(Info.List, 10, true);
                    this.setState({rankList:this.pageFunc(1), showRank:Info.List.length>0, updateTime:Info.UpdateTime});
                }
            }
        }, this);
    }

    render(){
        const {showRank, rankList, updateTime} = this.state;
        const self = this;
        return (
            showRank?
                <div className="panel-detail-section">
                    <div className="award-section-title"><span>{Intl.lang("mimic.panel.trading.14")}</span></div>
                    <p className="fs12 mt-20 m-hide"><span>{Intl.lang("activity.TradingContest.update")}{Intl.lang("common.symbol.colon")}{updateTime}</span></p>
                    <div className="panel-section-rank-detail">
                        <ul className="panel-section-ranking demo2-rank">
                            <li>{Intl.lang("mimic.panel.trading.1")}</li>
                            <li>{Intl.lang("activity.TradingContest.uid")}</li>
                            <li>{Intl.lang("mimic.panel.trading.3")}</li>
                        </ul>
                        <div className="wrapper h-300" ref={el=> this.wrapper=el} style={{overflow:'hidden'}}>
                            <div className="content">
                        {rankList.List && rankList.List.map((item, i)=>{
                            return <ul key={item.Rank} className="panel-section-ranking-txt demo2-ranking-list">
                                <li>
                                    {item.Rank == 1 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(item.Rank)+".png"}/>
                                        : item.Rank == 2 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(item.Rank)+".png"}/>
                                        : item.Rank == 3 ? <img src={process.env.PUBLIC_URL + "/images/activities/simulatetrade/mock-ranking-list"+(item.Rank)+".png"}/>
                                        : <span>{item.Rank}</span>}</li>
                                <li>{item.Uid}</li>
                                <li>{Decimal.format(item.Assets,4) +" BTC"}</li>
                            </ul>
                        })}
                            </div>
                        </div>
                    </div>
                    <span className="fs12 tc pdt-10 dis-inb pc-hide">{Intl.lang("activity.TradingContest.update")}{Intl.lang("common.symbol.colon")}{updateTime}</span>
                </div>
                :null
        )
    }
}

class InviteAward extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            curPage: 1,
            activityData:""
        };
    }
    componentWillMount(){
        this.getHistory();
    }
    getHistory(page){
        var curPage = page || this.state.curPage;
        Net.httpRequest("activity/invite", {Page:curPage, PageSize:10}, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                if(Info){
                    this.setState({activityData:Info, curPage:Info.Page});
                }
            }
        }, this);
    }
    turnPage(page){
        this.getHistory(page);
    }
    render(){
        const { activityData } = this.state;
        return(
            <div className="invite-income">
                <table className="invite-table" cellPadding="0" cellSpacing="0">
                    <thead>
                        <tr>
                            <th>{Intl.lang("activity.ActivityTrading.invite1")}</th><th>{Intl.lang("activity.ActivityTrading.invite2")}</th>
                        </tr>
                    </thead>
                    <tbody>
                    {(activityData.hasOwnProperty("Total") && activityData.Total > 0) && activityData.List.map((item, index) => {
                        return <tr key={index}>
                            <td>{item.Email}</td>
                            <td>{item.Time}</td>
                        </tr>
                    })}
                    </tbody>
                </table>
                {(activityData.hasOwnProperty("PageCount") && activityData.PageCount > 1) &&
                <Pager className="pd-15" data={activityData} onChange={this.turnPage.bind(this)}/>
                }
            </div>
        )
    }
}

class PopPanel extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
        };
    }
    goToNext(){
        this.props.msg.onChange();
    }

    render(){
        const { msg } = this.props;
        return(
            <div className="pop-detail">
                <div className={"pop-icon"+msg.type}></div>
                <div className="pop-title">{msg.title}</div>
                <div className="pop-title-sub">{msg.subTitle}</div>
                <div className="pop-btn" onClick={()=>this.goToNext()}>{msg.btnTxt}</div>
            </div>
        )
    }
}
