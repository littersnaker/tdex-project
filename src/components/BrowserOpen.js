import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';

class BrowserOpen extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {}
    }
    closeBrowser(){
        this.props.closeBrowser();
    }
    render() {
        const {content} = this.props;
        const strTxt = content || Intl.lang("app.download.weixin");
        return (
            <div onClick={this.closeBrowser.bind(this)} className="m-downLoad-mask tc">
                <div className="iconfont icon-share fem-275"></div>
                <div dangerouslySetInnerHTML={{__html: strTxt}}></div>
            </div>
        )
    }
}

export default BrowserOpen;