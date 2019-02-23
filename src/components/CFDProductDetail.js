import React from 'react';
import PureComponent from '../core/PureComponent';
import Intl from '../intl';
import PopDialog from "../utils/popDialog";
import ScrollArea from 'react-scrollbar';
import moment from 'moment';

import CfdTradeModel from '../model/cfd-trade';

export default class CFDProductDetail extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            showHours: false
        }
    }

    showTradingHours(flag, evt){
        evt = evt || window.event;
        evt.stopPropagation();

        this.setState({showHours:flag});
    }

    close() {
        PopDialog.closeByDomID('cfd-pDetail');
    }

    render(){
        const {product} = this.props, {showHours}=this.state;
        var contract = {};
        if (product){
            var currency = CfdTradeModel.getCurrency();
            var contracts = product.Contracts;
            var contracts = contracts.filter((v)=>v.Currency==currency);
            if (contracts.length) contract = contracts[0];
        }

        return <div className="exchange-mask details">
            <i className="iconfont icon-close m-hide" onClick={()=>this.close()}></i>
            <h3>{product ? product.DisplayName+"("+(contract?contract.Coin:"--")+")" : "--"}</h3>
            <ScrollArea className="details-content" style={{maxHeight:'580px'}}>
                <ul>
                    <li>{Intl.lang("TradeHistory.103")}</li>
                    <li>{product ? product.DisplayName : "--"}</li>
                </ul>
                {/*<ul>*/}
                    {/*<li>{Intl.lang("cfd.detail.exchange")}</li>*/}
                    {/*<li>{product.Exchange}</li>*/}
                {/*</ul>*/}
                <ul>
                    <li>{Intl.lang("cfd.detail.multiplier")}</li>
                    <li>{contract? contract.RealMultiplier:"--"}</li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.pointValue")}</li>
                    <li>{contract?contract.Multiplier + " "+contract.Coin:"--"}</li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.minPrice")}</li>
                    <li>{product ? product.MinTick : "--"}</li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.pip")}</li>
                    <li>{product ? product.Pip : "--"}</li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.maxLever")}</li>
                    <li>{product ? product.LeverMax +"x" : "--"}</li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.fee")}</li>
                    <li>{product ? Intl.lang("cfd.detail.point", product.Fee) : "--"}
                        <span><a href="/personal/viprights" target="_blank" className="camalar pdl-20">{Intl.lang("cfd.detail.vip")+" >"}</a></span>
                    </li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.swap")}</li>
                    <li>{product ? Intl.lang("cfd.detail.point", product.Swap) : "--"}</li>
                </ul>
                {(product && product.Group==2) ?
                    <ul>
                    <li>{Intl.lang("cfd.detail.tradingHours")}</li><li><span>{Intl.lang("cfd.detail.24hour")}</span></li>
                    </ul>
                    :
                    ((product && product.TradingDateTime) ?
                        <ul>
                            <li>{Intl.lang("cfd.detail.tradingHours")}</li><li><span className="camalar" onClick={(e)=>this.showTradingHours(!showHours,e)}>{Intl.lang("common.view")+" >"}</span></li>
                            {showHours &&<li>
                                <TradingHours dateTime={product.TradingDateTime} />
                            </li>}
                        </ul>
                    :
                        <ul>
                            <li>{Intl.lang("cfd.detail.tradingHours")}</li><li><span>{"--"}</span></li>
                        </ul>)

                }
                <ul>
                    <li>{Intl.lang("cfd.detail.TradingMonths")}</li>
                    <li>{product ? Intl.lang("cfd.detail.interval_"+product.TradingMonths) : "--"}</li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.expireDay")}</li>
                    <li>{product ? (product.RealExpirationDate ? moment(product.RealExpirationDate, "YYYYMMDD").format("YYYY-MM-DD") : Intl.lang("cfd.detail.noExpire")) : "--"}</li>
                </ul>
                <ul>
                    <li>{Intl.lang("cfd.detail.expirePrice")}</li>
                    <li>{product && product.RealExpirationDate ? (product.Country=="okc"?Intl.lang("cfd.detail.expireClose2", "OKCoin") : Intl.lang("cfd.detail.expireClose")) : Intl.lang("cfd.detail.noneExpire")}</li>
                </ul>
                {(contract && !!contract.ID) &&
                <ul>
                    <li>{Intl.lang("cfd.detail.maxVolume")}</li>
                    <li>{Intl.lang("cfd.detail.buyMaxVolume", Number(contract.MaxBidPosition), Number(contract.MaxAskPosition))}</li>
                </ul>}
            </ScrollArea>
        </div>
    }
}

function TradingHours(props) {
    const {dateTime} = props;
    let dateMap = {}, datas=[];

    if(dateTime){
        for (var i=0,l=dateTime.length; i<l; i++){
            let info = dateTime[i], wd="", len=info.length;

            info.forEach((mt, j)=>{
                let w = mt.weekday();
                let d = mt.format('MM/DD');
                let h = mt.format('HH:mm');

                if (len==1){
                    dateMap[d]= {
                        week: w,
                        time: (d + " Closed")
                    };
                }else{
                    if (j==0){
                        wd = d;
                        if (dateMap[d]){
                            dateMap[d] = {
                                week: w,
                                time: dateMap[d].time + " "+ h
                            }
                        }else{
                            dateMap[d] = {
                                week: w,
                                time: d + " " + h
                            }
                        }
                    }else{
                        dateMap[wd] = {
                            week: dateMap[wd].week,
                            time: dateMap[wd].time + "-" + h
                        }
                    }
                }
            });
        }
        var count = 0;
        for(let k in dateMap){
            datas.push(dateMap[k]);
            count++;

            if (count>=7) break;
        }
    }
    return(
        <dl className="dateSel">
            {datas.map((item, int)=>{
                return <dd key={'t'+int}><span>{Intl.lang("common.week"+item.week)}</span><span>{item.time}</span></dd>
            })}
        </dl>
    )
}
