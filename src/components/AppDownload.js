import Intl from '../intl';
import React from 'react';

import PureComponent from "../core/PureComponent"
import Net from '../net/net'
import qrcode from 'jquery-qrcode'
import  { toast } from '../utils/common'
import {APP_DOWNLOAD_URL} from '../config';

const $ = window.$;
class AppDownload extends PureComponent{
    componentDidMount() {
        // this.getAppCode();
    }
    // getAppCode(){
    //     var self = this;
    //     Net.httpRequest(APP_DOWNLOAD_URL, "", function (data) {
    //         if (data.Status==0){
    //             if (data.Data.Addr) self.createCode(data.Data.Addr)
    //         }else{
    //             toast(data.Error, true);
    //         }
    //     }, this, 'get');
    // }
    createCode(address){
        if(!address) return ;

        var type = $.browser.msie ? 'div' : 'canvas';
        $(this.refs['app-and-ecode']).qrcode({
            text: address,
            width:120,
            height:120,
            render: type
        });
    }

    render(){
        return (
                <div className="appbox f-clear">
                    <div className="app-and-ecode fl" ref="app-and-ecode"></div>
                    <div className="lh-32 fl mt-30">
                        <p><i className="iconfont icon-android green3 fem-225 ver-md"></i><span>{Intl.lang("app.app_android")}</span> </p>
                        <p className="tc mt-30">{Intl.lang("app.wx_scan")}</p>
                    </div>
                </div>
        );
    }
}

export default AppDownload;
