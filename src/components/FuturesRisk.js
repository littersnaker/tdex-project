import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';

import PopDialog from "../utils/popDialog"

class FuturesRisk extends PureComponent{
    constructor(props){
        super(props);

        this.state = {

        }
    }
    close(){
        PopDialog.close();
    }
    render(){
        return(
            <section className="ft-trade-panel shadow-w" id="futures-risk" style={{width: 480}}>
                <header className="dialog-head tc lh-25">
                    <h3 className="fem875 tb">调整 XBTUSD 合约的风险限额</h3>
                    <i className="iconfont icon-close transit fem875" onClick={()=>this.close()}></i>
                </header>
                <div className="ft-trade-content tc">
                    <div className="ft-dialog-sub-title">
                        <p>BitMEX 使用滑动递增的风险限额。对于 XBTUSD 合约，基础风险限额是 200 XBT。
                            对于每 100 XBT 的仓位限额增加，维持保证金以及起始保证金需增加 0.50%。
                        </p>
                        <p className="mt-10">更多详情请参阅 风险限额说明。</p>
                    </div>
                    <div className="mt-10 fem125">更改风险限额 (XBT)</div>
                    <div className="ft-dialog-info mt-10">
                        <div className="sliderbox futures-leverage-slider mt-10">
                            <div className="slider">
                                <div className="slider-dio"></div>
                            </div>
                            <div className="spot-box">
                                <span><i></i></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <div className="flex-box flex-jc fem75 leverage-slider-pr">
                                <span>1x</span>
                                <span>2x</span>
                                <span>5x</span>
                                <span>10x</span>
                                <span>20x</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 lh-32 tc ft-bd-78 f-clear">
                        <ul className="ft-dialog-risk fem75 f-clear">
                            <li>
                                <p>&nbsp;</p>
                                <p>当前值</p>
                                <p>新值</p>
                            </li>
                            <li>
                                <p>风险限额</p>
                                <p>300 XBT</p>
                                <p>200 XBT</p>
                            </li>
                            <li>
                                <p>维持保证金</p>
                                <p>1%</p>
                                <p>0.5%</p>
                            </li>
                            <li>
                                <p>起始保证金</p>
                                <p>1.5%</p>
                                <p>1%</p>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-10 fs0 ft-trade-panel-box">
                    <button className="btn ft-btn-x">取消</button>
                    <button className="btn ft-btn-b">确认新的限额  300 XBT</button>
                </div>
            </section>
        )
    }
}

export default FuturesRisk;