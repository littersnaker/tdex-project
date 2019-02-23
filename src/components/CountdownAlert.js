import Intl from '../intl';
import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from '../core/PureComponent';
import {formatDuring} from '../utils/util'
import PopDialog from "../utils/popDialog";

//倒计时警告框
export default class CountdownAlert extends PureComponent{
    static defaultProps = {
        title: "",
        contentLang: "{1}",
        sec: 0,
        className: "",
    };

    static propTypes = {
        title: PropTypes.string.isRequired,
        contentLang: PropTypes.string.isRequired, //内容的语言key
        sec:PropTypes.number.isRequired,       //计时秒数
        className: PropTypes.string,
        callback: PropTypes.func //设置callback会出现关闭按钮，不设置强制倒计时完成后关闭
    };

    constructor(props) {
        super(props);
        // 初始状态

        this.timer = 0;

        this.state = {
            sec: this.props.sec
        };
    }

    componentDidMount() {
        this.showCountDown();
    }

    showCountDown(){
        if (this.timer){
            clearInterval(this.timer);
        }

        var self = this;
        this.timer = setInterval(() => {
            if (self.state.sec){
                self.setState({sec: self.state.sec-1});
            }else{
                self.close();
            }
        }, 1000);
    }

    componentWillUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }
    }

    close(){
        PopDialog.close();
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }
        if (this.props.callback) this.props.callback();
    }

    render() {
        const {skin, title, contentLang, className, callback} = this.props;
        const {sec} = this.state;

        const timeStr = formatDuring(sec*1000);
        return (
            <div className={"shadow-w alertbox"+(skin ? " "+skin:"")} id="cd_alert_panel" style={{width:420}}>
                <div className="panel-dialog shadow-w m-w320">
                    {title && <div className="dialog-head">
                        <h3>{title}</h3>
                        {callback && <i className="iconfont icon-close transit" onClick={this.close}></i>}
                    </div>
                    }
                    <div className="dialog-content">
                        <div className="pd-30 tc">
                            <div className="pdb-30"><img src={process.env.PUBLIC_URL+"/images/cup.png"} width="60"/> </div>
                            <div className="wdba" dangerouslySetInnerHTML={{__html: Intl.lang(contentLang, timeStr.substr(3))}}></div>

                            {callback && <div className="mt-30">
                                <button className="btn btn-blue2 w-100 h-30 mg-015" onClick={this.close}>{Intl.lang("common.confirm")}</button>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}