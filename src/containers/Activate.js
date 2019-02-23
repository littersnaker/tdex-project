import Intl from '../intl';
import React from 'react';
//import { Link } from 'react-router';
import history from '../core/history';

import PureComponent from '../core/PureComponent';
import Net from '../net/net';
import { getErrMsg } from '../utils/common';
import ShareMore from '../components/ShareMore';

import AuthModel from '../model/auth';
import Clipboard from 'clipboard';
import QRCode from 'qrcode.react';
import { toast } from "../utils/common";
import CreatePoster from '../components/CreatePoster';


//激活邮箱
//https://localhost/activate/?channel=xxxx&token=etDoMh1SIds%
export default class Activate extends PureComponent {
    constructor(props) {
        super(props);

        this.isMobile = this.props.isMobile;
        this.state = {
            channel: "",
            token: ""
        }
    }
    componentWillMount() {
        const Token = this.props.location.query.token;
        const Channel = this.props.location.query.channel;

        if (Token){
            this.setState({ channel: Channel, token: Token });
        }
    }
    render() {
        const { channel, token } = this.state;
        return (
            <RegisterActivity token={token} isMobile={this.isMobile} isActivity={this.props.isActivity}/>
        )
    }
}


class ActivateEmail extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            activate: false,
            error: ''
        }
    }
    componentWillMount() {
        const Token = this.props.token;
        Net.httpRequest("user/activate", { Token }, (obj) => {
            var activate = true;

            if (obj.Status == 0 || obj.Status == 10013) {
                this.setState({ activate, error: '' });
            } else {
                if (obj.Data) {
                    this.setState({ activate, error: getErrMsg(obj.Error, obj.Data) });
                } else {
                    this.setState({ activate, error: obj.Error });
                }
            }
        }, this);
    }
    turnToLogin() {
        history.replace("/login");
    }
    render() {
        const { activate, error } = this.state;
        return (
            <div className="register-contain pos-r">
                <div className="pdt-1 mediaHight">
                    <form className="regist-box login-web">
                        <div className="emailVerification_web">
                            <div className="emailVerification">
                                <div className="tc fem-175 login-title">
                                    <span className="logo"></span><span className="pdl-10">{Intl.lang("activateSucc.1_6")}</span>
                                </div>
                                <div className="land_text send-txt tc pdb-50">
                                    {(activate && !error) && <p><span>{Intl.lang("register.activated")}</span><a href="javascript:;" onClick={() => this.turnToLogin()}><span className="green4 pdl-5">{Intl.lang("activateSucc.1_6")}</span></a></p>}
                                    {(activate && !!error) && <p><span>{error}</span></p>}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

class RegisterActivity extends PureComponent {
    constructor(props) {
        super(props);

        this.userInfo = null;
        this.state = {
            viewInfo: {},
            inviteLink: "",
            Uid: "",

            showPoster: false,     // mobile Poster
        }
    }
    componentWillMount() {
        if (this.props.token) {
            this.activateAccount();
        } else {
            this.setInviteLink();
        }
    }
    activateAccount() {
        const Token = this.props.token;
        Net.httpRequest("user/activate", { Token }, (obj) => {
            var activate = true;

            if (obj.Status == 0 || obj.Status == 10013) {
                this.userInfo = obj.Data;
                AuthModel.registerAfter(obj);
                this.setState({ activate, error: '' });
            } else {
                if (obj.Data) {
                    this.setState({ activate, error: getErrMsg(obj.Error, obj.Data) });
                } else {
                    this.setState({ activate, error: obj.Error });
                }
            }
            this.setInviteLink();
        }, this);
    }
    setInviteLink() {
        var uInfo = AuthModel.getRegisterData();
        if (uInfo && uInfo.Uid) {
            var newLink = window.location.origin + "/register?ref=" + uInfo.Uid;
            this.setState({ inviteLink: newLink, Uid: uInfo.Uid });
            this.userInfo = uInfo;
        }
    }
    componentDidMount() {
        // const { isMobile } = this.props;

        document.documentElement.scrollTop = 0;
        var clipboard = new Clipboard('.copy_link_btn');
        clipboard.on('success', function (e) {
            toast(Intl.lang("Recharge.120"), 0, 1000);
        });
        clipboard.on('error', function (e) {
            console.log(e);
        });
        this.clipboard = clipboard;
    }

    componentWillUnmount() {
        if (this.clipboard) this.clipboard.destroy();
    }
    toLogin() {
        history.replace('/login');
    }
    toInvite() {
        history.replace({ pathname: '/login', query: { 'return_to': '/invite' } });
    }
    createPoster() {
        this.setState({ showPoster: !this.state.showPoster })
    }
    closePoster() {
        this.createPoster();
    }
    render() {
        const { inviteLink, Uid, showPoster } = this.state, { token, isMobile, isActivity } = this.props;
        const qrSize = isMobile ? 98 : 160;

        return (
            !showPoster ?
                <div className="okk-trade-contain">
                    <div className="activity-successful media-contain">
                        <div className="contain">
                            <div className="verify-successful">
                                <i className="iconfont icon-success"></i>
                                <h3>{Intl.lang("activity.registered.1")}</h3>
                                {isActivity && <p>{Intl.lang("activity.registered.2")}</p>}
                                <button onClick={() => this.toLogin()}>{Intl.lang("activity.registered.3")}</button>
                            </div>
                            <div className="activity-recom">
                                <div className={"activity-code "+Intl.curLang} onClick={this.toInvite.bind(this)}></div>
                                {!token ?
                                    <div className={"activity-qr qr"+Intl.curLang}>
                                        <div className="activity-qr-code">
                                            <QRCode value={inviteLink} size={98} />
                                            <p>{Intl.lang("activity.registered.4")}</p>
                                        </div>
                                        <div className="activity-share">
                                            <p>{Intl.lang("activity.registered.5")} <span>{Uid}</span></p>
                                            <div className="activity-share-box">
                                                <p>{Intl.lang("activity.registered.7")}</p>
                                                {Uid && <div>
                                                    <ShareMore userInfo={this.userInfo} styleObject={{ display: 'inline-block', verticalAlign: 'top'}} />
                                                    <span style={{ verticalAlign: 'middle' }}>
                                                    <input style={{ position: 'fixed', left: '-10000px', top: '-10000px' }} id="copy_url" value={inviteLink} readOnly="readonly" onChange={() => { }} />
                                                    <span className="activity-copy copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_url">
                                                        {/*<i className="iconfont icon-copy"></i>*/}
                                                    </span>
                                                </span>
                                                </div>}
                                            </div>

                                            <input id="copy_invit_text" className="hide" value={inviteLink} readOnly="readonly"/>
                                            <button className="activity-copy copy_link_btn point" data-clipboard-action="copy" data-clipboard-target="#copy_invit_text" style={{marginRight:'5px',padding:'5px',lineHeight: 'inherit'}}>{Intl.lang("activity.registered.btn")}</button>
                                            {isMobile && <button className="point" onClick={() => this.createPoster()}>{Intl.lang("activity.registered.posters")}</button>}

                                        </div>
                                    </div>
                                    :
                                    <div className="activity-qr">
                                        <div className="activity-qr-code">
                                            <QRCode value={inviteLink} size={qrSize} />
                                            <p>{Intl.lang("activity.registered.4")}</p>
                                        </div>
                                        <div className="activity-share">
                                            <p>{Intl.lang("activity.registered.5")}</p>
                                            <p className="share-link">
                                                <input className="w-60" id="copy_invit_code" value={Uid} readOnly="readonly" onChange={() => { }} />
                                                <span className="activity-copy copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_invit_code"><i className="iconfont icon-copy"></i></span>
                                            </p>
                                            <p>{Intl.lang("activity.registered.6")}</p>
                                            <p className="share-link">
                                                <input id="copy_invit_text" value={inviteLink} readOnly="readonly" onChange={() => { }} />
                                                <span className="activity-copy copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_invit_text"><i className="iconfont icon-copy"></i></span>
                                            </p>
                                            <p>{Intl.lang("activity.registered.7")}</p>

                                            {Uid && <ShareMore userInfo={this.userInfo} />}
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                :
                <CreatePoster className="poster-box" uid={Uid} onClick={() => this.closePoster()} />
        )
    }
}

