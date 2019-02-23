import React from 'react';

import PureComponent from '../core/PureComponent';

import CfdOrderPos from "../model/cfd-order-position";

import Intl from "../intl";
import AuthModel from "../model/auth";
import Pager from './Pager'
import {CONST} from "../public/const";

const $ = window.$;
//持仓历史和委托历史
export default class CFDLog extends PureComponent{
    constructor(props){
        super(props);

        var currencys = [];

        this.initState = {
            columns: this.getColumns(this.props.tab),
            currencys,
            history:{
                Total:0,
                PageCount:0,
                Page:1,
                PageSize:this.getHistoryPageSize(),
                List:[]
            },
            pHistory:{
                Total:0,
                PageCount:0,
                Page:1,
                PageSize:this.getHistoryPageSize(),
                List:[]
            },
        };

        this.state = this.initState;
    }

    componentWillMount() {
        this.onChangeTab(this.props.tab);
    }

    // componentDidMount() {
        // window.addEventListener("mousedown", this.hideContextMenu);
    // }

    componentWillReceiveProps(nextProps) {
        if (this.props.tab!=nextProps.tab){
            this.onChangeTab(nextProps.tab);
        }
    }

    componentWillUnmount(){
        // window.removeEventListener("mousedown", this.hideContextMenu);

        super.componentWillUnmount();
    }

    onChangeTab(tab){
        if (tab==3){
            this.loadHistory(1, this.getHistoryPageSize())
        }else if(tab==4){
            this.loadPositionHistory(1, this.getHistoryPageSize())
        }
        this.setState({columns: this.getColumns(tab)});
    }

    getColumns(tab){
        if (tab == 3){
            return [{name:"CreatedAt", display:"trade.history.CreatedAt_O"},
                {name:"PID", display:"trade.history.PID_O"},
                {name:"CName", display:"trade.history.CName_O"},
                {name:"CurrencyTxt", display:"trade.history.CurrencyTxt"},
                {name:"SideTxt", display:"trade.history.SideTxt_O"},
                {name:"ScaleTxt", display:"trade.history.ScaleTxt_O"},
                {name:"VolumeDesc", display:"trade.history.VolumeDesc_O"},
                {name:"TypeDesc", display:"trade.history.TypeDesc_O"},
                {name:"OrderPrice", display:"trade.history.OrderPrice_O"},
                {name:"DealPrice", display:"trade.history.DealPrice_O"},
                {name:"TimelyDesc", display:"trade.history.TimelyDesc_O"},
                {name:"StateTxt", display:"trade.history.StateTxt_O"},
            ];
        }else{
            return [{name:"ID", display:"trade.history.ID", width:"7%"},
                {name:"CName", display:"trade.history.CName", width:"7%"},
                {name:"CurrencyTxt", display:"trade.history.CurrencyTxt", width:"7%"},
                {name:"SideTxt", display:"trade.history.SideTxt", width:"7%"},
                {name:"ScaleTxt", display:"trade.history.ScaleTxt", width:"7%"},
                {name:"Volume", display:"trade.history.Volume", width:"7%"},
                {name:"PriceDesc", display:"trade.history.PriceDesc", width:"7%"},
                {name:"MarginTotalDesc", display:"trade.history.MarginTotalDesc", width:"7%"},
                {name:"OperateDesc", display:"trade.history.TypeDesc_O", width:"7%"},
                {name:"DealPrice", display:"trade.history.DealPrice_O", width:"7%"},
                {name:"ProfitDesc", display:"trade.history.tab5_t14", width:"7%"},
                {name:"ChargeFeeDesc", display:"trade.history.ChargeFeeDesc", width:"7%"},
                {name:"Swap", display:"trade.history.Swap", width:"7%"},
                {name:"CreatedAt", display:"trade.history.CreatedAt_O", width:"10%"}
                ];
        }
    }

    loadHistory(page, pageSize){
        if (!AuthModel.checkUserAuth()) return;

        if (!pageSize) pageSize = this.state.history.PageSize

        CfdOrderPos.loadHistory(page, pageSize, this, (history)=>{
            this.setState({history});
        });
    }
    loadPositionHistory(page, pageSize){
        if (!AuthModel.checkUserAuth()) return;

        if (!pageSize) pageSize = this.state.history.PageSize;

        CfdOrderPos.loadPositionHistory(page, pageSize, "", this, (pHistory)=>{
            this.setState({pHistory});
        });
    }
    turnPage(page, pageSize){
        if (this.props.tab==3){
            this.loadHistory(page)
        }else if(this.props.tab==4){
            this.loadPositionHistory(page)
        }
    }

    getHistoryPageSize(){
        var pageSize = parseInt((this.props.height-42-36)/32);
        return pageSize>0 ? pageSize : 1;
    }
    moveHeightEnd(){
        if (this.props.tab==3){
            this.loadHistory(1, this.getHistoryPageSize());
        }else if(this.props.tab==4){
            this.loadPositionHistory(1, this.getHistoryPageSize());
        }
    }

    render(){
        const {style, height, tab} = this.props;
        // const dataHeight = height - 32 - 10;
        const {history, pHistory, columns, currencys} = this.state;

        var colLen = columns.length;
        const logData = tab==4?pHistory:history;
        const noData = !logData || !logData.Total;

        return <React.Fragment>
            <ul className="item-title">
                {columns && columns.map((v, i)=>{
                    var style = v.width ? {width:v.width}:{};
                    var columnTxt = Intl.lang(v.display);
                    return <li key={"cl"+i} style={style}>{columnTxt}</li>
                })}
            </ul>
            <div className="tab-content-auto" style={{height:(height-42)+"px"}}>
                {!noData && logData.List.map((data, m)=>{
                    return <ul className="item-content" key={"cc"+m}>
                        {columns && columns.map((v, i)=>{
                            var style = v.width ? {width:v.width}:{};
                            var className;
                            if (v.name=="SideTxt"){
                                className = data["Side"]==CONST.FUT.Side.BUY?"exchange-green":"exchange-red";
                            }else if(name=="ProfitLossDesc"){
                                className= Number(data["ProfitLoss"])>0 ? "exchange-green":(Number(data["ProfitLoss"])<0?"exchange-red":"")
                            }

                            return <li key={"cv"+i} style={style} className={className}>{data[v.name]}</li>
                        })}
                    </ul>
                })}
                {!noData ? (<div className="futures-bg-primary" style={{backgroundColor:"#22272b"}}><Pager data={logData} onChange={this.turnPage.bind(this)}/></div>)
                    :
                    (<div className="no-list-data mt-50">
                    <div className="no-list-data-pic"></div>
                    <p className="mt-10 c-8">{Intl.lang("bank.1_27")}</p>
                </div>)}
            </div>
        </React.Fragment>
    }
}
