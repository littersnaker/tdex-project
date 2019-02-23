import React from 'react';

import PureComponent from '../core/PureComponent';

import Event from '../core/event';

import CFDHistoryWallet from './CFDHistoryWallet';
import CFDPositionOrder from "./CFDPositionOrder";
import CFDLog from "./CFDLog";
import Intl from '../intl';
import CfdOrderPos from "../model/cfd-order-position";

export class CFDHistory extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            tab: 1
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLang.bind(this), this);
    }

    onChangeLang(){

    }

    changeTab(tab){
        if (this.state.tab!=tab){
            this.setState({tab});
        }
    }

    moveHeightEnd(){
        // if (this.posOrderRef){
        //     this.posOrderRef.moveHeightEnd();
        // }
        if (this.logRef){
            this.logRef.moveHeightEnd();
        }
    }

    render(){
        const {layoutName, height, isMobile} = this.props;
        const {tab} = this.state;

        const margin = !isMobile && layoutName()!='KlineDiv' ? "10px 0px" : "10px 10px";
        const dataHeigth = height-60-10;
        return <div className="trading-exchange-chart" style={{width:"100%",height:"100%"}} onContextMenu={(e)=>{e.preventDefault();e.stopPropagation();}}>
            <div className="trading-exchange-order fillet-global-config-auto" style={{height:dataHeigth+'px', width:"calc(100% - 10px)", margin}}>
                <HistoryTab tab={tab} onChange={this.changeTab.bind(this)}/>

                {(tab==1 || tab==2) && <CFDPositionOrder tab={tab} height={dataHeigth-46} ref={(c)=>this.posOrderRef=c}/>}
                {(tab==3 || tab==4) && <CFDLog tab={tab} height={dataHeigth-46} ref={(c)=>this.logRef=c}/>}
            </div>
            <CFDHistoryWallet />
        </div>
    }
}

class HistoryTab extends PureComponent{
    componentWillMount() {
        Event.addListener(Event.EventName.CFD_ORDER_UPDATE, this.onUpdateOrders.bind(this), this);
    }
    onUpdateOrders(){
        this.forceUpdate();
    }
    changeTab(tab){
        if (this.props.onChange) this.props.onChange(tab);
    }
    render(){
        const tabList = ["cfd.position", "cfd.order", "cfd.order.log", "cfd.position.log"];
        const {tab} = this.props;

        return <ul className="trading-exchange-order-tab-title">
            {tabList.map((v, i)=>{
                var stat = ""
                if (i==0 || i==1){
                    var len = 0;
                    if (i == 0){
                        len = CfdOrderPos.positionList.length;
                    }else if(i == 1){
                        len = CfdOrderPos.orderList.length;
                    }
                    stat = Intl.lang("common.bracket", len);
                }
                return <li className={tab==(i+1)?"active":""} key={"t"+i} onClick={this.changeTab.bind(this, i+1)}>{Intl.lang(v)+stat}</li>
            })}
        </ul>
    }

}
