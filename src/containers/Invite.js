import React from 'react';
import PureComponent from '../core/PureComponent'
import Intl from '../intl'
import ShareMore from '../components/ShareMore';
import Net from '../net/net'
import AuthModel from '../model/auth';
import QRCode from 'qrcode.react'
import {getCurrencySymbol, toast} from "../utils/common"
import Pager from '../components/Pager'
import CreatePoster from '../components/CreatePoster';
import MobileHeader from '../components/MobileHeader';
import Icon1 from "../images/icons/mine-share1.png";
import Icon2 from "../images/icons/mine-share2.png";
import Icon3 from "../images/icons/mine-share3.png";
import Icon4 from "../images/icons/mine-share4.png";
import wxIocn from '../images/icons/mine-share-wx.png';
import '../less/minetrade.less';
import Clipboard from 'clipboard';
import { checkAgent } from '../utils/util';
import BrowserOpen from "../components/BrowserOpen";
import Decimal from "../utils/decimal";


class Invite extends PureComponent {
    constructor(props) {
        super(props);
        this.isMobile = props.isMobile;
        this.isLogin = false;
        this.wx = checkAgent().weixin;
        this.state = {
            viewInfo:{},
            inLink: window.location.origin + "/register?ref=" + props.uInfo.Uid,
            showPoster: false,
            rankingTab: 0,
            isShare: false,
            openNew: false
        }
    }
    componentWillMount(){
        var uInfo = AuthModel.getRegisterData();
        if(uInfo && uInfo.Uid){
            this.isLogin = true;
            //var newLink = window.location.origin + "/register?ref=" + uInfo.Uid;
            //this.setState({inLink:newLink, Uid: uInfo.Uid});
            this.getInviteView();
        }
    }
    componentDidMount() {
    	document.documentElement.scrollTop = 0;
        var clipboard = new Clipboard('.copy_link_btn');
        clipboard.on('success', function(e) {
            toast(Intl.lang("Recharge.120"), 0, 1000);
        });
        clipboard.on('error', function(e) {
            console.log(e);
        });
        this.clipboard = clipboard;

        //if(this.isLogin) this.getInviteView();
    }
    componentWillUnmount(){
        this.clipboard.destroy();
    }
    getInviteView(){
        var self = this;
        Net.httpRequest("invite/view", false, (data)=>{
            if (data.Status == 0){
                self.setState({viewInfo:data.Data, inLink:data.Data.Link});

                this.shareInit(data.Data.Link);
            }else{

            }
        }, this);
    }
    createPoster(){
        this.setState({showPoster: !this.state.showPoster})
    }
    closePoster(){
        this.createPoster();
    }
    changeRankingTab(tab) {
        if (tab != this.state.rankingTab) {
            this.setState({rankingTab: tab});
        }
    }
    changeShare(){
        if (this.state.isShare) {
            this.setState({ isShare: false })
        } else {
            this.setState({ isShare: true })
        }
    }
    shareInit(shareLink) {
        window._bd_share_config = {
            common: {
                'bdMini': 2,
                'bdSize': 16,
                "onBeforeClick": function (cmd, config) {
                    return {
                        "bdText": Intl.lang('trading.dig.33'),
                        "bdUrl": shareLink
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
    gotoBrowserOpen(){
        if(this.state.openNew){
            this.setState({openNew: false});
        }else {
            this.setState({openNew: true});
        }
    }
    render(){
        const {viewInfo, showPoster, inLink, rankingTab, isShare, openNew} = this.state, { uInfo, isMobile } = this.props;
        const inviteLink = viewInfo.Link || inLink, Uid = uInfo.Uid;
        var Ranks = [{Email:"--",Award:"--"},{Email:"--",Award:"--"},{Email:"--",Award:"--"}];
        if(viewInfo.Rank){
            if(viewInfo.Rank.length>2){
                Ranks = viewInfo.Rank;
            }else{
                for(var i in Ranks){
                    if(viewInfo.Rank[i]){
                        Ranks[i] = viewInfo.Rank[i];
                    }
                }
            }
        }
        const Lang = Intl.getLang();
        const rankTitle = [Intl.lang("Invite.first_place"),Intl.lang("Invite.second_place"),Intl.lang("Invite.third_place")];
        const mRanking = [Intl.lang("Invite.log"), Intl.lang("Invite.reward_log")];
        const ruleMap = [Intl.lang("Invite.rules_new1", 20),Intl.lang("Invite.rules_new2"), Intl.lang("Invite.rules_new3"), Intl.lang("Invite.rules_new4"), Intl.lang("Invite.rules_new5")];
        return(
            showPoster?
                <CreatePoster className="poster-box" uid={Uid} link={inviteLink} onClick={()=>this.closePoster()} />
                :
                !this.isMobile ?
            <div className="inside-page-web back">
                <div className={"invite-banar-bg "+Intl.getLang()}></div>
                <div className="inside-web-part">
                    <div className="invite-double-page invite-ranking-list">
                        {Ranks && Ranks.map((item, index)=>{
                            return <ul key={index}>
                                <li>
                                    <img src={process.env.PUBLIC_URL+"/images/invite/invite-ranking"+ (index+1) +".png"} alt=""/>
                                </li>
                                <li>
                                    <p>{rankTitle[index]}</p>
                                    <h3>{item.Email || '--'}</h3>
                                </li>
                                <li>
                                    <p>{Intl.lang("Invite.got_reward")}</p>
                                    <h3>{item.Award} TD</h3>
                                </li>
                            </ul>
                        })}
                    </div>
                    <div className="invite-double-page invite-share-data">
                        <div className="user-share-data">
                            <div className="user-share-qr">
                                <QRCode value={inviteLink} size={120} />
                            </div>
                            <div className="share-data-config">
                                <p>{Intl.lang("m.Invite.rank.text.2")}{Intl.lang("common.symbol.colon")}<span className="share-text">{Uid}</span></p>
                                <p>
                                    {Intl.lang("Invite.link")}{Intl.lang("common.symbol.colon")}
                                    <span><input className="" id="copy_invit_text" value={inviteLink} readOnly="readonly"/></span>
                                    <span className="copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_invit_text">
                                        <i className="iconfont icon-copy"></i>
                                    </span>
                                </p>
                                <div>{Intl.lang("Invite.share")}{Intl.lang("common.symbol.colon")}<ShareMore userInfo={uInfo} styleObject={{display: 'inline-block', verticalAlign: 'middle', marginLeft:12}}/></div>
                            </div>
                        </div>
                        <div className="user-share-data share-friend-data">
                            <div>
                                <img src={process.env.PUBLIC_URL+"/images/invite/share-friend.png"}/>
                                <p>{Intl.lang("Invite.friends")}</p>
                                <h5>{viewInfo.Affiliates||0}</h5>
                            </div>
                            <div>
                                <img src={process.env.PUBLIC_URL+"/images/invite/share-friend-td.png"}/>
                                <p>{Intl.lang("Invite.can_got")}</p>
                                <h5>{viewInfo.Award || 0}</h5>
                            </div>
                        </div>
                    </div>
                    <div className="invite-double-page invite-ranking-list">
                        <InviteList isLogin={this.isLogin}/>
                        <InviteReward isLogin={this.isLogin} />
                    </div>
                    <div className="invite-double-page">
                        <div className="invite-footer-list">
                            <h3>{Intl.lang("Invite.rules")}</h3>
                            <ul>
                                {ruleMap.map((v,i)=>{
                                    return <li key={"rule"+i}>{v}</li>
                                })}
                            </ul>
                            <div>
                                <p>* {Intl.lang("Invite.notes")}</p>
                                <p>{Intl.lang("Invite.notes_1")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            :
            <div className="" >
                <MobileHeader title={Intl.lang("Footer.invite")}/>
                <div className={"m-invite-header m-content-g "+Lang}>
                    {/*<p>{Intl.lang("activity.registered.20", 20)}</p>*/}
                    {/*<div className="m-invite-head-f">*/}
                        {/*<div>{Intl.lang("m.Invite.head.text.1")}</div>*/}
                        {/*<div>{Intl.lang("m.Invite.head.text.2")}</div>*/}
                        {/*<div>{Intl.lang("m.Invite.head.text.3")}</div>*/}
                        {/*<div className="gold-line"></div>*/}
                    {/*</div>*/}
                </div>
                <div className="m-invite-content">
                    <div className="m-invite-section">
                        <h4>{Intl.lang("m.Invite.rank.text.1")}</h4>
                        <div className="invite-recommended invite-rec-nub">
                            <div>
                                <p>{viewInfo.Affiliates||0}</p>
                                <p>{Intl.lang("Invite.friends")}</p>
                            </div>
                            <div>
                                <p>{viewInfo.Award || 0} TD</p>
                                <p>{Intl.lang("Invite.can_got")}</p>
                            </div>
                        </div>
                        <div className="invite-recommended invite-nvitation-qr">
                            <div>
                                <p>{Intl.lang("m.Invite.rank.text.2")}:<input id="copy-referees-text" type="text" defaultValue={Uid} /></p>
                            </div>
                            <div>
                                <p className="invite-rec-p copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy-referees-text">{Intl.lang("m.Invite.rank.text.3")}</p>
                            </div>
                        </div>
                    </div>
                    <div className="m-invite-section">
                        <h4>{Intl.lang("m.Invite.rank.text.5")}</h4>
                        {Ranks.map((item, index)=>{
                            return <div key={index} className="invite-recommended invite-ranking-line">
                                <div className="m-invite-ranking">
                                    <p><span className="invite-ranking-icon"><img src={process.env.PUBLIC_URL+"/images/invite/invite-ranking"+ (index+1) +".png"} /></span><span>{item.Email || '--'}</span></p>
                                </div>
                                <div className="m-invite-ranking">
                                    <p className="tc dis-b">{item.Award} TD</p>
                                </div>
                            </div>
                        })}
                    </div>
                    <div className="m-invite-tab">
                        <ul className="m-invite-tab-list">
                            {mRanking && mRanking.map((item, i) => {
                                return <li key={i} onClick={() => this.changeRankingTab(i)} className={rankingTab == i ? "active" : ""}>{item}</li>
                            })}
                        </ul>
                        {rankingTab == 0 ?
                            <div className="invite-rebate-cont">
                                <InviteList isLogin={this.isLogin}/>
                            </div>
                        :rankingTab == 1 ?
                            <div className="invite-rebate-cont">
                                <InviteReward isLogin={this.isLogin} />
                            </div>
                        :null}
                    </div>
                    <div className="m-invite-section">
                        <h4>{Intl.lang("Invite.rules")}</h4>
                        <ul className="m-invite-footer pdl-20">
                            {ruleMap.map((v,i)=>{
                                return <li key={"rule"+i}>{v}</li>
                            })}
                        </ul>
                    </div>
                    <div className="m-invite-foot-p"><p>{Intl.lang('activity.registered.15')}</p></div>
                </div>
                <div className="invite-btn-box">
                    <button onClick={this.createPoster.bind(this)}>{Intl.lang("m.Invite.rank.text.7")}</button>

                    <button onClick={this.changeShare.bind(this)}>{Intl.lang("m.Invite.rank.text.4")}</button>
                </div>
                <div className="mine-trade-share" style={{ bottom: isShare ? '0' : '-700px' }}>
                    <div className="invite-trade-share">
                        <p>{Intl.lang("m.Invite.rank.text.2")}</p>
                        <p><input id="copy-referees-text2" type="text" defaultValue={Uid} /><button className="copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy-referees-text2">{Intl.lang("m.Invite.rank.text.6")}</button></p>
                        <div className="invite-trade-share-qr">
                            <QRCode value={inviteLink} size={100} />
                        </div>
                    </div>
                    <input className="mine-trade-share-input" type="text" id="copy-share-text" defaultValue={inviteLink} />
                    <div className="bdsharebuttonbox">
                        <a href="javascript:;" className="share-item copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy-share-text">
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
                    <div className="mine-trade-share-colse" onClick={this.changeShare.bind(this)}>{Intl.lang('mining.status0')}</div>
                </div>
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} content={Intl.lang("Invite.toWX")} />}

            </div>
            )
    }
}
export default Invite;

class InviteList extends PureComponent{
    constructor(props) {
        super(props);
        this.state = {
            curPage: 1,
            historyList:{List: [], PageSize: 5}
        }
    }

    componentDidMount(){
        this.getInviteList(1);
    }

    getInviteList(page){
        var curPage = page || this.state.curPage;

        ////test Code
        // var info = {
        //    List:[{Commision:10,Email:"Ter***@**.com",Time:"2018-5-10 08:12:35"},{Commision:8,Email:"HeQ***@**.com",Time:"2018-5-10 18:32:56"},
        //        {Commision:12,Email:"Liu***@**.com",Time:"2018-5-11 11:46:02"},{Commision:15,Email:"bob***@**.com",Time:"2018-5-11 20:05:13"},
        //        {Commision:16,Email:"Xio***@**.com",Time:"2018-5-13 14:23:58"}],
        //    Page:page||1,
        //    PageCount:3,
        //    PageSize: 5,
        //    Total : 15
        // };
        //this.setState({historyList:info});
        //return ;

        var self = this;
        Net.httpRequest("invite/list", {Page:curPage, PageSize:5}, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                self.setState({historyList:Info, curPage:Info?Info.Page:curPage});
            }else{

            }
        }, this);
    }
    turnPage(page){
        this.getInviteList(page);
    }
    render(){
        const {historyList} = this.state;
        return(
            <div className="title-data-list invite-data-list">
                <div className="list-header-text">
                    <h3>{Intl.lang("Invite.log")}</h3>
                </div>
                <div className="list-global-config">
                    <ul className="list-config-title">
                        <li>{Intl.lang("accountSafe.1_102")}</li>
                        <li>{Intl.lang("accountSafe.2_142")}</li>
                    </ul>
                    {(historyList && historyList.List && historyList.List.length) ?
                        historyList.List.map((item, index) => {
                            return <ul className="list-config-content" key={index}>
                                <li>{item.Time}</li>
                                <li>{item.Email}</li>
                            </ul>
                        })
                        : <div className="no-list-data back show-5">
                            <div className="no-list-data-pic">
                            </div>
                            <p>{Intl.lang("bank.1_27")}</p>
                        </div>
                    }
                    {(historyList && historyList.hasOwnProperty("PageCount") && historyList.PageCount > 1) &&
                        <Pager className="public-pages-config" data={historyList} onChange={this.turnPage.bind(this)} />
                    }
                </div>
            </div>
        )
    }
}

class InviteReward extends PureComponent{
    constructor(props) {
        super(props);
        this.state = {
            curPage: 1,
            historyList:{List: [], PageSize: 5}
        }
    }

    componentDidMount(){
        this.getInviteAward(1);
    }

    getInviteAward(page){
        var curPage = page || this.state.curPage;

         //test Code

        //this.setState({historyList:info});
        //return ;

        var self = this;
        Net.httpRequest("invite/award", {Page:curPage, PageSize:5}, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                console.log(Info);
                self.setState({historyList:Info, curPage:Info?Info.Page:curPage});
            }else{

            }
        }, this);
    }
    turnPage(page){
        this.getInviteAward(page);
    }
    getCommission(item){
        let commiss = 0;
        try {
            commiss = Decimal.round(item.Amount, 4);
        }catch (e){
            console.log(e);
        }
        return commiss || "--";
    }
    render(){
        const {historyList} = this.state;
        var self = this;
        return(
            <div className="title-data-list invite-data-list">
                <div className="list-header-text">
                    <h3>{Intl.lang("Invite.reward_log")}</h3>
                </div>
                <div className="list-global-config">
                    <ul className="list-config-title">
                        <li>{Intl.lang("Invite.reward")}</li>
                        <li>{Intl.lang("accountSafe.2_142")}</li>
                        <li>{Intl.lang("accountSafe.1_102")}</li>
                    </ul>
                    {((historyList && historyList.List) && historyList.List.length) ?
                        historyList.List.map((item, index) => {
                            let commiss = self.getCommission(item);
                            return <ul className="list-config-content" key={index}>
                                <li>{commiss}</li>
                                <li>{item.Email}</li>
                                <li>{item.CreateTime.substring(0, 16)}</li>
                            </ul>
                        })
                        : <div className="no-list-data back show-5">
                            <div className="no-list-data-pic"></div>
                            <p>{Intl.lang("bank.1_27")}</p>
                        </div>
                    }
                    {(historyList && historyList.hasOwnProperty("PageCount") && historyList.PageCount > 1) &&
                        <Pager className="public-pages-config" data={historyList} onChange={this.turnPage.bind(self)}/>
                    }
                </div>
            </div>
        )
    }
}
