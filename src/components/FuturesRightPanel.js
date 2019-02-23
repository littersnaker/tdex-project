import React from 'react';

import FutTradeModel from "../model/fut-trade";
import AuthModel from "../model/auth";
import Event from "../core/event";
import ReactDOM from "react-dom";
import PureComponent from "../core/PureComponent";

import Dragger from '../lib/react-dragger-r/index';

import ErrorBoundary from "./ErrorBoundary";

import ScrollArea from 'react-scrollbar';

import FutNewOrder from "./FuturesNewOrder";
import FutDepthOrderBook from "./FuturesDepthBook";
import FutCloseOrderBook from "./FuturesCloseOrderBook"
import FutContractDetail from "./FuturesContractDetail";


//期货默认右面板

var $ = window.$;
export default class FuturesRightPanel extends PureComponent {
    constructor(props) {
        super(props);

        this.domIndex = 0;
        this.nextInd = null;
        this.domHeight = 0;
        this.startMove = false;
        this.domDiv = null;

        this.preferenceKey = 'fno';

        var state = this.initState(this.props);

        this.state = {
            //expanded: AuthModel.loadPreference(this.preferenceKey, true),
            ...state,
            heightMap: [{h:387},{h:310},{h:81},{h:243}],
            expandKey: ''
        }
    }
    initState(props){
        const code = props.code;
        if (code){
            var products = FutTradeModel.getProduct(props.code);
            if (products){
                return {
                    products,
                    componentMap: AuthModel.loadPreference('FtTradeComponent') || [1,2,3,4],
                }
            }
        }
        return {
            products: [],
            componentMap: [1,2,3,4]
        }
    }

    // getStyle(expanded){
    //     return expanded ? {height:"calc(100% - 30px)", transition:"height 300ms"} : {height:0, transition:"height 300ms"}
    // }

    componentWillReceiveProps(nextProps) {
        var code = nextProps.code;
        if (code != this.props.code) {
            if (!this.props.code){
                var state = this.initState(nextProps);
                this.setState(state);
            }else{
                this.onProductUpdate(nextProps.code);
            }
        }
    }

    componentWillMount() {
        Event.addOnce(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);
    }

    onProductUpdate(code){
        code = typeof(code)=="string" ? code : this.props.code;
        if (code) this.setState({products: FutTradeModel.getProduct(code)});
    }
    //toggle() {
    //    var expanded = !this.state.expanded;
    //    this.setState({expanded}, ()=>{
    //        if (this.state.expanded) this.refs.formScrollArea.scrollArea.refresh();
    //    });
    //
    //    AuthModel.savePreference(this.preferenceKey, expanded);
    //}
    sortComponent(index, dir){
        if(!dir) return false;

        var newMap = this.state.componentMap, j;

        if(dir=="Up"){
            j = newMap[index];
            newMap[index] = newMap[index-1];
            newMap[index-1] = j;
        }else if(dir=="Down"){
            j = newMap[index];
            newMap[index] = newMap[index+1];
            newMap[index+1] = j;
        }
        if(dir){
            this.setState({componentMap:newMap});
            AuthModel.savePreference('FtTradeComponent', newMap);   //console.log(newMap);
        }
        //console.log(dir+":"+index, newMap);
    }

    dragStart(event, index){
        event.preventDefault();   // console.log(index);

        this.domIndex = index;
        this.domHeight = $('.newOrder-drag'+this.domIndex).height()+10;
        this.domDiv = $('.newOrder-drag'+this.domIndex);
    }
    dragEnd(event, X, Y){
        event.preventDefault();

        var dragDir = Y<-50 ? "Up" : Y>50? "Down" : false;

        this.sortComponent(this.domIndex, dragDir);
        this.resetTransate(0);
    }
    dragMove(event, X, Y){
        event.preventDefault();

        var h = this.domHeight, nextInd;

        if(this.domIndex!=0 && Y<-50){      // Up
            this.startMove = 1;
            nextInd = this.domIndex - 1;
        }else if(this.domIndex!=3 && Y>50){     // down
            this.startMove = 2;
            nextInd = this.domIndex + 1;
            h = -h;
        }else if(this.startMove==1 || this.startMove==2){
            nextInd = this.nextInd;
            h = 0;
        }

        if (nextInd!==undefined){
            //if(this.nextInd != nextInd){
            this.nextInd = nextInd;
            this.domDiv = $('.newOrder-drag'+this.nextInd);        // console.log("do");
            //}

            if(this.startMove==1 || this.startMove==2){
                this.resetTransate(h);
            }

            console.log(X, Y, h, "nextInd:"+this.nextInd);
        }
    }
    resetTransate(h){
        if(this.domDiv){
            var arg = h!==0 ? 'translate(0, '+ h +'px)' : 'none';  // console.log('h:'+ h);
            this.domDiv.css({'transform': arg});
        }
    }
    dragEndChange(key, param){
        if(key=="open"){
            this.popNewPanel(param);
        }else if(key=="close"){
            this.closeNewOpen(param);
        }else if(key=="reset"){
            this.setState({expandKey: ""});
        }else if(key=="refreshScroll"){
            this.refs.formScrollArea.scrollArea.refresh();
        }
    }
    popNewPanel(param){

        var product = this.state.products[0];
        var key = param[1], element;
        if(key=="FutCommOrderBook"){
            element = <FutDepthOrderBook product={product} isExpert={true} ind={param[0]} open={true} onChange={(key,param)=>{this.dragEndChange(key,param)}} />
        }else if(key=="FutCloseOrderBook"){
            element = <FutCloseOrderBook product={product} isExpert={true} ind={param[0]} open={true} onChange={(key,param)=>{this.dragEndChange(key,param)}} />
        }else if(key=="FutContractDetail"){
            element = <FutContractDetail product={product} isExpert={true} ind={param[0]} open={true} onChange={(key,param)=>{this.dragEndChange(key,param)}} />
        }
        ReactDOM.render(
            <Dragger className="dragDiv-openBg" bounds="parent" isPop={true} hasDraggerHandle={true} style={{margin:10}}>
                <ErrorBoundary showError={true}>{element}</ErrorBoundary>
            </Dragger>,
            document.getElementById('drag-order-panel')
        );

        $('#klineMask').removeClass('hide');
    }
    closeNewOpen(param){
        ReactDOM.unmountComponentAtNode(document.getElementById('drag-order-panel'));

        if(param) this.setState({expandKey: param[0]});

        $('#klineMask').addClass('hide');
    }

