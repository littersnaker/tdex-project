import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';
// import RGL, { WidthProvider } from "../lib/react-grid-layout-new/index";
// import RGL, { WidthProvider } from "../lib/react-grid-layout/index";
import ReactGridLayout from "../lib/react-grid-layout-m/index";
// import ReactGridLayout from 'react-grid-layout';
// import 'react-grid-layout/css/styles.css';
import '../css/grid-layout.css';

import ExpertHeader from './ExpertHeader'
import KlineDiv from './KlineDiv';

import {FuturesHistory} from './FuturesHistory'
// import FuturesCloseOrderBook from './FutCloseOrderBook'
// import FuturesCommOrderBook from './FutCommOrderBook';
// import FuturesTradeForm from './FuturesTradeForm'
import FuturesRightPanel from './FuturesRightPanel'

import AuthModel from '../model/auth';
import FutTradeModel from '../model/fut-trade';
import ErrorBoundary from "./ErrorBoundary";
import {CONST} from "../public/const";

// const ReactGridLayout = WidthProvider(RGL);

const $ = window.$;

class FutTradeExpert extends PureComponent{
    constructor(props){
        super(props);

        this.SkinMore = FutTradeModel.skinMore;
        this.klineTheme = FutTradeModel.getSkin();

        this.preferenceKey = "fut_lo";
        this.prefUpdateHKey = "uh";

        this.isDrag = false;
        this.updateH = AuthModel.loadPreference(this.prefUpdateHKey, 0);

        this.layoutName = AuthModel.loadPreference(this.preferenceKey, "KlineDiv");
        var conf = this.getRGLConf(this.layoutName);

        this.state = {
            isExpert: FutTradeModel.loadSetting("isExpert"),
            klineTheme: this.klineTheme,
            ...conf
        }
    }

    getMinWidth(){
        // return Intl.getLang()=='en-us' ?  : 1080;
        return 1220;
    }

    getRGLConf(name){
        name = name=="FuturesNewOrder" ? "FuturesNewOrder" : "KlineDiv";
        // var baseWinWidth = 1920;
        // var baseWinHeight = 1094;

        var formWidth = 325;     //右边表单固定宽度
        var midSpace = 8; //k线与订单列表中间bar的高度，k线与右边表单中间bar的宽度

        var winWidth = $(window).width();
        var winHeight = $(window).height();
        winWidth = winWidth > this.getMinWidth() ? winWidth : this.getMinWidth();

        var headerHeight = 51+3; //头部固定高度
        var height = winHeight - headerHeight - 4;
        var historyHeight = 236 - this.updateH; //历史记录固定高度+paddingTop

        var layouts;
        // if (winWidth < 583){
        //     var klineH = parseInt((height - historyHeight - midSpace)/2);
        //     var wbf = winWidth>formWidth;
        //     var rightH = height-(klineH+midSpace+historyHeight);
        //     layouts = {
        //         "KlineDiv":[
        //             {i: 'KlineDiv', x: 0, y: 0, w: winWidth, h: klineH},
        //             {i: 'horizontalBar', x:0, y: klineH, w:winWidth, h:midSpace},
        //             {i: 'FuturesHistory', x: 0, y: klineH+midSpace, w: winWidth, h: historyHeight},
        //             {i:'verticalBar', x:0, y:klineH+midSpace+historyHeight, w:wbf?winWidth-formWidth:winWidth, h:wbf?rightH:midSpace},
        //             {i: 'FuturesNewOrder', x: 0, y:wbf?klineH+midSpace+historyHeight:(klineH+midSpace+historyHeight+midSpace), w: formWidth, h: wbf?rightH:(height-(klineH+midSpace+historyHeight+midSpace))}
        //         ],
        //         "FuturesNewOrder":[
        //             {i: 'FuturesNewOrder', x:0, y: 0, w: formWidth, h: height},
        //             {i:'verticalBar', x:formWidth, y:0, w:midSpace, h:height},
        //             {i: 'KlineDiv', x: formWidth+midSpace, y: 0, w: winWidth-formWidth-midSpace, h: height - historyHeight-midSpace},
        //             {i: 'horizontalBar', x:formWidth+midSpace, y: height - historyHeight-midSpace, w:winWidth-formWidth-midSpace, h:midSpace},
        //             {i: 'FuturesHistory', x: formWidth+midSpace, y: height-historyHeight, w: winWidth-formWidth-midSpace, h: historyHeight}
        //         ]
        //     };
        // }else{
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
                    {i: 'horizontalBar', x:0, y: height - historyHeight-midSpace, w:winWidth-formWidth-midSpace, h:midSpace},
                    {i: 'FuturesHistory', x: 0, y: height-historyHeight, w: winWidth-formWidth-midSpace, h: historyHeight},
                    {i: 'verticalBar', x:winWidth-formWidth-midSpace, y:0, w:midSpace, h:height},
                    {i: 'FuturesNewOrder', x: winWidth-formWidth, y: 0, w: formWidth, h: height}
                ],
                "FuturesNewOrder":[
                    {i: 'FuturesNewOrder', x:0, y: 0, w: formWidth, h: height},
                    {i:'verticalBar', x:formWidth, y:0, w:midSpace, h:height},
                    {i: 'KlineDiv', x: formWidth+midSpace, y: 0, w: winWidth-formWidth-midSpace, h: height - historyHeight-midSpace},
                    {i: 'horizontalBar', x:formWidth+midSpace, y: height - historyHeight-midSpace, w:winWidth-formWidth-midSpace, h:midSpace},
                    {i: 'FuturesHistory', x: formWidth+midSpace, y: height-historyHeight, w: winWidth-formWidth-midSpace, h: historyHeight}
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
        // window.removeEventListener("resize", this.onWindowResize);
    }

