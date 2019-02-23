import Intl from '../intl';
import React from 'react';

import Store from '../core/store';
import connectToStore from '../core/connect-to-store';
import GlobelStore from '../stores'
import PureComponent from '../core/PureComponent';
import storeTypes from '../core/storetypes';

import Net from '../net/net'
import PopDialog from  '../utils/popDialog'
import  { toast } from '../utils/common'
import AccountModel from '../model/account';
import Valiate from '../utils/valiate'
// import Auth from '../model/auth'

const bankStore = Store({
    tab: 1,
    mobileCodeSec: 0,
    error:''
}, storeTypes.BINDBANK);

class BindBank extends PureComponent{
    constructor(props){
        super(props);
        this.state ={
            Province: "110000",
            userInfo: {}
        }
    }
    componentWillMount(){
        var userInfo = GlobelStore.getUserInfo();
        this.setState({userInfo: userInfo});
    }
    changeProvince(e){
        e.preventDefault();

        this.setState({Province: this.refs.province.value});
    }
    handdleSubmit=(e)=>{
        e.preventDefault();

        var bankId = this.refs.bankId.value;
        var cardId = this.refs.cardID.value.replace(/\s/g,"");
        var province = this.refs.province.value;
        var city = this.refs.city.value;
        var bankSubName = this.refs.bankSubName.value;
        if(!bankId || !cardId || !province || !city || !bankId){
            toast(Intl.lang("BindBank.108"), 1);
            return false;
        }

        var self = this,  callback = this.props.onChange;
        Valiate.cnbankcard(cardId, function(data){
            if (data.bankName){
                var bname =  self.refs.bankId.selectedOptions[0].text
                if (data.bankName.indexOf(bname)!=-1) {

                    var data = {"BankId":parseInt(bankId),"CardNo":cardId,"Province":province,"City":city,"BankName":bankSubName,"IsDefault":true};
                    Net.httpRequest("bank/bindCard", data, function(data){
                        if (data.Status == 0) {
                            if(callback) callback();
                            self.close();
                        }
                    }, self);
                }else{
                    toast(Intl.lang("bindAuth.2_61"), true);
                }
            }else{
                toast(Intl.lang("bindAuth.2_57"), true);
            }
        });
    };
    close(){
        PopDialog.close();
    }
    render(){
        var bankList = AccountModel.getWithdrawalsBankList();
        var provinceList = AccountModel.getProvinceList();
        var cityList = AccountModel.getCityList(this.state.Province);

        const { RealName } = this.state.userInfo;

        return(
            <div className="panel-dialog shadow-w" id="bind_bank" style={{width:545}}>
                <div className="dialog-head">
                    <h3>{Intl.lang("newTask.step2_2")}</h3>
                    <i className="iconfont icon-close transit" onClick={this.close}></i>
                </div>
                <div classNameName="dialog-content">
                    <form className="bind-bank-box" onSubmit={this.handdleSubmit}>
                        <dl className="form-box f-clear lh-40">
                            <dt>{Intl.lang("BindBank.100")}</dt><dd>{RealName}</dd>
                        </dl>
                        <dl className="form-box mt-10 f-clear">
                            <dt>{Intl.lang("BindBank.101")}</dt>
                            <dd>
                                <span className="order-deep-select bind-bank-select custom-select">
                                    <select name="bankName" ref="bankId">
                                        {bankList && bankList.map(function(item, index) {
                                            return <option value={item.id} key={index} ref="bankName">{item.Name}</option>
                                        })}
                                    </select>
                                    <i className="iconfont icon-dropDown select-icon"></i>
                                </span>
                            </dd>
                        </dl>
                        <dl className="form-box mt-20 f-clear lh-40">
                            <dt>{Intl.lang("BindBank.102")}</dt>
                            <dd className="input-normal w350-h40 w-310">
                                <input className="fem" type="text" name="cardID" ref="cardID" placeholder={Intl.lang("BindBank.106")}/>
                            </dd>
                        </dl>
                        <dl className="form-box mt-20 f-clear lh-40">
                            <dt>{Intl.lang("BindBank.103")}</dt>
                            <dd>
                                <span className="order-deep-select double-sel custom-select">
                                    <select className="sw" name="province" ref="province" onChange={(e)=>this.changeProvince(e)}>
                                        {provinceList && provinceList.map(function(item,index){
                                            return <option value={item.Code} key={index}>{item.Name}</option>
                                        })}
                                    </select>
                                    <i className="iconfont icon-dropDown select-icon"></i>
                                </span>
                                <span className="order-deep-select double-sel custom-select">
                                    <select className="sw" name="city" ref="city">
                                        {cityList && cityList.map(function(item, index){
                                            return <option value={item.Code} key={index}>{item.Name}</option>
                                        })}
                                    </select>
                                    <i className="iconfont icon-dropDown select-icon"></i>
                                </span>
                            </dd>
                        </dl>
                        <dl className="form-box mt-20 f-clear lh-40">
                            <dt>&nbsp;</dt>
                            <dd className="input-normal w350-h40 w-310">
                                <input className="fem" type="text" name="bankSubName" ref="bankSubName" placeholder={Intl.lang("BindBank.107")}/>
                            </dd>
                        </dl>
                        <div className="mt-30 tc">
                            <button className="btn btn-green w400-h50 fem125">{Intl.lang("accountSafe.2_153")}</button>
                        </div>
                    </form>
                </div>
                <div className="dialog-des-tip">
                    <h5>{Intl.lang("BindBank.104")}</h5>
                    <p>{Intl.lang("BindBank.105")}</p>
                </div>
            </div>
        )
    }
}

export default connectToStore(bankStore)(BindBank);