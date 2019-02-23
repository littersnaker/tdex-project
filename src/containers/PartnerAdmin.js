import React from 'react';
import PureComponent from "../core/PureComponent";
import { toast } from "../utils/common";
import Intl from "../intl";
import Clipboard from 'clipboard';
import QRCode from 'qrcode.react';

const MONTH_LIST = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const YEAR_LIST = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

export default class PartnerAdmin extends PureComponent {

    render() {
        return (
            <div className="inside-page-web">
                <div className="inside-web-part">
                    <AdminCenter />
                    <InviteWay />
                    <InviteHistory />
                    <ActivateHistory />
                    <RakeBackDetails />
                    <RakeBackProp />
                    <PartnerTips />
                </div>
            </div>
        )
    }
}

class AdminCenter extends PureComponent {
    render() {
        return (
            <div className="partner-admin-head-flex">
                <div className="item">
                    <p className="title">100</p>
                    <p className="text">本月有效邀请人<span className="iconfont icon-arrow-l" /></p>
                    <p className="many">累计邀请人：<span>9,000</span></p>
                    <div className="item-partner-bg" />
                </div>
                <div className="item">
                    <p className="title">600,000</p>
                    <p className="text">本月已到账返佣TD<span className="iconfont icon-arrow-l" /></p>
                    <p className="many">累计返佣TD：<span>9,000,000</span></p>
                    <div className="item-account-bg" />
                </div>
            </div>
        )
    }
}

class InviteWay extends PureComponent {

    constructor(props) {
        super(props);

        this.clipboard = null;
    }

    componentDidMount() {
        this.createCopyComponent();
    }

    createCopyComponent = () => {
        this.clipboard = new Clipboard('.copy_link_btn');
        this.clipboard.on('success', () => {
            toast(Intl.lang("Recharge.120"), 0, 1000);
        });
        this.clipboard.on('error', (error) => {
            console.log(error);
        });
    };

    componentWillUnmount(){
        this.clipboard = null;
    }