    getBackgroundConfig(){
        const bgConfig = {
            'gray':{
                // 'kLine':{position: "absolute", top:54, right: 528, width: "calc(100% - 521px)", height: "calc(100% - 309px)"},
                'kLine':{width: "100%", height:"100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            },
            'primary':{
                // 'kLine':{position: "absolute", top:54, right: 528, width: "calc(100% - 521px)", height: "calc(100% - 309px)"},
                'kLine':{width: "100%", height: "100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            },
            'white':{
                // 'kLine':{position: "absolute", top:54, right: 528, width: "calc(100% - 521px)", height: "calc(100% - 309px)"},
                'kLine':{width: "100%", height: "100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            },
            'default':{
                'kLine':{width: "100%", height: "100%", overflow: "hidden"},
                'history':{width: "100%", height:"100%"},
                'hist_log':{ width: "100%", height: "100%"},
                'book':{ width: "100%", height: "100%"},
                'form':{ width: "100%", height: "100%"},
                'order':{ width: "100%", height: "100%"},
            }
        };
        return bgConfig[this.klineTheme];
    }
    changeSetting(value, isSkin){
        if(isSkin){
            //if(value=="white") return toast("敬请期待");
            this.klineTheme = value;
            this.setState({klineTheme: value});
            AuthModel.savePreference("klineTheme", value);
        }
    }
    changeExpertMode(mode){
        var isExpert = !!mode;
        if (this.state.isExpert != isExpert){
            FutTradeModel.saveSetting("isExpert", isExpert);
            this.setState({isExpert})
        }
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
            this.refs.futuresHistory.moveHeightEnd();
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

            var conf = this.getRGLConf(this.layoutName);
            return conf.layout;
        }
        return false;
    }
    render(){
        const {user, uInfo, code} = this.props;
        const {layout, width, height, historyHeight,isExpert} = this.state;

        const bgConfig = this.getBackgroundConfig();
        var self = this;

        // console.log(layout);
        return (
            <div className={"futures-pos bounds f-oh unselect futures-bg-"+this.klineTheme} style={{minWidth:this.getMinWidth(), overflow:"auto"}}>
                <ExpertHeader user={user} uInfo={uInfo} skinInfo={this.SkinMore} code={code} entry={CONST.TRADE_TYPE.FUT} isExpert={isExpert} onChange={this.changeSetting.bind(this)} onChangeExpert={this.changeExpertMode.bind(this)} />

                {/*<ReactGridLayout className="layout" layout={layout} windowWidth={1920} windowHeight={1094-50} cols={1920} rowHeight={1} width={1920} containerPadding={[3, 0, 0, 0]} margin={[0, 0]} draggableHandle=".move" onLayoutChange={this.onLayoutChange.bind(this)}>*/}
                <ReactGridLayout id="futures_trade_container" className="layout bounds f-oh" layout={layout} cols={width} rowHeight={1} width={width} containerPadding={[0, 3]} margin={[0, 0]} draggableHandle=".move" isResizable={false} compactType="horizontal" onDragStart={this.onDragStart.bind(this)} onDragStop={this.onDragStop.bind(this)}>
                    <div key="KlineDiv" className="KlineDiv"><KlineDiv style={bgConfig.kLine} code={code} entry={CONST.TRADE_TYPE.FUT} className="futures-c ft-bd-78 widget" theme={this.klineTheme} /></div>
                    <div key="horizontalBar" className="placeholder1 curs-nr"><div style={{width: "100%", height: "100%"}} onMouseDown={this.dragStart}></div></div>
                    {/*<div key="horizontalBar" className="placeholder1"><div style={{width: "100%", height: "100%"}}></div></div>*/}
                    <div key="FuturesHistory" className="FuturesHistory"><ErrorBoundary showError={true}><FuturesHistory ref="futuresHistory" className="futures-fullTrade-history widget" style={bgConfig.history} code={code} isExpert={isExpert} height={historyHeight}/></ErrorBoundary></div>
                    <div key="verticalBar" className="placeholder1"><div style={{width: "100%", height: "100%"}}></div></div>
                    <div key="FuturesNewOrder" className="FuturesNewOrder"><FuturesRightPanel className="ft-order-box pd010 fs11 widget" style={bgConfig.order} code={code} isExpert={isExpert} /><div className="move" style={{top:0, width:"320px", height:"25px"}}></div></div>
                    {/*
                    <div key="FuturesCommOrderBook" className="FuturesCommOrderBook"><FuturesCommOrderBook className="futures-book-box widget" style={bgConfig.book} code={code} isExpert={true} /><div className="move" style={{top:0,right:0, width:"30px", height:"30px"}}></div></div>
                    <div key="FuturesCloseOrderBook" className="FuturesCloseOrderBook"><FuturesCloseOrderBook className="futures-book-box widget" style={bgConfig.book} code={code} isExpert={true}/><div className="move" style={{top:0,right:0, width:"30px", height:"30px"}}></div></div>
                    <div key="FuturesTradeForm" className="FuturesTradeForm"><FuturesTradeForm className="futures-fullTrade-panel-box widget" style={bgConfig.form} code={code} isExpert={true} /><div className="move" style={{top:0,right:0, width:"30px", height:"30px"}}></div></div>
                     */}
                </ReactGridLayout>
                {/*<div style={{backgroundColor:"#fff"}}>*/}
                {/*<ReactGridLayout className="layout" cols={5} rowHeight={30} width={500} containerPadding={[0,0]} margin={[0,5]} verticalCompact={false}>*/}
                    {/*<div key="a" data-grid={{x: 0, y: 0, w: 1, h: 2}} margin={[5, 5]} style={{backgroundColor:"#aaa"}}>a</div>*/}
                    {/*<div key="b" data-grid={{x: 1, y: 2, w: 3, h: 2, minW: 2, maxW: 4}} style={{backgroundColor:"#aaa"}}>b</div>*/}
                    {/*<div key="c" data-grid={{x: 4, y: 2, w: 1, h: 2}} style={{backgroundColor:"#aaa"}}>c</div>*/}
                {/*</ReactGridLayout>*/}
                {/*</div>*/}
                <span id="drag-order-panel"></span>
            </div>
        )
    }
}

export default FutTradeExpert;
