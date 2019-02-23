import React from 'react';

// import ReactTooltip from 'react-tooltip'
import Intl from '../intl';
import PureComponent from "../core/PureComponent";
import Net from '../net/net';
import PopDialog from "../utils/popDialog";
import Verify from './Verify'
import GlobalStore from "../stores";
import history from "../core/history";
import {Confirm} from "../components/Common";
import {toast} from '../utils/common'

import ApiPng from '../images/verify/api.png';
import ToolTip from "../components/ToolTip";

const $ = window.$;

export default class Api extends PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			name: '',
			list: null
		};
	}

    componentWillMount() {
		this.loadList();
    }

    loadList(){
        Net.httpRequest("user/api", "", (data)=>{
            if (data.Status==0){
                this.setState({list: data.Data.List||[]});
            }
        }, this);
	}

    onCreate(e){
		e.preventDefault();
        e.stopPropagation();

        var name = this.state.name;
        if (!name){
            $("#apiName").focus();
            toast(Intl.lang("form.error.empty"), true);
        	return;
		}
		if (!(/^[0-9A-Z]{4,20}$/gi.test(name))){
            $("#apiName").focus();
            toast(Intl.lang("api.error.name"), true);
            return;
        }

        var uInfo = GlobalStore.getUserInfo();
        if(uInfo.GgAuth || uInfo.Mobile){
            PopDialog.open(<Verify path="with" verify="normal" onChange={(data)=>{
                if (typeof(data)=='string'){
                    PopDialog.close();
                	return;
                }
                else{
                	data.Name = name;

                	Net.httpRequest("user/api/create", data, (obj)=>{
                		if (obj.Status==0){
                            PopDialog.close();
                            var path = { pathname: '/apiEmail'};
                            if (obj.Data && obj.Data.ActivateUrl) path.query = { ActivateUrl: obj.Data.ActivateUrl };
                            history.push(path);
						}
					}, this, 'put');
                }
            }} datafor="other" />, 'simple_lang');
        }else{
            toast(Intl.lang("Withdrawals.119"), true);
        }
	}

    onChangeName(e){
        e.stopPropagation();

        var name = e.target.value;
        name = name.replace(/[^0-9A-Z]*/gi, '');
        this.setState({name});
	}

    delAll(){
        PopDialog.open(<Confirm title="" content={Intl.lang("api.delAll.confirm")} callback={()=>{
            var keyList = [];
            this.state.list.forEach((v)=>{
                keyList.push(v.Key);
            });
            Net.httpRequest("user/api/delete", {List:keyList}, (data)=>{
                if (data.Status==0){
                    this.loadList();
                }
            }, this, 'delete');
        }}/>, "alert_panel")
    }

    onItemSubmit(){
	    this.loadList();
    }

	render() {
		const {list, name} = this.state;

		const isCreated = list && !!list[0];

        return (
        	<div className="okk-trade-contain pos-r">
				{(list && !isCreated) &&
                <div className="page-api">
                    <div className="api"><img src={ApiPng} /></div>
                    <p className="fs16 tc pd-tb-35">{Intl.lang("api.createstart")}</p>
                    <label className="addApi">
                        <input type="text" placeholder={Intl.lang("api.inputTip")} maxLength={20} value={name} onChange={this.onChangeName.bind(this)}/>
                        <input type="button" value={Intl.lang("api.createBtn")} className="btn btn-light-blue" onClick={this.onCreate.bind(this)}/>
                    </label>
                </div>}

				{isCreated &&
        		<div className="apiLists-hd">
					<h3>API</h3>
					<p className="">{Intl.lang("api.opentxtip")}</p>
                    <p></p>
					<div>
						<label className="addApi"><input type="text" placeholder={Intl.lang("api.inputTip")} value={name}  maxLength={20} onChange={this.onChangeName.bind(this)} /><input type="button" value={Intl.lang("api.createBtn")} className="btn btn-light-blue" onClick={this.onCreate.bind(this)} /></label>
					</div>
				</div>}

				{isCreated &&
				<div className="contain pdb-30">
	        		<div className="deleteall">
						<a onClick={this.delAll.bind(this)} href="javascript:;">{Intl.lang("api.delAll")}</a>
					</div>
                    {list && list.map((v, i)=>{
                        return <ApiItem data={v} key={i} guid={i} uInfo={this.props.uInfo} onSubmit={this.onItemSubmit.bind(this)}/>
                    })}

				</div>
                }
			</div>
        );
    }
}

class ApiItem extends PureComponent{
    constructor(props) {
        super(props);

        this.perms = [1,2,4];
        this.ipLimits = [2, 1];

        var data = this.props.data;
        this.state = {
            isEdit: false,
            ipStatus: data.CIDR ? 2 : 1,
            ips: data.CIDR,
            perm: data.Permissions
        };
    }

    componentDidMount() {
        // ReactTooltip.rebuild();
    }

