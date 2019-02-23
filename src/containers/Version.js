import React from 'react';
import PureComponent from "../core/PureComponent";

import Event from '../core/event';

//桌面版检查版本更新
export default class Version extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            msg: '正在检查更新……',
            percent:0
        };
    }

    componentWillMount() {
        Event.addListener(Event.EventName.VERSION_UPDATE, this.onUpdateVersion.bind(this), this);
    }

    componentDidMount() {
        if (typeof(ElectronExt)=='object' && ElectronExt.checkVersionUpdate){
            ElectronExt.checkVersionUpdate();
        }
    }

    onUpdateVersion(data){
        console.log(data);
        if (data.action=='download-progress'){
            this.setState({percent:data.data.percent});
        }else {
            this.setState({msg: data.data});
            if (data.action=='update-not-available'){
                ElectronExt.showLoginWindow();
            }
        }
    }

    render(){
        const {msg, percent} = this.state;
        return (
            <div className="version">
                <div className="bg"><div className="bar" style={{width:percent+"%"}}></div><span>{msg}</span></div>
            </div>
        )
    }
}