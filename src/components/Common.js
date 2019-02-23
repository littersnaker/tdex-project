/**
 * 公用组件
 */
'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from '../core/PureComponent';

import Intl from '../intl';
import PopDialog from "../utils/popDialog"

class Confirm extends PureComponent {
    static propTypes = {
        title: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        callback: PropTypes.func,
    };
    constructor(props) {
        super(props);

        this.callbackHandler = this.props.callback;
        this.cancelFunc = this.props.cancel;
        this.discript = this.props.desc;

        this.state = {
            title: this.props.title,
            content: this.props.content
        }
    }
    handleClick(){
        if (this.callbackHandler){
            this.callbackHandler();
        }
        PopDialog.close("pn_alert_panel");
    }
    cancelBtn(){
        this.close();
    }
    close(){
        if (this.props.cancel){
            this.props.cancel();
        }
        PopDialog.close("pn_alert_panel");
    }
    render(){
        const { skin, isExpert, isNew, disCancel } = this.props;
        let yesTxt = this.props.yestxt ? this.props.yestxt : Intl.lang("common.confirm");
        let noTxt = this.props.notxt ? this.props.notxt : Intl.lang("common.cancel");
        return (
            isExpert?
            <div className="spot-trading-tips-config" id="alert_panel">
                <h3>{this.state.title}</h3>
                <p className="spot-trading-tips-text" dangerouslySetInnerHTML={{__html:this.state.content}}></p>
                <p className="spot-trading-tips-btn">
                    <button onClick={this.handleClick.bind(this)}>{yesTxt}</button>
                    {this.callbackHandler &&
                    <button className="active" onClick={this.cancelBtn.bind(this)}>{noTxt}</button>}
                </p>
                <div className="spot-trading-tips-icon-close iconfont icon-close" onClick={this.close.bind(this)}></div>
            </div>
                :
                isNew?
                <div className="new-dialog panel-dialog" id="alert_panel">
                    <div className="new-dialog-detail tc">
                        <h3>{this.state.title}</h3>
                        <p className="new-dialog-text" dangerouslySetInnerHTML={{__html:this.state.content}}></p>
                        <div className="new-dialog-footer">
                            <button onClick={this.handleClick.bind(this)}>{yesTxt}</button>
                            {(this.callbackHandler && !disCancel) &&
                            <button className="active" onClick={this.cancelBtn.bind(this)}>{noTxt}</button>}
                        </div>
                        <div className="iconfont icon-close transit" onClick={this.close.bind(this)}></div>
                    </div>
                </div>
                    :
                <div className={"shadow-w alertbox"+(skin ? " "+skin:"")} id="alert_panel">
                    <div className="panel-dialog shadow-w m-w320">
                        <div className="dialog-head">
                            <h3>{this.state.title}</h3>
                            <i className="iconfont icon-close transit" onClick={this.close.bind(this)}></i>
                        </div>
                        <div className="dialog-content">
                            <div className="pd30-60 c-8 m-pd20">
                                <div className="w-350 wdba" dangerouslySetInnerHTML={{__html:this.state.content}}></div>

                                <div className="mt-30 tc">
                                    <button className="btn btn-blue2 dialog-btn mg-015" onClick={this.handleClick.bind(this)}>{yesTxt}</button>
                                    {this.callbackHandler &&
                                    <button className="btn btn-warning dialog-btn mg-015" onClick={this.cancelBtn.bind(this)}>{noTxt}</button>}
                                </div>
                            </div>
                        </div>
                        {this.discript &&
                        <div className="dialog-des-tip">
                            <h5>{Intl.lang("BindBank.104")}</h5>
                            <div className="pd20 scur" dangerouslySetInnerHTML={{__html:this.discript}}></div>
                        </div>
                        }
                    </div>
                </div>
        )
    }
}

export {Confirm};
