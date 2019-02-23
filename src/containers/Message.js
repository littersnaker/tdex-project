import Intl from '../intl';
import React from 'react';
import PureComponent from "../core/PureComponent";
import { Link } from 'react-router';
import Net from '../net/net';

import AuthModel from '../model/auth';
import {isMobile} from "../utils/util";
import Event from '../core/event';
import WsMgr from '../net/WsMgr';
import Pager from '../components/Pager'
import MessageOpt from '../components/MessageOperate'


export default class Message extends PureComponent {
    constructor(props) {
        super(props);

        this.onUseMessage = this.onUseMessage.bind(this);
        this.pageSize = 10;
        this.lang = Intl.getLang();
        this.state = {
            unRead: 0,
            curPage: 1,
            messageData: {List: [], PageSize: 10}
        }
    }
    componentWillUnmount(){
        super.componentWillUnmount();
        WsMgr.off('user_message', this.onUseMessage);
    }
    componentWillMount() {
        WsMgr.on('user_message', this.onUseMessage);

        Event.addListener(Event.EventName.MESSAGE_REMARK, this.listenRemark.bind(this), this);
    }
    onUseMessage(data){
        if(data){
            let { messageData, unRead } = this.state;
            let newList = messageData.List.unshift(data);
            if(newList.length>this.pageSize){
                newList.pop();
            }
            this.setState({messageData: messageData, unRead:(unRead+1)});
        }
    }
    componentWillReceiveProps(nextProps){
        if(this.state.lang !== Intl.getLang()){
            this.lang = Intl.getLang();
            this.loadMessageData(this.state.curPage);
        }
    }
    componentDidMount(){
        this.loadMessageData(1);
    }

    loadMessageData(page){
        Net.httpRequest("mailbox/message", {Type:0, Page:page, PageSize: this.pageSize}, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                if(Info.List && Info.List.length){
                    this.setState({messageData: Info, unRead: Info.Unread, curPage:page});
                }
            }
        }, this);
    }
    showMessage(type) {
        this.setState({showMessage: type});
    }
    openMessage(item){
        MessageOpt.readOne(item, (data)=> {
            if (data.Status == 0) {
                this.remarkRead(item);
            }
        }, 2)
    }
    readAll(){
        const { messageData } = this.state;
        if(messageData.Total){
            Net.httpRequest("mailbox/ReadAll", false, (data)=>{
                if (data.Status == 0){
                    this.remarkRead();
                }
            }, this);
        }
    }
    listenRemark(data){
        if(data.Src==2) return;

        this.remarkRead(data);
    }
    remarkRead(info){
        let { messageData, unRead } = this.state;
        let Item = messageData.List;
        for(var i in Item){
            if(info){
                if(Item[i].Id == info.Id){
                    Item[i].New = 0;
                    unRead --;
                    break;
                }
            }else{
                Item[i].New = 0;
                unRead = 0;
            }
        }

        // 标记全部已读
        if(!info || unRead<1){
            Event.dispatch(Event.EventName.MESSAGE_NOTE);
        }

        if(!info){
            this.setState({messageData:messageData, unRead:0});
        }else{
            if(info.Link){
                this.turnTo(info.Link);
            }else{
                unRead = unRead<0?0:unRead;
                this.setState({messageData:messageData, unRead:unRead});
            }
        }
    }
    turnTo(route) {
        if(route) history.push(route);
    }
    render(){
        const { messageData } = this.state, { uInfo } = this.props;
        return(
            <div className="inside-page-web">
                <div className="inside-web-part">
                    <div className="withdrawal">
                        <div className="message-header">
                            <h3 className="fl">{Intl.lang("message.theme")}</h3>
                            <span className="fr readAll" onClick={this.readAll.bind(this)}>{Intl.lang("message.remarkAll")}</span>
                        </div>
                        <div className="message-detail">
                            <ul>
                                {(messageData.hasOwnProperty("Total") && messageData.Total > 0) && messageData.List.map((item, i) => {
                                    return <li onClick={()=>{this.openMessage(item)}} key={'m'+i} className={item.New?"no-read":""}>
                                        <p>{item.Link?<a className="f-tof" href={item.Link}>{v.Title}</a>:<span className="f-tof">{item.Title}</span>}<i className="iconfont icon-arrow-l fs12"></i></p>
                                        <p>{(item.CreateTime).substring(0, 16)}</p>
                                    </li>
                                })}
                            </ul>
                            {(messageData.hasOwnProperty("PageCount") && messageData.PageCount > 1) &&
                            <div className="pos-r h-50 mt-20">
                                <Pager className="spot-trading-pager-config Page26" data={messageData} onChange={this.loadMessageData.bind(this)}/>
                            </div>
                            }
                            {(!messageData.List || !messageData.List.length) && <div className="no-list-data show-5">
                                <div className="no-list-data-pic"></div>
                                <p>{Intl.lang("bank.1_27")}</p>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}