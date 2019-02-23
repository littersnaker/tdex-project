import Intl from '../intl';
import React from 'react';

import PureComponent from '../core/PureComponent';
import AccountModel from '../model/account'

import Net from '../net/net'
import PopDialog from  '../utils/popDialog'
import  { toast } from '../utils/common'


class ManageWalletAdd extends PureComponent{
    constructor(props){
        super(props);
        this.state= {
            addressList: []
        }
    }
    componentWillMount(){
        this.getuserAddressList()
    }
    // addressBind(){
    //     var self = this;
    //
    //     Net.httpRequest("wallet/bind", "", function(data){
    //         if (data.Status == 0) {
    //
    //         }
    //     }, this);
    // }
    getuserAddressList(){
        var type = this.props.type;
        var addList = AccountModel.getUserAddressList(type);
        if(addList) this.setState({addressList:addList});
    }
    setAddress(data){
        var list = [], Data = data.Data ? data.Data : data;
        for(var i in Data){
            if(Data[i] && Data[i].Type==1){
                list.push(Data[i]);
            }
        }
        if(list.length) this.setState({addressList: list});
    }
    
    // 刷新 钱包地址列表
    refreshAccountAddress(data){
        var refresh = AccountModel.setUserAddressList(data);

        return refresh;
    }

    removeAddress(addressId){
        var type = this.props.type;
        var self = this;

        var changeHandler = this.props.onChange;
        var data = {"AddressId":parseInt(addressId), "Type":parseInt(type)};
        Net.httpRequest("wallet/remove", data, function(data){
            if (data.Status == 0){
                self.refreshAccountAddress(data.Data);

                if (changeHandler){
                    changeHandler(data.Data, 'remove');
                }
                PopDialog.close();
            }
        }, this);
    }
    handleSubmit=(e)=>{
        e.preventDefault();

        var addre = this.refs.packetAddress.value;
        var address = addre.replace(/^\s+|\s+$/g,"");//去除字符串的前后空格，允许用户不小心输入前后空格
        var remark = this.refs.packetRemark.value;
        if(!address){
            toast(Intl.lang("ManageWalletAdd.108"),true);
            return false;
        }
        var type = parseInt(this.props.type), isDefault=false;

        var self = this;
        var changeHandler = this.props.onChange;
        var data = {"Address":address,"Remark":remark,"IsDefault":isDefault, "Type": type};
        Net.httpRequest("wallet/bind", data, function(data){
            if (data.Status == 0){
                if (changeHandler){
                    changeHandler(data.Data, "add");
                }
                PopDialog.close();
            }
        }, this);
    };

    close(){
        PopDialog.close();
    }
    render(){
        const { type } = this.props;
        var addList = this.state.addressList;
        return(
            <div className="panel-dialog shadow-w" id="manage_wallet_add">
                <div className="dialog-head">
                    <h3>{Intl.lang("ManageWalletAdd.100")}</h3>
                    <i className="iconfont icon-close transit" onClick={this.close}></i>
                </div>
                <div className="dialog-content">
                    <form className="manage-address-bos" onSubmit={this.handleSubmit}>
                        <dl className="form-box f-clear mt-20 border-bt-dash">
                            <dt className="lh-32">{Intl.lang("ManageWalletAdd.101")}</dt>
                            <dd className="lh-32">
                            {addList.length ? addList.map((item, index)=>{
                                    return <p className="mb-10" key={index}>
                                        <span className="address-bg fem75">{item.Address}</span>
                                        <span className="btn btn-normal ml-20" onClick={()=>{this.removeAddress(item.Id)}}>{Intl.lang("mails.1_2")}</span>
                                    </p>
                                }
                            ):
                                <p className="mb-10">---</p>
                            }
                            </dd>
                        </dl>
                        <dl className="form-box f-clear mt-30 lh-40">
                            <dt>{Intl.lang("ManageWalletAdd.102")}</dt>
                            <dd>
                                <div className="numberBox w435-h40"><input className="w435-h40 fem" type="text" name="packetAddress" ref="packetAddress" placeholder={Intl.lang("ManageWalletAdd.106")}/></div>
                            </dd>
                        </dl>
                        <dl className="form-box f-clear mt-20 lh-40">
                            <dt>{Intl.lang("ManageWalletAdd.103")}</dt>
                            <dd>
                                <div className="numberBox w435-h40"><input className="w435-h40 fem" type="text" name="packetRemark" ref="packetRemark" maxLength={8} placeholder={Intl.lang("ManageWalletAdd.107")}/></div>
                            </dd>
                        </dl>
                        <dl className="form-box f-clear mt-30 mb-30">
                            <dt>&nbsp;</dt>
                            <dd>
                                <button className="btn btn-blue fem125 w435-h40 h-50">{Intl.lang("ManageWalletAdd.104")}</button>
                            </dd>
                        </dl>
                    </form>
                    <div className="dialog-des-tip">
                        <h5>{Intl.lang("BindBank.104")}</h5>
                        <p className="">{Intl.lang("ManageWalletAdd.105")}</p>
                    </div>
                </div>
            </div>
        )
    }
}

export default ManageWalletAdd