import Intl from '../intl';
import React from 'react';
import PureComponent from "../core/PureComponent";
import { Link } from 'react-router';
import Net from '../net/net';

import AuthModel from '../model/auth';
import {isMobile} from "../utils/util";
import Event from '../core/event';
import WsMgr from '../net/WsMgr';

import MessageOpt from './MessageOperate'


export default class MessageBox extends PureComponent {
    constructor(props) {
        super(props);

        this.onUseMessage = this.onUseMessage.bind(this);
        this.pageSize = 4;
        this.lang = Intl.getLang();
        this.state = {
            showMessage: false,

            unRead: 0,
            messageData: []
        }
    }
    componentWillUnmount(){
        super.componentWillUnmount();
        WsMgr.off('user_message', this.onUseMessage);
    }
    componentWillMount() {
        WsMgr.on('user_message', this.onUseMessage);

        Event.addListener(Event.EventName.MESSAGE_NOTE, this.readAll.bind(this), this);
        Event.addListener(Event.EventName.MESSAGE_REMARK, this.remarkRead.bind(this), this);
    }
    remarkRead(data){
        if(data.Src==1) return;

        let { messageData, unRead } = this.state;
        for(var i in messageData){
            if(messageData[i].Id == data.Id){
                messageData[i].New = 0;
                unRead --;
                break;
            }
        }
        unRead = unRead<0?0:unRead;
        this.setState({messageData:messageData, unRead:unRead});
    }
    readAll(){
        let { messageData } = this.state;
        messageData.map((v,i)=>{
            v.New = 0;
        });
        this.setState({messageData:messageData, unRead:0});
    }
    onUseMessage(data){
        if(data){
            let { messageData, unRead } = this.state;
            messageData.unshift(data);
            if(messageData.length>this.pageSize){
                messageData.pop();
            }
            this.setState({messageData: messageData, unRead: (unRead+1)});
        }
    }
    componentDidMount(){
        this.loadMessageData(this.props.uInfo);
    }
    componentWillReceiveProps(nextProps){
        if((nextProps.uInfo.Uid != this.props.uInfo.Uid) || (this.lang !== Intl.getLang())){
            this.loadMessageData(nextProps.uInfo);
            this.lang = Intl.getLang();
        }
    }
    loadMessageData(uInfo){
        if(uInfo && uInfo.Uid){
            Net.httpRequest("mailbox/message", {Type:0, Page:1, PageSize: this.pageSize}, (data)=>{
                if (data.Status == 0){
                    var Info = data.Data;
                    if(Info.List && Info.List.length){
                        this.setState({messageData: Info.List, unRead: Info.Unread});
                    }
                }
            }, this);
        }else{
            this.setState({messageData: [], unRead: 0});
        }
    }

    openMessage(v){
        let {unRead} = this.state;
        MessageOpt.readOne(v, (data)=>{
            if (data.Status == 0){
                v.New = 0;
                unRead--;
                if(unRead<1){
                    this.setState({unRead: 0});
                }
            }
        }, 1)
    }
    showMessage(type) {
        this.setState({showMessage: type});
    }

    render(){
        const { showMessage, messageData, unRead } = this.state, { uInfo } = this.props;
        return (
            <React.Fragment>
                <li onMouseOver={this.showMessage.bind(this, true)} onMouseLeave={this.showMessage.bind(this, false)}>
                    <span className="iconfont icon-lingdang header-message">{unRead ? <i></i>:null}</span>
                    {(messageData && !!messageData.length) && <div className={"messageBox "+(showMessage?"":"hide")}>
                        {messageData.map((v,i)=>{
                            return <div key={"m"+i} onClick={()=>{this.openMessage(v)}}>
                                <p className={v.New?"white2":""}>
                                    {v.Link?<a className="f-tof" href={v.Link}>{v.Title}</a>:<span className="f-tof">{v.Title}</span>}<i className="iconfont icon-arrow-l fs12"></i>
                                </p>
                                <p>{(v.CreateTime).substring(0, 16)}</p>
                            </div>
                        })}
                        <div className="more"><Link to={'/message'}>{Intl.lang("common.viewMore")}</Link></div>
                    </div>}
                </li>
            </React.Fragment>
        )
    }
}