    render() {
        const {style, className, isExpert} = this.props;
        const {expanded, products, componentMap, expandKey} = this.state;
        const product = products[0];
        var self = this;

        return (
            <div className={className} style={style}>
                <div className="header-title flex-box flex-jc mt-5">
                    <h5 className="fs11 hide">&nbsp;</h5>
                </div>
                <div style={{height:"calc(100% - 8px)", transition:"height 300ms"}}>
                    <ScrollArea className="t5-sa" contentClassName="order-content" ref="formScrollArea">
                        <div className="ft-order-market">
                            {componentMap.map((v, i)=>{
                                var ind = i;
                                if(v==1) return <Dragger key={i} className={"dragDiv-bg newOrder-drag"+i} hasDraggerHandle={true} allowY={true} bounds="parent" resetXY={true} onDragStart={(e, i)=>{this.dragStart(e, ind)}} onDragEnd={(e,x,y)=>this.dragEnd(e,x,y)} onMove={(e, x, y)=>this.dragMove(e, x, y)}>
                                    <ErrorBoundary showError={true}><FutNewOrder product={product} isExpert={isExpert} expandKey={expandKey} onChange={(key,param)=>{this.dragEndChange(key,param)}} ind={i}/></ErrorBoundary>
                                </Dragger>
                                else if(v==2) return <Dragger key={i} className={"dragDiv-bg newOrder-drag"+i} hasDraggerHandle={true} allowY={true} bounds="parent" resetXY={true} onDragStart={(e, i)=>{this.dragStart(e, ind)}} onDragEnd={(e,x,y)=>this.dragEnd(e,x,y)} onMove={(e, x, y)=>this.dragMove(e, x, y)}>
                                    <ErrorBoundary showError={true}><FutDepthOrderBook product={product} isExpert={true} expandKey={expandKey} onChange={(key,param)=>{this.dragEndChange(key,param)}} ind={i}/></ErrorBoundary>
                                </Dragger>
                                else if(v==4) return <Dragger key={i} className={"dragDiv-bg newOrder-drag"+i} hasDraggerHandle={true} allowY={true} bounds="parent" resetXY={true} onDragStart={(e, i)=>{this.dragStart(e, ind)}} onDragEnd={(e,x,y)=>this.dragEnd(e,x,y)} onMove={(e, x, y)=>this.dragMove(e, x, y)}>
                                    <ErrorBoundary showError={true}><FutCloseOrderBook product={product} isExpert={true} expandKey={expandKey} onChange={(key,param)=>{this.dragEndChange(key,param)}} ind={i}/></ErrorBoundary>
                                </Dragger>
                                else if(v==3) return <Dragger key={i} className={"dragDiv-bg newOrder-drag"+i} hasDraggerHandle={true} allowY={true} bounds="parent" resetXY={true} onDragStart={(e, i)=>{this.dragStart(e, ind)}} onDragEnd={(e,x,y)=>this.dragEnd(e,x,y)} onMove={(e, x, y)=>this.dragMove(e, x, y)}>
                                    <ErrorBoundary showError={true}><FutContractDetail product={product} isExpert={true} expandKey={expandKey} onChange={(key,param)=>{this.dragEndChange(key,param)}} ind={i}/></ErrorBoundary>
                                </Dragger>}

                            )}

                            {/*<FutNewOrderComp product={product} isExpert={true}/>*/}
                            {/*<FutCommOrderBook product={product} isExpert={true}/>*/}
                            {/*<FutCloseOrderBook product={product} isExpert={true} />*/}
                            {/*<FutContractDetail product={product} isExpert={true}/>*/}

                        </div>
                    </ScrollArea>
                </div>
            </div>
        )
    }
}
