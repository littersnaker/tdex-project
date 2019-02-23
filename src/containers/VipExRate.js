import React from 'react';
import PureComponent from '../core/PureComponent';
import {Link} from 'react-router';

import Intl from '../intl';
import Net from "../net/net";
import Event from '../core/event';
import ProductModel from "../model/product";
import Decimal from '../utils/decimal';
import DatePicker from 'react-datepicker';
import moment from 'moment'
import {CONST} from "../public/const";
import {toast} from "../utils/common";
import CrumbsLink from "../components/CrumbsLink";
import Pager from "../components/Pager";

export default class VipRights extends PureComponent {
    constructor(props) {
        super(props);

        this.path = [
            {pathLink: '/personal', pathName: Intl.lang("NavBar.104")},
            {pathLink: '/personal/viprights', pathName: Intl.lang("Vip.user.grade")},
            {pathLink: '/personal/ExRate', pathName: Intl.lang("Vip.exRate.theme","TD")}
        ];
        this.hasDate = false;
        this.state = {
            startDate: null,
            endDate: null,

            tdRateHistory: []
        }
    }
    componentWillUnmount(){
        super.componentWillUnmount();
    }
    componentDidMount(){
        this.getTdRateHistory();
    }
    getTdRateHistory(page=1){
        let params = {Page:page, PageSize:10};

        if(this.hasDate){
            const {startDate, endDate} = this.state;
            //if(startDate.format("YYYYMMDD") > endDate.format("YYYYMMDD")){
            //    return toast(Intl.lang("error.date"), true);
            //}
            params.BeginTime = startDate.format("YYYY-MM-DD");
            params.EndTime = endDate.format("YYYY-MM-DD");
        }
        Net.httpRequest('user/deductionHistory', params , (data)=>{
            if (data.Status == 0) {
                var info = data.Data;
                let param = this.hasDate ? {'tdRateHistory': info} : {'tdRateHistory': info, startDate: null, endDate: null};
                this.setState(param);
            }
        }, this);
    }
    endDateChange(date) {
        this.setState({endDate: date});
    }
    startDateChange(date) {
        this.setState({startDate: date});
    }
    selectPeriod(isDate){
        const {startDate , endDate} = this.state;
        if(isDate && (startDate || endDate)) {
            if (!startDate || !endDate) {
                toast(Intl.lang("error.date"), true);
                return false;
            }
        }
        this.hasDate = isDate;
        this.getTdRateHistory(1);
    }
    turnPage(page){
        this.getTdRateHistory(page);
    }
    render(){
        const { startDate, endDate, tdRateHistory } = this.state, { isMobile } = this.props;
        return(
            <div className="inside-page-web">
                <div className="inside-web-part Vip-rights-section">
                    <CrumbsLink pathData={this.path}/>
                    <div className="tab-data-list">
                        {isMobile ?<div className="selection-date-config">
                            <div className="selection-date-config-box">
                                <DatePicker dateFormat="YYYY-MM-DD"
                                            selected={startDate}
                                            locale="zh-gb"
                                            minDate={moment().subtract(1, 'year')}
                                            maxDate={endDate || moment()}
                                            onChange={this.startDateChange.bind(this)}
                                            readOnly={true}
                                            placeholderText={Intl.lang("common.startDate")} />
                                <p>{Intl.lang('selection.date.config')}</p>
                                <DatePicker dateFormat="YYYY-MM-DD"
                                            locale="zh-gb"
                                            selected={endDate}
                                            minDate={startDate || moment().subtract(11, 'month')}
                                            maxDate={moment()}
                                            onChange={this.endDateChange.bind(this)}
                                            readOnly={true}
                                            placeholderText={Intl.lang("common.endDate")} />
                            </div>
                            <button onClick={this.selectPeriod.bind(this,true)} className="btn date-picket-box-btn">{Intl.lang("Asset.111")}</button>
                            <p className="selection-time-config-box">
                                <span></span><span></span><span></span>
                                <span onClick={this.selectPeriod.bind(this,false)} className="current">{Intl.lang("connect.1_1")}</span>
                            </p>
                        </div>
                            :
                        <div className="selection-date-config">
                            <span className="date-picket-box">
                                <i className="iconfont icon-date pdl-5 pos-a" />
                                <DatePicker dateFormat="YYYY-MM-DD"
                                            selected={startDate}
                                            locale="zh-gb"
                                            minDate={moment().subtract(1, 'year')}
                                            maxDate={endDate || moment()}
                                            onChange={this.startDateChange.bind(this)}
                                            readOnly={true}
                                            placeholderText={Intl.lang("common.startDate")} />
                            </span>
                            <span className="pd010">--</span>
                            <span>
                                <span className="date-picket-box">
                                    <i className="iconfont icon-date pdl-5 pos-a" />
                                    <DatePicker dateFormat="YYYY-MM-DD"
                                                locale="zh-gb"
                                                selected={endDate}
                                                minDate={startDate || moment().subtract(11, 'month')}
                                                maxDate={moment()}
                                                onChange={this.endDateChange.bind(this)}
                                                readOnly={true}
                                                placeholderText={Intl.lang("common.endDate")} />
                                </span>
                            </span>
                            <button onClick={this.selectPeriod.bind(this,true)} className="btn ml-50 date-picket-box-btn">{Intl.lang("Asset.111")}</button>
                            <button onClick={this.selectPeriod.bind(this,false)} className="btn ml-30 date-picket-box-btn">{Intl.lang("connect.1_1")}</button>
                        </div>}
                        <div className="list-global-config">
                            <ul className="list-config-title"><li>{Intl.lang("accountSafe.1_102")}</li><li>{Intl.lang("Vip.exRate.theme","TD")}</li></ul>

                            {(tdRateHistory.hasOwnProperty("PageCount") && tdRateHistory.PageCount>0) && tdRateHistory.List.map((v, i)=>{
                                return  <ul className="list-config-content" key={"tdRate"+i}><li>{moment(v.Time).format("YYYY-MM-DD")||"--"}</li><li>{Decimal.format(v.Price,8)}</li></ul>
                            })}

                            {(tdRateHistory.hasOwnProperty("PageCount") && tdRateHistory.PageCount>0) && <Pager className="public-pages-config mt-20" data={tdRateHistory} onChange={this.turnPage.bind(this)}></Pager>}

                            {(tdRateHistory.hasOwnProperty("PageCount") && tdRateHistory.PageCount==0) && <div className="no-list-data show-10">
                                <div className="no-list-data-pic"></div>
                                <p>{Intl.lang("bank.1_27")}</p>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}