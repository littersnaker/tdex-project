import React from 'react';
import PureComponent from "../core/PureComponent";
import AuthModel from "../model/auth";

export default class Support extends PureComponent {

    requestsNew = () => AuthModel.getHelpCenterUrl()+"/requests/new";

    render() {
        const requestsLink = this.requestsNew();
        return (
            <a href={requestsLink}target="_blank" className="support-style-config">
                <i className="iconfont icon-suport" />
            </a>
        )
    }
}