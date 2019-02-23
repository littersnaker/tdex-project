import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';

import PopDialog from "../utils/popDialog"

import Net from '../net/net';
import FutTradeModel from '../model/fut-trade';

class FuturesSeting extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            Shared: false,
            Merged: false
        }
    }

    componentWillMount() {
        this.loadSetting();
    }

    loadSetting(){
        var CID = this.getProductID();
        if (CID) Net.httpRequest("futures/scheme", {CID}, (data)=>{
            if (data.Status==0){
                this.setState(data.Data);
            }
        }, this);
    }

    getProductID(){
        var product;
        var products = FutTradeModel.getProduct(this.props.code);
        if (products) product = products[0];
        if (product){
            return product.ID;
        }
    }

    onChangeShareValue(e){
        e.stopPropagation();

        this.setState({Shared:!this.state.Shared});
    }

    onChangeMergedValue(e){
        e.stopPropagation();

        this.setState({Merged:!this.state.Merged});
    }

    onSubmit(e){
        e.preventDefault();
        e.stopPropagation();

        var CID = this.getProductID();
        var Options = {
            Shared: this.state.Shared,
            Merged: this.state.Merged
        }
        if (CID) Net.httpRequest("futures/scheme", {CID, Options}, (data)=>{
            if (data.Status==0){
                this.close();
            }
        }, this, 'put');
    }

    close(){
        PopDialog.close();
    }
    render(){
        const {Shared, Merged} = this.state;

        return(
            <section className="ft-panel-dialog shadow-w" id="futures-setting" style={{width: 500}}>
                <header className="dialog-head">
                    <h3>{Intl.lang("FuturesSeting.1")}</h3>
                    <i className="iconfont icon-close transit" onClick={this.close}></i>
                </header>
                <div className="">
                    <ul className="dialog-content-nav mt-10 f-clear">
                        <li className="current">{Intl.lang("FuturesSeting.2")}</li>
                    </ul>
                    <form className="ft-setting-box">
                        <dl className="ft-setting f-clear">
                            <dt>
                                {Intl.lang("FuturesSeting.3")}
                            </dt>
                            <dd>
                                <label className="switch-btn circle-style">
                                    <input className="checked-switch" type="checkbox" checked={Shared} onChange={this.onChangeShareValue.bind(this)}/>
                                    <span className="text-switch" data-yes="yes" data-no="no"></span>
                                    <span className="toggle-btn"></span>
                                </label>
                            </dd>
                        </dl>
                        <dl className="ft-setting f-clear">
                            <dt>
                                {Intl.lang("FuturesSeting.4")}
                            </dt>
                            <dd>
                                <label className="switch-btn circle-style">
                                    <input className="checked-switch" type="checkbox" checked={Merged} onChange={this.onChangeMergedValue.bind(this)}/>
                                    <span className="text-switch" data-yes="yes" data-no="no"></span>
                                    <span className="toggle-btn"></span>
                                </label>
                            </dd>
                        </dl>
                        <div className="mt-20 tc">
                            <button className="btn with-btn w400-h50 fem125" type="submit" onClick={this.onSubmit.bind(this)}>{Intl.lang("FuturesSeting.5")}</button>
                        </div>
                    </form>
                </div>
            </section>
        )
    }
}

export default FuturesSeting;