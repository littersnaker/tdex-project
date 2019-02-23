import Intl from '../intl';
import React from 'react';
import PureComponent from "../core/PureComponent";

import FutTradeModel from '../model/fut-trade';
import PopDialog from "../utils/popDialog"

export default class FutTradeThemeSetting extends PureComponent {
    constructor(props) {
        super(props);

        this.isSimple = props.isExpert;
        this.skinTheme = FutTradeModel.getSkin();
        this.skinInfo = FutTradeModel.skinMore;
        this.state = {
            modeTab: this.isSimple || 0,
            skinTheme: this.skinTheme
        }
    }
    componentWillUnmount(){
        super.componentWillUnmount();
    }
    componentWillMount() {

    }
    changeExpertMode(isExpert){
        this.setState({modeTab: isExpert});
    }
    changeSkin(skin){
        this.setState({skinTheme:skin});
    }
    handleSubmit(event){
        event.stopPropagation();
        event.preventDefault();

        let { modeTab, skinTheme } = this.state;
        let params = {
            modeTab: modeTab,
            skinTheme: skinTheme
        };

        this.props.onChange(params);
    }
    close(){
        PopDialog.close();
    }
    render(){
        const {modeTab, skinTheme} = this.state;
        let skinInfo = this.skinInfo, skinName=[Intl.lang("trade.theme.1"),Intl.lang("trade.theme.2"),Intl.lang("trade.theme.3")];

        return (
            <React.Fragment>
                <section className={"ft-trade-easy-panel shadow-w futures-bg-"+skinTheme} id="themeSkin-setting">
                    <header className="dialog-head tc lh-25">
                        <i className="iconfont icon-close transit fem875" onClick={this.close.bind(this)}></i>
                    </header>
                    <div className="ft-easy-dialog-detail">
                        <div className="tc">
                            <h3>{Intl.lang("trade.setting")}</h3>
                        </div>
                        <form className="ft-theme-setting" onSubmit={(e)=>{this.handleSubmit(e)}}>
                            <dl>
                                <dt>{Intl.lang("common.theme")}</dt>
                                <dd>
                                    {skinInfo.map((item, index)=> {
                                        return <label className="custom-label" key={"skin"+index}>
                                            <input className="custom-radio" type="radio" name="skin-type" onClick={()=>this.changeSkin(item, index)} defaultChecked={item==skinTheme?"checked":false} />
                                            <span className={"custom-radioInput "+(item==skinTheme?"on":"")}></span><span>{skinName[index]}</span>
                                        </label>
                                    })}
                                </dd>
                            </dl>
                            <dl>
                                <dt>{Intl.lang("common.edition")}</dt>
                                <dd>
                                    <label className="custom-label" onClick={()=>this.changeExpertMode(0)}>
                                        <input className="custom-radio" type="radio" name="theme-type" defaultChecked={!modeTab?"checked":false}/>
                                            <span className={"custom-radioInput "+(!modeTab?"on":"")}></span><span>{Intl.lang("NavBar.normal")}</span>
                                    </label>
                                    <label className="custom-label" onClick={()=>this.changeExpertMode(1)}>
                                        <input className="custom-radio" type="radio" name="theme-type" defaultChecked={modeTab?"checked":false}/>
                                            <span className={"custom-radioInput "+(modeTab?"on":"")}></span><span>{Intl.lang("NavBar.major")}</span>
                                    </label>
                                </dd>
                            </dl>
                            <div className="easy-dialog-foot mt-50">
                                <button className="btn easy-btn-submit wp-100">{Intl.lang("common.confirm")}</button>
                            </div>
                        </form>
                    </div>
                </section>
            </React.Fragment>
        )
    }
}