    render() {
        return (
            <div className="partner-admin-invitation-way">
                <h3>邀请方式</h3>
                <div className="invitation-way-content">
                    <div className="invitation-way-qr">
                        <div><QRCode value={'2333'} size={160} /></div>
                        <p>专属邀请二维码</p>
                    </div>
                    <ul className="invitation-way-text">
                        <li className="item">
                            <p className="title">邀请码</p>
                            <p className="input-config">
                                <input id="invite-uid" style={{width: 120}} type="text" defaultValue={'EDSFGSS'} />
                                <span className="copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#invite-uid">复制邀请码</span>
                            </p>
                        </li>
                        <li className="item" style={{marginTop: 25}}>
                            <p className="title">邀请链接</p>
                            <p className="input-config">
                                <input id="invite-url" style={{width: 280}} type="text" defaultValue={'http://localhost:3000/partnerAdmin'} />
                                <span className="copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#invite-url">复制邀请链接</span>
                            </p>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
}

class InviteHistory extends PureComponent {

    state = {
      tab: 0
    };

    getChildDate = (props) => {
        console.log(props);
    };

    changeTab = (index) => {
        this.setState({tab: index});
    };

    render() {
        const { tab } = this.state;
        const tabList = ['本月邀请', '邀请历史'];

        return (
            <div className="tab-data-list">
                <div className="list-header-text list-header-tab">
                    {tabList && tabList.map((item, index) => {
                        return <h3 key={index} className={tab === index ? 'active' : null} onClick={this.changeTab.bind(this, index)}>{item}</h3>
                    })}
                    <div className="list-change-date">
                        <label className="change-date-label">
                            <input className="custom-radio" type="radio" name="skin-type"/>
                            <span className="custom-radioInput"/>
                            <span>仅显示有效邀请人</span>
                        </label>
                        <ChangeDateOption getChangeDate={this.getChildDate} />
                        <UidSearch/>
                    </div>
                </div>
                {tab === 0 ? <div className="list-global-config">
                    <div className="list-config-title-top">
                        <p>本月有效邀请人：<span>100</span></p>
                        <p>本月累计邀请人：<span>200</span></p>
                    </div>
                    <ul className="list-config-title">
                        <li>序号</li>
                        <li>注册时间</li>
                        <li>UID</li>
                        <li>累计返佣TD</li>
                        <li>是否为有效邀请人</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                </div>
                : tab === 1 ? <div className="list-global-config">
                    <div className="list-config-title-top">
                        <p>本月有效邀请人：<span>100</span></p>
                        <p>本月累计邀请人：<span>200</span></p>
                    </div>
                    <ul className="list-config-title">
                        <li>序号</li>
                        <li>注册时间</li>
                        <li>UID</li>
                        <li>累计返佣TD</li>
                        <li>是否为有效邀请人</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                </div>
                : null}
            </div>
        )
    }
}

class ActivateHistory extends PureComponent {

    state = {
        tab: 0
    };

    changeTab = (index) => {
        this.setState({tab: index});
    };

    render() {
        const { tab } = this.state;
        const tabList = ['本月激活', '激活历史'];

        return (
            <div className="tab-data-list">
                <div className="list-header-text list-header-tab">
                    {tabList && tabList.map((item, index) => {
                        return <h3 key={index} className={tab === index ? 'active' : null} onClick={this.changeTab.bind(this, index)}>{item}</h3>
                    })}
                    <div className="list-change-date">
                        <UidSearch />
                    </div>
                </div>
                {tab === 0 ? <div className="list-global-config">
                    <div className="list-config-title-top">
                        <p>累计邀请人：<span>9,000</span></p>
                    </div>
                    <ul className="list-config-title">
                        <li>序号</li>
                        <li>注册时间</li>
                        <li>UID</li>
                        <li>累计返佣TD</li>
                        <li>是否为有效邀请人</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                </div>
                : tab === 1 ? <div className="list-global-config">
                    <div className="list-config-title-top">
                        <p>累计邀请人：<span>9,000</span></p>
                    </div>
                    <ul className="list-config-title">
                        <li>序号</li>
                        <li>注册时间</li>
                        <li>UID</li>
                        <li>累计返佣TD</li>
                        <li>是否为有效邀请人</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>1</li>
                        <li>2018-09-23 18:49:12</li>
                        <li>945136456</li>
                        <li>300</li>
                        <li>是</li>
                    </ul>
                </div>
                : null}
            </div>
        )
    }
}

class RakeBackDetails extends PureComponent {

    getChildDate = (props) => {
        console.log(props);
    };

    render() {
        return (
            <div className="title-data-list">
                <div className="list-header-text">
                    <h3>返佣明细</h3>
                    <div className="list-change-date">
                        <ChangeDateOption getChangeDate={this.getChildDate} />
                    </div>
                </div>
                <div className="list-global-config">
                    <div className="list-config-title-top">
                        <p>本月返佣TD：<span>100</span></p>
                        <p>本月享受返佣比例：<span>50%</span></p>
                    </div>
                    <ul className="list-config-title">
                        <li>注册时间</li>
                        <li>返佣TD</li>
                        <li>操作</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>2018-09-23 18:49:12</li>
                        <li>300</li>
                        <li>详情</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>2018-09-23 18:49:12</li>
                        <li>300</li>
                        <li>详情</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>2018-09-23 18:49:12</li>
                        <li>300</li>
                        <li>详情</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>2018-09-23 18:49:12</li>
                        <li>300</li>
                        <li>详情</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>2018-09-23 18:49:12</li>
                        <li>300</li>
                        <li>详情</li>
                    </ul>
                </div>
            </div>
        )
    }
}

class RakeBackProp extends PureComponent {
    render() {
        return (
            <div className="title-data-list">
                <div className="list-header-text">
                    <h3>返佣比例</h3>
                </div>
                <div className="list-global-config">
                    <ul className="list-config-title">
                        <li>当月有效邀请用户数</li>
                        <li>返佣比例</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>20</li>
                        <li>30%</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>20</li>
                        <li>30%</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>20</li>
                        <li>30%</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>20</li>
                        <li>30%</li>
                    </ul>
                    <ul className="list-config-content">
                        <li>20</li>
                        <li>30%</li>
                    </ul>
                </div>
            </div>
        )
    }
}

class PartnerTips extends PureComponent {
    render() {
        return (
            <ul className="partner-admin-tips">
                <p>注：</p>
                <li>1、有效邀请用户必须每月在TDEx交易满10,000张合约；</li>
                <li>2、返佣额=邀请用户实际产生交易手续费*返佣比例；</li>
                <li>3、推广周期长期有效，后续若有比例调整，会提前公告告知；</li>
                <li>
                    4、结算方式：
                    <p>① 返佣额均以TD的形式结算;</p>
                    <p>② 超级合伙人返佣其中20%按普通推荐返佣比例进行实时结算，下月1号发放达到要求的额外比例。</p>
                </li>
            </ul>
        )
    }
}

class ChangeDateOption extends PureComponent {

    state = {
        showMonth: false,
        showYear: false,
        month: 0,
        year: 0
    };
    componentDidMount() {
        window.addEventListener('click', this.hideAll);
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.hideAll);
    }

    hideAll = () => {
        this.setState({showMonth: false});
        this.setState({showYear: false});
    };

    showDateItem = (type, event) => {
        event.preventDefault();
        event.stopPropagation();
        switch (type) {
            case 'month':
                this.state.showMonth === false ? this.setState({showMonth: true}) : this.setState({showMonth: false});
                break;
            case 'year':
                this.state.showYear === false ? this.setState({showYear: true}) : this.setState({showYear: false});
                break;
        }
    };

    getDateItem = (type, index) => {
        let date = null;
        switch (type) {
            case 'month':
                date = this.dateNumToString(this.state.year, index);
                this.props.getChangeDate(date);
                this.setState({month: index});
                break;
            case 'year':
                date = this.dateNumToString(index, this.state.month);
                this.props.getChangeDate(date);
                this.setState({year: index});
                break;
        }
    };

    dateNumToString = (year, month) => YEAR_LIST[year] + '-' + MONTH_LIST[month];

    render() {
        const { showMonth, showYear, month, year } = this.state;
        return (
            <div className="change-date-option">
                <div className="item" onClick={this.showDateItem.bind(this, 'month')}>
                    {MONTH_LIST[month]}<i className="iconfont icon-xiala"/>
                    {showMonth && <ul className="change-date-option-item">
                        {MONTH_LIST && MONTH_LIST.map((item, index) => {
                            return <li onClick={this.getDateItem.bind(this, 'month', index)} key={index}>{item}</li>
                        })}
                    </ul>}
                </div>
                <span>-</span>
                <div className="item" onClick={this.showDateItem.bind(this, 'year')}>
                    {YEAR_LIST[year]}<i className="iconfont icon-xiala"/>
                    {showYear && <ul className="change-date-option-item">
                        {YEAR_LIST && YEAR_LIST.map((item, index) => {
                            return <li onClick={this.getDateItem.bind(this, 'year', index)} key={index}>{item}</li>
                        })}
                    </ul>}
                </div>
            </div>
        )
    }
}

class UidSearch extends PureComponent {
    render() {
        return (
            <div className="change-date-search">
                <input type="text" placeholder="搜索 UID" />
                <i className="iconfont icon-search" />
            </div>
        )
    }
}