    del(){
        var key = this.props.data.Key;
        PopDialog.open(<Confirm title="" content={Intl.lang("api.del.confirm", key)} callback={()=>{
            Net.httpRequest("user/api/delete", {List:[key]}, (data)=>{
                if (data.Status==0){
                    if (this.props.onSubmit) this.props.onSubmit();
                }
            }, this, 'delete');
        }}/>, "alert_panel")
    }
    editOrSave(){
        if (!this.state.isEdit){
            this.setState({isEdit:true});
        }else{
            var ips = this.state.ips;
            if (this.state.ipStatus==2 && !/^(?:(?:^|,)(?:[0-9]|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(?:\.(?:[0-9]|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])){3})+$/.test(ips)){
                toast(Intl.lang("api.error.ips"), true);
                return;
            }

            PopDialog.open(<Verify path="with" verify="normal" onChange={(data)=>{
                if (typeof(data)=='string'){
                    PopDialog.close();
                    return;
                }
                else{
                    Object.assign(data, {
                        Key: this.props.data.Key,
                        CIDR: this.state.ipStatus==2 ? this.state.ips : '',
                        Permissions: this.state.perm,
                        Enabled: this.props.data.Enabled,
                    });

                    Net.httpRequest("user/api/modify", data, (data)=>{
                        if (data.Status==0){
                            PopDialog.close();
                            this.setState({isEdit:false});
                            if (this.props.onSubmit) this.props.onSubmit();
                        }
                    }, this, 'put');
                }
            }} datafor="other" />, 'simple_lang');
        }
    }
    onChangeIpStatus(e){
        e.stopPropagation();

        this.setState({ipStatus:Number(e.target.value)});
    }
    onChangePerm(e){
        e.stopPropagation();

        var perm = this.state.perm;
        var v = Number(e.target.value);
        if (e.target.checked){
            if ((perm & v) != v){
                this.setState({perm: perm+v});
            }
        }else{
            if ((perm & v) == v){
                this.setState({perm: perm-v});
            }
        }
    }
    onChangeIps(e){
        e.stopPropagation();

        var val = e.target.value;
        val = val.replace(/[^0-9\.,]/g, '');

        this.setState({ips: val});
    }
    render(){
        const {data, guid, uInfo} = this.props;
        const {isEdit,ipStatus,ips,perm} = this.state;

        return (
            <div className="panel">
                <div className="panel-title f-cb ">
                    {data.Name}
                    <span className="btn fr" onClick={this.del.bind(this)}>{Intl.lang("api.del")}</span>
                    <span className={isEdit ? "btn fr btn-b" : "btn fr"} style={{marginRight:"5px"}} onClick={this.editOrSave.bind(this)}>{Intl.lang(isEdit ? "api.save" : "api.edit")}</span>
                </div>
                <div className="pd-15">
                    <div className="keySecret f-oh">
                        <div className="fl ewm">
                            <img src={process.env.PUBLIC_URL+"/images/icons/hideEwm.jpg"}/>
                        </div>
                        <div className="fl">
                            <ul className="apiParams">
                                <li>
                                    <label className="">API Key: </label>
                                    <div className="">{data.Key}</div>
                                </li>
                                <li>
                                    <label className="">Secret Key: </label><ToolTip title={Intl.lang("api.secret.tip")}><i className="iconfont icon-warn withdrawTip cur-hover"></i></ToolTip>
                                    <div><span>{data.Secret}</span></div>
                                </li>
                                <li>
                                    <label className="">{Intl.lang("api.perm")}</label>
                                    <div className="rules">
                                        {this.perms.map((v, i)=>{
                                            return <label className="checkbox" key={i}><input type="checkbox" name={"perm"+guid} value={v} checked={(perm & v)==v} disabled={isEdit?false:true} onChange={this.onChangePerm.bind(this)}/><span></span>{Intl.lang("api.perm"+v)}</label>
                                        })}
                                        <ToolTip title={Intl.lang("api.tixian.tip")}><i className="iconfont icon-warn withdrawTip"></i></ToolTip>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="ipLimit f-oh mt-15">
                        <div className="fl label ">{Intl.lang("api.ipLimit")}</div>
                        <div className="fl">
                            {this.ipLimits.map((v,i)=>{
                                return <label className="" key={i}><input name={"ipStatus"+guid} type="radio" value={v} disabled={isEdit?false:true} checked={v==ipStatus} onChange={this.onChangeIpStatus.bind(this)}/>{Intl.lang("api.ipStatus"+v)}</label>
                            })}
                            {ipStatus==1 && <div><p className="info ">{Intl.lang("api.ipTip")}</p></div>}
                            {ipStatus==2 && <div>
                                <div className="curIp ng-binding">{Intl.lang("api.loginIp", uInfo.LastLoginIP)}</div>
                                <div className="trusted">
                                    <label className="ng-binding">{Intl.lang("api.safeIp")}</label>
                                    <div className="trusted-input">
                                        <label><input className="ng-pristine ng-valid" type="text" name="tradeIp" value={ips} onChange={this.onChangeIps.bind(this)}/></label>
                                        {/*<h6 className="tradeIpP ng-binding">{Intl.lang("api.safeIp.title")}</h6>*/}
                                        <p className="ng-binding">{Intl.lang("api.safeIp.tip")}</p>
                                    </div>
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
