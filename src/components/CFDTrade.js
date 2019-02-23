import React from 'react';
import PureComponent from '../core/PureComponent';
import ReactGridLayout from "../lib/react-grid-layout-m/index";
import '../css/grid-layout.css';

import ExpertHeader from './ExpertHeader'

import CFDKlineDiv from './CFDKlineDiv'
import {CFDHistory} from './CFDHistory';
import CFDRightPanel from './CFDRightPanel'

import AuthModel from '../model/auth';
import ErrorBoundary from "./ErrorBoundary";
import {CONST} from "../public/const";
import PopDialog from "../utils/popDialog"

const $ = window.$;

export default class CFDTrade extends PureComponent{
    constructor(props){
        super(props);

        this.preferenceKey = "cfd_lo";
        this.prefUpdateHKey = "cfd_uh";

        this.isDrag = false;
        this.updateH = AuthModel.loadPreference(this.prefUpdateHKey, 0);

        this.layoutName = AuthModel.loadPreference(this.preferenceKey, "KlineDiv");
        var conf = this.getRGLConf(this.layoutName);

        this.state = {
            ...conf
        }
    }

    getMinWidth(){
        // return Intl.getLang()=='en-us' ?  : 1080;
        return 1220;
    }

    getRGLConf(name){
        name = name=="CFDProducts" ? "CFDProducts" : "KlineDiv";

        var formWidth = 370;     //右边表单固定宽度
        var midSpace = 0; //k线与订单列表中间bar的高度，k线与右边表单中间bar的宽度

        var winWidth = $(window).width();
        var winHeight = $(window).height();
        winWidth = winWidth > this.getMinWidth() ? winWidth : this.getMinWidth();

        var headerHeight = 50+10+1; //头部固定高度
        var height = winHeight - headerHeight;
        var historyHeight = 320 - this.updateH; //历史记录固定高度+paddingTop

        var layouts;
        var  klineH = height - historyHeight-midSpace;
        if (klineH < 200){
            klineH = 200;
            historyHeight = height - klineH - midSpace;
        }
        historyHeight = historyHeight < 150 ? 150 : historyHeight;

        //只提供两种布局
        layouts = {
            "KlineDiv":[
                {i: 'KlineDiv', x: 0, y: 0, w: winWidth-formWidth-midSpace, h: height - historyHeight-midSpace},
                // {i: 'horizontalBar', x:0, y: height - historyHeight-midSpace, w:winWidth-formWidth-midSpace, h:midSpace},
                {i: 'CFDHistory', x: 0, y: height-historyHeight, w: winWidth-formWidth-midSpace, h: historyHeight},
                // {i: 'verticalBar', x:winWidth-formWidth-midSpace, y:0, w:midSpace, h:height},
                {i: 'CFDProducts', x: winWidth-formWidth, y: 0, w: formWidth, h: height}
            ],
            "CFDProducts":[
                {i: 'CFDProducts', x:0, y: 0, w: formWidth, h: height},
                // {i:'verticalBar', x:formWidth, y:0, w:midSpace, h:height},
                {i: 'KlineDiv', x: formWidth, y: 0, w: winWidth-formWidth-midSpace, h: height - historyHeight-midSpace},
                // {i: 'horizontalBar', x:formWidth+midSpace, y: height - historyHeight-midSpace, w:winWidth-formWidth-midSpace, h:midSpace},
                {i: 'CFDHistory', x: formWidth, y: height-historyHeight, w: winWidth-formWidth-midSpace, h: historyHeight}
            ]
        };
        // }

        var layout = layouts[name];
        return {layout, width:winWidth, height, historyHeight};
    }

    componentDidMount() {
        $(window).on('resize', this.onWindowResize);
        // window.addEventListener("resize", );

        this.onWindowResize();
    }

    onWindowResize = () => {
        var conf = this.getRGLConf(this.layoutName);

        if (this.state.width!=conf.width || this.state.height!=conf.height){
            this.setState(conf);
        }
    };

    componentWillUnmount() {
        $(window).off('resize', this.onWindowResize);

        PopDialog.closeAll();
        // window.removeEventListener("resize", this.onWindowResize);
    }

