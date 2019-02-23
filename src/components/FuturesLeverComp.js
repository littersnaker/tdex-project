import React from 'react';

import LeverComp from "./LeverComp";
import FutTradeModel from "../model/fut-trade";

export default function FutLeverComp(props) {
    const {value, onChange} = props;
    return (
        <LeverComp min={0.01} max={20} options={FutTradeModel.formVar.leverOptions} widths={['5.2','17.4', '29', '41', '53', '65', '76.6', '88.6']} value={value} onChange={onChange}
                   contrainerComp={(slider, spotBox, textList)=>{
                       return <div className="mt-10 pos-r tr">
                       <div className="sliderbox futures-leverage-slider ver-md mr-30">
                       <div className="slider">
                           {slider}
                       </div>
                       {spotBox}
                       <div className="flex-box flex-jc fs11 leverage-slider-pr">
                           {
                               textList.map((v, i) => {
                                   return <span key={i}>{v + 'x'}</span>
                               })
                           }
                       </div>
                       </div>
                       </div>}}
                   sliderComp={({ ...rest })=>{
                       return <div className="slider-dio" {...rest}><i className="iconfont icon-edit fs14 point"></i></div>
                   }}
                   spotBoxComp={({list, val, percent, ...rest})=>{
                       return <div className="spot-box" {...rest}>{list.map((v, i) => {
                           return <span className={v == val ? 'on' : ''} key={i}></span>
                       })}</div>
                   }}
        />
    )
}
