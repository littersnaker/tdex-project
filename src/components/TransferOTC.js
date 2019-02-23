import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';

import PopDialog from '../utils/popDialog'
import {toast} from "../utils/common";

class TransferOTC extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {
            Type: 1
        };
    }
    componentWillMount(){

    }
    close(){
        PopDialog.close();
    }
    changeOption(e){
        if (e){
            e.preventDefault();
            e.stopPropagation();
        }
        var dom = e.target;
        const type = dom.value;
        if(type){
            this.setState({Type: type});
        }
    }
    getOption(){
        var options = [{Type:1, Name:Intl.lang("TransferOTC.102")}, {Type:2, Name:Intl.lang("TransferOTC.103")}];

        return options;
    }
    handdleSubmit=(e)=> {
        e.preventDefault();
        toast(Intl.lang("common.coming_soon"));
        return false;
    };
    render(){
        const { Type }= this.state;
        const Option = this.getOption();
        return (
            <div className="panel-dialog shadow-w" id="transfer_otc" style={{width:542}}>
                <div className="dialog-head">
                    <h3>{Intl.lang("TransferOTC.100")}</h3>
                    <i className="iconfont icon-close transit" onClick={this.close}></i>
                </div>
                <div className="dialog-content">
                    <form action="" className="bind-bank-box lh-50" onSubmit={this.handdleSubmit}>
                        <dl className="form-box mt-10 f-clear">
                            <dt>{Intl.lang("TransferOTC.101")}</dt>
                            <dd>
                                <span className="order-deep-select bind-bank-select custom-select">
                                     <select onChange={(e)=>this.changeOption(e)}>
                                         {Option.map((v, i)=>{
                                             return <option value={v.Type} key={i}>{v.Name}</option>
                                         })}
                                     </select>
                                    <i className="iconfont icon-dropDown select-icon"></i>
                                </span>
                            </dd>
                        </dl>
                        <dl className="form-box mt-20 f-clear lh-40">
                            <dt>{Intl.lang("TransferOTC.104")}</dt>
                            <dd>
                                <span className="order-deep-select bind-bank-select custom-select">
                                     <select>
                                         {Option.map((v, i)=>{
                                             if(Type!=v.Type)
                                             return <option value={v.Type} key={i}>{v.Name}</option>
                                         })}
                                     </select>
                                    <i className="iconfont icon-dropDown select-icon"></i>
                                </span>
                            </dd>
                        </dl>
                        <dl className="form-box mt-20 f-clear lh-40">
                            <dt>{Intl.lang("tradeInfo.1_11")}</dt>
                            <dd className="input-normal w350-h40 w-310">
                                <input className="fem" type="text" name="" placeholder={Intl.lang("tradeInfo.2_25")}/>
                            </dd>
                        </dl>

                        <div className="mt-30 tc">
                            <button className="btn btn-gray w400-h50 fem125">{Intl.lang("TransferOTC.105")}</button>
                        </div>
                    </form>
                </div>
                <div className="dialog-des-tip hide">
                    <h5>{Intl.lang("BindBank.104")}</h5>
                    <p>{Intl.lang("BindBank.105")}</p>
                </div>
            </div>
        )
    }
}

export default TransferOTC;