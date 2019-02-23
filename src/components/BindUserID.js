import Intl from '../intl';
import React from 'react';

import Store from '../core/store';
import connectToStore from '../core/connect-to-store';
import PureComponent from '../core/PureComponent';
import storeTypes from '../core/storetypes';

import Net from '../net/net'
import GlobelStore from '../stores'

import PopDialog from  '../utils/popDialog'
import  { toast, getDomain } from '../utils/common'
import ImageUpload from '../utils/imageUpload'
// import { getGeolocation } from '../utils/county';
import CountryCode from '../components/CountryCode';

const $ = window.$;
const userIDStore = Store({
    tab: 1,
    mobileCodeSec: 0,
    error:''
}, storeTypes.BINDUSERID);

class BindUserID extends PureComponent{
    constructor(props){
        super(props);
        this.countryCode = null;
        this.state = {
            LANG: 'cn',
            // Country:[],
            UserInfo: null,
            preImg: false,
            aftImg: false,
        }
    }
    componentWillMount(){
        var userInfo = GlobelStore.getUserInfo();
        // var data = getGeolocation(this.state.LANG);
        this.setState({UserInfo: userInfo});
    }
    checkPhotoUpload(type){
        var self = this;

        var data = {Type:parseInt(type)};
        Net.httpRequest("user/image", data, function(data){
            if (data.Status == 0){
                self.BasePhoto = data.Data;
                self.setState({BasePhoto: self.BasePhoto});
            }
        }, this);
    }
    changeUploadFile(type, evt){
        evt.preventDefault();

        var node = evt.target;
        var fileInputId = $(node).attr('id');
        var result = ImageUpload.checkFile($(node).prop('files'));
        var domain = getDomain();
        if (result){
            var self = this;
            ImageUpload.submit("user/upload", fileInputId, {Type:type, Domain: domain}, 'json', function(data){
                if (data.Status == 0){
                    toast(Intl.lang("bindAuth.2_43"));
                    var objUrl = self.getObjectURL(node.files[0]) ;
                    if (objUrl) {
                        let imageData = (type%2==1) ? {preImg: data.Data.Id}:{aftImg: data.Data.Id};
                        self.setState(imageData);
                        $("#img_"+type).attr("src", objUrl) ;
                    }
                }
            });
        }else{
            toast(Intl.lang("bindAuth.error_upload"), true);
        }
    }

