import React from 'react';
import PureComponent from '../core/PureComponent';

import KlineDiv from './KlineDiv'
import {CONST} from "../public/const";

export default class CFDKlineDiv extends PureComponent{
    constructor(props){
        super(props);

        this.state = {

        }
    }

    render(){
        const {code, layoutName, isMobile} = this.props;

        var left = '10px';
        if (isMobile || layoutName()!='KlineDiv'){
            left = '0px';
        }
        return <div className="trading-chart-library fillet-global-config" style={{width:"calc(100% - 10px)",height:"100%", left}}>
            <KlineDiv code={code} entry={CONST.TRADE_TYPE.CFG} style={{width: "100%", height: "100%", overflow: "hidden"}} theme="cfd" className="futures-c ft-bd-78 widget"/>
        </div>
    }
}
