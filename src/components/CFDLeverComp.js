import React from 'react';

import LeverComp from "./LeverComp";
import CfdTradeModel from '../model/cfd-trade';

export default function CFDLeverComp(props) {
    const {value, onChange, product} = props;

    var options = CfdTradeModel.getLeverOptions(product);
    var max = options[options.length-1];

    return (
        <LeverComp min={1} max={max} step={1} options={options} value={value} onChange={onChange} hideTitle={true}
                   contrainerComp={(slider, spotBox, textList)=>{
                       return <div className="leverageSection">
                           {slider}
                           <ul className="leverage-text flex-space-between">
                               {textList.map((v, i)=>{
                                   return <li key={i}>{v+'x'}</li>
                               })}
                           </ul>
                           {spotBox}
                       </div>}}
                   sliderComp={({ ...rest })=>{
                       return <div className="slider-dio" {...rest}><i className="iconfont icon-edit fs14 point"></i></div>
                   }}
                   spotBoxComp={({list, val, width, ...rest})=>{
                       return <ul className="leverage flex-space-between" {...rest}>
                               {list.map((v, i)=>{
                                   return <li className={v==val? 'on':''} key={i}></li>
                               })}
                               <div style={{width: width+'%'}} className="leverage-bg"></div>
                           </ul>
                   }}
        />
    )
}
