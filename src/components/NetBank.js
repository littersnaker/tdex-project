import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';

import PopDialog from  '../utils/popDialog'

class NetBank extends PureComponent{
    constructor(props){
        super(props);
    }
    componentDidMount(){
        var data = this.props.data;
        // this.setState({Data: data});

        var htmlCode = data.PayHTML;
        // 1. 创建<iframe>元素
        var Iframe = document.createElement('iframe');
        Iframe.width = 1050 +"px";
        Iframe.height = 650 +"px";
        // 2. 将CSS，HTML字符串转换为Blob对象
        var blob = new Blob([htmlCode], {
            'type': 'text/html'
        });
        // 3. 使用URL.createObjectURL()方法将...
        Iframe.src = URL.createObjectURL(blob);

        this.refs["iframeBox"].appendChild(Iframe);

        window.open(htmlCode, "_blank");
    }
    close(){
        PopDialog.close();
    }
    render(){
        return (
            <div className="panel-dialog shadow-w" id="net_bank" style={{width:1054}}>
                <div className="dialog-head">
                    <h3>{Intl.lang("NetBank.100")}</h3>
                    <i className="iconfont icon-close transit" onClick={this.close}></i>
                </div>
                <div classNameName="dialog-content"><div ref="iframeBox"></div>

                </div>
            </div>
        )
    }
}

export default NetBank;
