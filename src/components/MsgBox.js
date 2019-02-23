import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';

import PureComponent from "../core/PureComponent"

const $ = window.$;

class MsgBox extends PureComponent{
    componentDidMount() {
        this.startScroll();
    }
    componentWillUnmount(){
        // super.componentWillUnmount();

        this.stopScroll();
    }
    doScroll(){
        var $parent = $('.msg-ul');
        var $first = $parent.find('li:first');
        var height = $first.height();
        $first.animate({
            height: 0
        }, 500, function() {
            $first.css('height', height).appendTo($parent);
        });
    }
    scrollUp(){
        var $parent = $('.msg-ul');
        var $first = $parent.find('li:first');
        var height = $first.height();
        $first.css('height', height).appendTo($parent);
    }
    scrollDown(){
        var $parent = $('.msg-ul');
        var $last = $parent.find('li:last');
        var height = $last.height();
        $last.css('height', height).prependTo($parent);
    }
    stopScroll(){
        if (this.timer) clearInterval(this.timer);
    }
    startScroll(){
        this.timer = setInterval(()=>this.doScroll(), 3000);
    }

    render() {
        return (
            <div className="msgbox">
                <div className="contain pdt-1 border-l f-clear">
                    <i className="ml-20 iconfont icon-msg fem125 fl"></i>
                    <div id="scrollMsgDiv" style={{height:"45px",overflow:"hidden",float:'left',width:'1050px'}}>
                        <ul className="ml-20 msg-ul fl" onMouseOver={()=>this.stopScroll()} onMouseLeave={()=>this.startScroll()}>
                            <li><a href="javascript:;">{Intl.lang("MsgBox.100")}</a></li>
                            <li><a href="javascript:;">{Intl.lang("MsgBox.101")}</a></li>
                            <li><a href="javascript:;">{Intl.lang("MsgBox.102")}</a></li>
                            <li><a href="javascript:;">{Intl.lang("MsgBox.103")}</a></li>
                            <li><a href="javascript:;">{Intl.lang("MsgBox.104")}</a></li>
                        </ul>
                    </div>
                    <div className="fr msg-more">
                        <div className="rollbox">
                            <i className="iconfont icon-dropUp" onClick={()=>this.scrollUp()}></i>
                            <i className="iconfont icon-dropDown" onClick={()=>this.scrollDown()}></i>
                        </div>
                        <a className="border-l border-r" href="javascript:;"><span dangerouslySetInnerHTML={{__html:Intl.lang('MsgBox.105')}}></span><i className="iconfont icon-more fem875"></i></a>
                    </div>
                </div>
            </div>
        );
    }
}

export default MsgBox;