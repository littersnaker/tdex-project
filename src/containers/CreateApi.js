import React from 'react';

import Intl from '../intl';
import PureComponent from "../core/PureComponent";
import Net from '../net/net';
import QRCode from 'qrcode.react'

import ApiPng from '../images/verify/api.png';

export default class CreateApi extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            msg: '',
            list:null
        };
    }

    componentWillMount() {
        var query = this.props.location.query;
        var Token = query.token;
        if (Token){
            Net.httpRequest("user/api/patch", {Token}, (data)=>{
                // data = {
                //     Status:0,
                //     Data: {
                //         CIDR: "",
                //         Enabled: true,
                //         Key: "5AFovoFkTY9sVLafFw7B11C3Zt4mTzSjanoMGRJQroHhg4CSxeBaQU6mN5sKb7SJ",
                //         Name: "test",
                //         Permissions: 1,
                //         Secret: "0kBaw58ucHLfrX2MN9gFqeREtyW7LglmcgTug3jxZ4aXxGz4NtR8nn41KftLl3ne"
                //     }
                // };
                if (data.Status==0){
                    this.setState({msg:'', list:[data.Data]});
                }else{
                    this.setState({msg:Intl.lang("api.createfail", Net.getErrMsg(data))});
                }
            }, this, 'post', 'json', null, false);
        }
    }

    render(){
        const {msg, list} = this.state;
        return <div className="okk-trade-contain pos-r">
            {msg && <div className="page-api">
                <div className="api"><img src={ApiPng} /></div>
                <p className="fs16 tc pd-tb-35" dangerouslySetInnerHTML={{__html:msg}}></p>
            </div>}
            {list && <div className="contain m-create-api" style={{paddingTop:"220px"}}>
                {list.map((v, i)=>{
                    var code = v.Secret.indexOf("***")==-1 ? JSON.stringify({Comment:v.Name, apiKey:v.Key, secretKey:v.Secret}) : '';
                    return <div className="panel" key={i}>
                        <div className="panel-title f-cb ">
                            {v.Name}
                        </div>
                        <div className="pd-15">
                            <div className="keySecret f-oh">
                                <div className="fl ewm">
                                    {code && <QRCode value={code} size={130} />}
                                    {!code && <img src={process.env.PUBLIC_URL+"/images/icons/hideEwm.jpg"}/>}
                                </div>
                                <div className="fl">
                                    <ul className="apiParams">
                                        <li>
                                            <label className="">API Key: </label>
                                            <div className="">{v.Key}</div>
                                        </li>
                                        <li>
                                            <label className="">Secret Key: </label>
                                            <div><span>{v.Secret}</span></div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="ipLimit f-oh mt-15">
                                <div><i className="iconfont icon-warn withdrawTip red3"></i><span className="red3 pd08">{Intl.lang("api.createok")}</span></div>
                                <div className="pdt-10"><span dangerouslySetInnerHTML={{__html:Intl.lang("api.go")}}></span></div>
                            </div>
                        </div>
                    </div>
                })}
            </div>}
            </div>
    }
}