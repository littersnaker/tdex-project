import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';

import Net from '../net/net'
import AuthModel from '../model/auth';
import Clipboard from 'clipboard'
import QRCode from 'qrcode.react'
import {toast} from "../utils/common"

class RegisterActivity extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            viewInfo:{},
            inviteLink: ""
        }
    }
    componentWillMount(){
        var uInfo = AuthModel.getRegisterData();
        if(uInfo.Uid){
            var newLink = window.location.origin + "/register?ref=" + uInfo.Uid;
            this.setState({inviteLink:newLink, Uid: uInfo.Uid})
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

        this.getInviteView();
    }
    componentWillUnmount(){
        this.clipboard.destroy();
    }
    getInviteView(){
        var self = this;
        Net.httpRequest("invite/view", false, (data)=>{
            if (data.Status == 0){
                self.setState({viewInfo:data.Data});
            }else{

            }
        }, this);
    }

    render() {
        const {viewInfo, inviteLink, Uid} = this.state;

        return (
            <div className="okk-trade-contain activity-page">
                <div className="activity-successful">
                    <div className="contain">
                        <div className="verify-successful">
                            <i className="iconfont icon-success"></i>
                            <h3>注册成功</h3>
                            <p>TD已发放到您的账户，请注意查收</p>
                            <button>完成</button>
                        </div>
                        <div className="activity-recom">
                            <div className="activity-code"></div>
                            <div className="activity-qr">
                                <div className="activity-qr-code">
                                    <QRCode value={inviteLink} size={120} />
                                    <p>邀请好友扫一扫</p>
                                </div>
                                <div className="activity-share">
                                    <p>我的推荐码：</p>
                                    <p className="share-link"><input style={{width:'50px'}} type="text" value="Fwa7es" /><i className="iconfont icon-copy"></i></p>
                                    <p>我的推荐链接：</p>
                                    <p className="share-link"><input type="text" value="http://tdex.com/register?ref=Fwa7es"/><i className="iconfont icon-copy"></i></p>
                                    <p>分享：</p>
                                    <p><span className="iconfont icon-qq"></span><span className="iconfont icon-qq"></span><span className="iconfont icon-qq"></span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default RegisterActivity;