    getObjectURL(file) {
        var url = null ;
        // 下面函数执行的效果是一样的，只是需要针对不同的浏览器执行不同的 js 函数而已
        if (window.createObjectURL!=undefined) { // basic
            url = window.createObjectURL(file) ;
        } else if (window.URL!=undefined) { // mozilla(firefox)
            url = window.URL.createObjectURL(file) ;
        } else if (window.webkitURL!=undefined) { // webkit or chrome
            url = window.webkitURL.createObjectURL(file) ;
        }
        return url ;
    }
    handdleSubmit=(e)=>{
        e.preventDefault();
        var type = this.props.grade;

        var data;
        if(type==1){
            var uName = this.refs.userName.value;
            var uID = this.refs["userId"].value.replace(/\s+/g,"");     // 去除所有空格

            if(!uName || !uID){
                toast(Intl.lang("BindUserID.116"), true);
                return false;
            }
            data = {
                Name:uName,
                PassportType: 0,
                PassportId: uID,
                PassportPicIdA: this.state.preImg,
                PassportPicIdB:this.state.aftImg
            };
        }else{
            var address = this.refs["userAddress"].value;
            var city = this.refs["userCity"].value;
            var country = this.countryCode;

            if(!country || !city || !address){
                toast(Intl.lang("BindUserID.117"), true);
                return false;
            }
            data = {
                Country: parseInt(country),
                Address: address+'|'+city,
                AddressPicIdA: this.state.preImg,
                AddressPicIdB: this.state.aftImg
            };
        }
        if(!this.state.preImg || !this.state.aftImg){
            toast(Intl.lang("BindUserID.118"), true);
            return false;
        }

        var callback = this.props.onChange, self = this;
        Net.httpRequest("user/sysAuth", data, function(data){
            if (data.Status == 0){
                if(callback) callback();
                self.close();
            }else{
                toast(data.Erroe, data.Status);
            }
        }, this);
    };
    changeCountry(value){
        this.countryCode = value;
    }
    close(){
        PopDialog.close();
    }
    render(){
        const { grade } = this.props;
        const UserInfo = this.state.UserInfo;
        const lv = grade==1? Intl.lang("BindUserID.119"): Intl.lang("BindUserID.120");
        return(
            <div className="panel-dialog shadow-w" id="bind_ID" style={{width:565}}>
                <div className="dialog-head">
                    <h3>{Intl.lang("BindUserID.lv_auth", lv)}</h3>
                    <i className="iconfont icon-close transit" onClick={this.close}></i>
                </div>
                <div className="dialog-content">
                    <form action="" className="manage-password-bos" onSubmit={this.handdleSubmit}>
                        {grade == 1 ?
                            <div>
                                <h5>{Intl.lang("BindUserID.100")}</h5>
                                <div className="input-normal w400-h40 mt-10"><input className="fem" type="text" name="" ref="userName" placeholder={Intl.lang("BindUserID.112")}/>
                                </div>
                                <div className="input-normal w400-h40 mt-20"><input className="fem" type="text" name="" ref="userId" placeholder={Intl.lang("BindUserID.113")}/>
                                </div>
                                <h5 className="mt-30">{Intl.lang("BindUserID.101")}</h5>
                                <dl className="identity-box mt-10 f-clear">
                                    <dd className="fl" style={this.state.preImg? {display:"none"}:null}>
                                        <input type="file" name="FileToUploadA" id="FileToUploadA" className="filetoupload file-input" onChange={(e)=>this.changeUploadFile(1,e)}/>
                                        <i className="iconfont icon-add fem-225"></i><span>{Intl.lang("BindUserID.102")}</span>
                                    </dd>
                                    <dd className="fl" style={this.state.preImg? null:{display:"none"}}>
                                        <img src="" id="img_1" width="180px" height="100px;"/>
                                    </dd>
                                    <dd className="fr" style={this.state.aftImg? {display:"none"}:null}>
                                        <input type="file" name="FileToUploadB" id="FileToUploadB" className="filetoupload file-input" onChange={(e)=>this.changeUploadFile(2,e)}/>
                                        <i className="iconfont icon-add fem-225"></i><span>{Intl.lang("BindUserID.103")}</span>
                                    </dd>
                                    <dd className="fr" style={this.state.aftImg? null:{display:"none"}}>
                                        <img src="" id="img_2" width="180px" height="100px;"/>
                                    </dd>
                                </dl>
                                <div className="mt-30">
                                    <button className="btn btn-green fem125 w400-h50">{Intl.lang("BindUserID.104")}</button>
                                </div>
                            </div>
                            :
                            <div>
                                <dl className="form-box f-clear lh-40">
                                    <dt className="tl">{Intl.lang("BindUserID.105")}</dt>
                                    <dd>{UserInfo.RealName|| "--"}</dd>
                                </dl>
                                <dl className="form-box f-clear lh-40">
                                    <dt className="tl">{Intl.lang("BindUserID.106")}</dt>
                                    <dd>{UserInfo.PassportId || "--"}</dd>
                                </dl>
                                <div className="input-normal w400-h40 mt-10"><input className="fem" type="text" name="" ref="userAddress" placeholder={Intl.lang("BindUserID.114")}/>
                                </div>
                                <div className="mt-20 f-clear">
                                    <div className="input-normal w220-h40 fl">
                                        <input className="fem" type="text" name="" ref="userCity" placeholder={Intl.lang("BindUserID.115")}/>
                                    </div>
                                    <div className="fl country-contain">
                                         <CountryCode defaultValue={'86'} ref="userCountry" onChange={(value)=>this.changeCountry(value)}/>
                                    </div>
                                </div>
                                <dl className="identity-box mt-20 f-clear">
                                    <dd className="fl" style={this.state.preImg? {display:"none"}:null}>
                                        <input type="file" name="FileToUploadA" id="FileToUploadA" className="filetoupload file-input" onChange={(e)=>this.changeUploadFile(3,e)}/>
                                        <i className="iconfont icon-add fem-225"></i><span>{Intl.lang("BindUserID.107")}</span>
                                    </dd>
                                    <dd className="fl" style={this.state.preImg? null:{display:"none"}}>
                                        <img src="" id="img_3" width="180px" height="100px;"/>
                                    </dd>
                                    <dd className="fr" style={this.state.aftImg? {display:"none"}:null}>
                                        <input type="file" name="FileToUploadB" id="FileToUploadB" className="filetoupload file-input" onChange={(e)=>this.changeUploadFile(4,e)}/>
                                        <i className="iconfont icon-add fem-225"></i><span>{Intl.lang("BindUserID.108")}</span>
                                    </dd>
                                    <dd className="fr" style={this.state.aftImg? null:{display:"none"}}>
                                        <img src="" id="img_4" width="180px" height="100px;"/>
                                    </dd>
                                </dl>
                                <div className="mt-30">
                                    <button className="btn btn-green fem125 w400-h50">{Intl.lang("BindUserID.104")}</button>
                                </div>
                            </div>
                        }
                    </form>
                    <div className="dialog-des-tip">
                        <h5>{Intl.lang("BindBank.104")}</h5>
                        {grade == 1 ?
                        <p>{Intl.lang("BindUserID.109")}</p>
                            :
                        <p>{Intl.lang("BindUserID.110")}<br/>{Intl.lang("BindUserID.111")}</p>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default connectToStore(userIDStore)(BindUserID);