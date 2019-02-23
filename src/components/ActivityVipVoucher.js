import Intl from '../intl';
import React from 'react';
import PureComponent from "../core/PureComponent";
import { Link } from 'react-router';
import history from '../core/history';
import Net from '../net/net';
import { checkAgent, isMobile } from "../utils/util";
import Auth from '../model/auth'
import Clipboard from 'clipboard';
import BrowserOpen from "./BrowserOpen";
import Icon1 from "../images/icons/mine-share1.png";
import wxIocn from "../images/icons/mine-share-wx.png";
import Icon2 from "../images/icons/mine-share2.png";
import Icon3 from "../images/icons/mine-share3.png";
import Icon4 from "../images/icons/mine-share4.png";
import { toast } from "../utils/common";
import System from '../model/system';

export default class ActivityVipVoucher extends PureComponent {
    constructor(props) {
        super(props);

        this.clipboard = null;
        this.Items = null;
        this.isOpen = 1;
        this.wx = checkAgent().weixin;
        this.isMobile = isMobile();

        this.state = {
            isPop: false,
            openNew: false,
            isShare: false,
        }
    }

    componentWillUnmount(){
        super.componentWillUnmount();
        this.clipboard = null;
    }
    componentWillReceiveProps(nextProps){
        if(this.props.uInfo.Items != nextProps.uInfo.Items){
            this.Items = this.getUserItem(nextProps.uInfo, true);
            this.setState({login:!this.state.login});
        }
    }
    componentDidMount(){
        this.Items = this.getUserItem();
        this.compareTime();
        if(this.isMobile){
            this.shareInit();
            this.setClipboard();
        }
    }
    getUserItem(userInfo, flag){
        if(this.Items) return this.Items;

        const uInfo = flag ? userInfo : this.props.uInfo;
        if(uInfo && uInfo.Items){
            for(var i in uInfo.Items){
                if(uInfo.Items[i].Name=="vip3"){
                    return uInfo.Items[i];
                }
            }
        }
    }
    compareTime() {
        var pcTime = Date.parse(new Date())/1000;
        var nowTime = parseInt(System.getServerTimeStamp());
        var fixTime = pcTime - nowTime;

        var stTimes = Date.parse(new Date("2019-01-02 14:00:00"))/1000 - fixTime;
        var endTime = Date.parse(new Date("2019-01-16 23:59:59"))/1000 - fixTime;

        var flag = 1;
        if(nowTime < stTimes){
            flag = 2;
        }else if(nowTime > endTime){
            flag = 3;
        }
        this.isOpen = flag;
    }
    getUserClaim(){
        const item = this.getUserItem();
        if(item){
            Net.httpRequest("user/claim", {Name:item.Name}, (data)=>{
                if (data.Status == 0){
                    Auth.refreshUerInfo();
                    this.Items = null;
                    this.isOpen = 1;
                    this.setState({isPop:true});
                }
            }, this);
        }
    }

    toggle(){
        this.setState({isPop:!this.state.isPop});
    }

    gotoBrowserOpen = () => {
        if(this.state.openNew){
            this.setState({openNew: false});
        }else {
            this.setState({openNew: true});
        }
    };

    setClipboard = () => {
        this.clipboard = new Clipboard('.copy-link-share');
        this.clipboard.on('success', () => {
            this.shareContent();
            toast(Intl.lang("Recharge.120"), 0, 1000)
        });
        this.clipboard.on('error', (error) => {
            console.log(error);
        });
    };

    shareContent = () => {
        this.setState({ isShare: !this.state.isShare })
    };

    shareInit = () => {
        window._bd_share_config = {
            common: {
                'bdMini': 2,
                'bdSize': 16,
                "onBeforeClick": function (cmd, config) {
                    return {
                        "bdText": Intl.lang('Receive.VIP3.text'),
                        "bdUrl": window.location.origin
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
    };
    gotoTrade(){
        history.replace('/trade');
    }
    render(){
        const { isPop, openNew, isShare } = this.state, { uInfo } = this.props;
        const curLang = Intl.getLang();

        return (
            <React.Fragment>
                <div className="vipVoucher">
                    <div className={"voucherBg-"+ curLang}>
                        {uInfo.Uid?
                            this.Items?
                                <div className="voucherBtn">
                                    <button onClick={this.getUserClaim.bind(this)}>{Intl.lang("activity.buy_1")}</button>
                                </div>
                                :
                                <div className="voucherBtn">
                                    <button className="btnDis">{this.isOpen==2?Intl.lang("scoreRew.please_wait"):this.isOpen==3?Intl.lang("activity.Status1"):Intl.lang("activity.ActivityTrading.tomorrow")}</button>
                                </div>
                                :
                            <div className="voucherBtn">
                                <Link to="/login?return_to=/activities/vipVoucher">{Intl.lang("Login.100")}</Link>
                            </div>
                        }
                        <div className="m-or-more">
                            <div className="voucherMore">
                                <Link to="/personal/viprights">{Intl.lang("activity.vipVoucher.vipMore")}</Link><i className="iconfont icon-arrow-l" />
                            </div>
                        </div>
                        <div className="voucherRule">
                            <ul>
                                <li>{Intl.lang("activity.vipVoucher.rule1")}</li>
                                <li>{Intl.lang("activity.vipVoucher.rule2")}</li>
                                <li>{Intl.lang("activity.vipVoucher.rule3")}</li>
                                <li>{Intl.lang("activity.vipVoucher.rule4")}</li>
                                <li>{Intl.lang("activity.vipVoucher.rule5")}</li>
                                <li>{Intl.lang("activity.vipVoucher.rule6")}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                {isPop &&
                <div className="luck-draw-mask">
                    <div className="vipVoucherPop">
                        <span className="iconfont icon-cancel" onClick={this.toggle.bind(this)}></span>
                        <div className="voucher-header">{Intl.lang("activity.vipVoucher.popHead")}</div>
                        <div className="voucher-title">{Intl.lang("activity.vipVoucher.popTitle")}</div>
                        <div className="voucher-pop-bg"></div>
                        <div className="voucher-pop-btn" onClick={this.gotoTrade.bind(this)}>{Intl.lang("contract.online.text9")}</div>
                    </div>
                </div>}
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
                <div onClick={this.shareContent} className="panel-head-share pc-hide">{Intl.lang("Invite.share")}</div>
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} content={Intl.lang("activity.ActivityTrading.wxShare")} />}
            </React.Fragment>
        )
    }
}