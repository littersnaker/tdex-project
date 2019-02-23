import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';
import Net from '../net/net';

import PureComponent from '../core/PureComponent'
import { isMobile } from '../utils/util';

export default class AssetApply extends PureComponent{
    constructor(props) {
        super(props);

        this.isMobile = isMobile();
        this.Tab = (this.props.location && this.props.location.query.hasOwnProperty("tab")) ? this.props.location.query.tab : 1;
        this.state = {
            tab: Number(this.Tab),
            token: this.props.location.query.token,
            isCancel: false
        }
    }
    componentWillMount(){
        this.confirmAsset();
    }
    confirmAsset(){
        const {token} = this.state;
        if(token){
            Net.httpRequest("wallet/confirm", {Token:token}, (data)=>{
                if (data.Status == 0){

                }else{
                    this.setState({isCancel:true});
                }
            }, this);
        }
    }
    getTxt(){
        const {tab, isCancel}=this.state;
        let Txt = {};
        if(!isCancel){
            Txt.theme = tab==1?Intl.lang("Withdrawals.success"):Intl.lang("Transfer.success");
            Txt.content = tab==1?Intl.lang("Withdrawals.apply.statue1"):Intl.lang("Transfer.apply.statue1");
        }else{
            Txt.theme = tab==1?Intl.lang("Withdrawals.fail"):Intl.lang("Transfer.fail");
            Txt.content = tab==1?Intl.lang("Withdrawals.apply.statue2"):Intl.lang("Transfer.apply.statue2");
        }
        return Txt;
    }
    render(){
        const {tab, isCancel}=this.state;
        const TxtObj = this.getTxt();
        return (
            <div className="inside-page-web">
                <div className="inside-web-part">
                    <div className="asset-apply">
                        <div className="applyIcon"><span className={"iconfont "+(isCancel?"icon-applyFail":"icon-applySucess on")}></span></div>
                        <div className="apply-title mt-30">{TxtObj.theme}</div>
                        <div className="apply-subTitle mt-20">{TxtObj.content}</div>
                        <Link to={tab==1?"withdrawals":"transfer"} className="btn btn-yellow mt-50 w350-h50 lh-50">{Intl.lang("TransferOTC.105")}</Link>
                    </div>
                </div>
            </div>
        )
    }
}