    dragStart = (e)=>{
        e.preventDefault();
        e.stopPropagation();

        if (!this.isDrag){
            this.currentY = e.screenY;
            this.isDrag = true;
            // $("#tv_chart_container").css("zIndex", -10);
            $("#klineMask").removeClass("hide");

            $(document).on('mouseup', this.dragEnd);
            $(document).on('mousemove', this.dragMove);

            // console.log("dragStart");
        }
    }
    dragMove = (e)=>{
        e.preventDefault();
        e.stopPropagation();

        if (this.isDrag){
            var currentY = e.screenY;
            this.updateH = this.updateH + currentY - this.currentY;
            this.currentY = currentY;

            var conf = this.getRGLConf(this.layoutName);
            this.setState(conf);

            // console.log("dragMove:"+ this.updateH);
        }
    }
    dragEnd = (e)=>{
        e.preventDefault();
        e.stopPropagation();

        if (this.isDrag) {
            $("#klineMask").addClass("hide");
            this.isDrag = false;
            $(document).off('mousemove', this.dragMove);
            $(document).off('mouseup', this.dragEnd);

            AuthModel.savePreference(this.prefUpdateHKey, this.updateH);
            if (this.hRef) this.hRef.moveHeightEnd();
        }
        // console.log("dragEnd");
    }
    onDragStart(){
        $("#klineMask").removeClass("hide");
    }
    onDragStop(layout){
        $("#klineMask").addClass("hide");

        layout.sort((a, b)=>{
            if (a.x>=b.x && a.y>=b.y) return 1;
            else return -1;
        });
        var lo = layout[0];
        if (lo && lo.i!=this.layoutName){
            this.layoutName = lo.i;
            AuthModel.savePreference(this.preferenceKey, this.layoutName);

            if (this.hRef) this.hRef.forceUpdate();
            if (this.rRef) this.rRef.forceUpdate();
            if (this.kRef) this.kRef.forceUpdate();

            var conf = this.getRGLConf(this.layoutName);
            return conf.layout;
        }
        return false;
    }
    getLayoutName(){
        return this.layoutName;
    }

    render(){
        const {user, uInfo, code} = this.props;
        const {layout, width, height, historyHeight} = this.state;

        // const bgConfig = this.getBackgroundConfig();
        // var self = this;

        // console.log(layout);
        return (
            <div className="trading-exchange-config" style={{minWidth:this.getMinWidth(), overflow:"auto"}}>
                <ExpertHeader className="futures-bg-primary header-box trading-exchange-head" loginBoxClassName="login-box f-clear" user={user} uInfo={uInfo} code={code} entry={CONST.TRADE_TYPE.CFG}/>

                <ReactGridLayout className="trading-exchange-body" layout={layout} cols={width} rowHeight={1} width={width} containerPadding={[0, 0]} margin={[0, 0]} draggableHandle=".move" isResizable={false} compactType="horizontal" onDragStart={this.onDragStart.bind(this)} onDragStop={this.onDragStop.bind(this)}>
                    <div key="KlineDiv" className="KlineDiv futures-bg-primary"><CFDKlineDiv code={code} layoutName={this.getLayoutName.bind(this)} ref={(hr)=>this.kRef=hr} /></div>
                    <div key="CFDHistory" className="CFDHistory">
                        <ErrorBoundary showError={true}><CFDHistory layoutName={this.getLayoutName.bind(this)} ref={(hr)=>this.hRef=hr} height={historyHeight}/></ErrorBoundary>
                        <div className="pos-a curs-nr" style={{top:0, width:"100%", height:"10px"}} onMouseDown={this.dragStart}></div>
                    </div>
                    <div key="CFDProducts" className="CFDProducts">
                        <ErrorBoundary showError={true}><CFDRightPanel layoutName={this.getLayoutName.bind(this)} ref={(rr)=>this.rRef=rr} code={code} height={height} /></ErrorBoundary>
                        <div className="move" style={{top:"46px", width:"40px", height:"40px"}}></div>
                    </div>
                </ReactGridLayout>

                <span id="drag-order-panel"></span>
            </div>
        )
    }
}
