import React from 'react'
import PureComponent from "../core/PureComponent"
import Intl from '../intl'
import Pager from '../components/Pager'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { isMobile } from '../utils/util'
import Net from '../net/net'
import ErrorBoundary from '../components/ErrorBoundary'
import AuthModel from '../model/auth'
import History from '../core/history'
import Event from '../core/event'
// import ReactTooltip from 'react-tooltip';
import { toast } from "../utils/common"
import ToolTip from "../components/ToolTip";
class Mining extends PureComponent {

    constructor(props) {

        super(props)
        this.state = {
            tab: 0,
            platformInfo: {
                totalTD: 0,
                bonusToday: 0,
                currentTD: 0,
                bonusTotal: 0,
                currentCycle: 0,
                totalCost: 0,
                pay: 0
            },
            userInfo: {
                totalTD: 0,
                totalBTC: 0,
                totalCost: 0,
                currentCost: 0,
                validTD: 0,
                validBTC: 0,
                currentTD: 0,
                currentBTC: 0,
                pay: 0
            },
            platformList: [],
            userList: [],
            platformCount: {
                countOutputValue: 0,
                countOutputTotal: 0,
                countExchangeValue: 0,
                countExchangeTotal: 0
            },
            platformDetail: {
                total: 0,
                page: 1,
                count: 0
            },
            userDetail: {
                total: 0,
                page: 1,
                count: 0
            },
            userCount: {
                countOutputValue: 0,
                countOutputTotal: 0,
                countExchangeValue: 0,
                countExchangeTotal: 0
            },
            oldPlatformList: null,
            oldUserList: null,
            oldPlatformInfo: null,
            oldUserInfo: null,
            tdPrice: 0,
            startDate: moment().subtract(24, 'hours'),
            endDate: moment(),
            isNoData: false,
            isLogin: AuthModel.checkUserAuth(),
            startTime: parseInt(new Date(moment().subtract(24, 'hours').format('YYYY-MM-DD')).getTime() / 1000),
            endTime: parseInt(Date.now() / 1000),
            action: 0,
            tableTitle: [3, 4, 5, 6, 7]
        }
        this.updateData = null
        this.heartbeat = 60000
    }
    // 加载组件
    componentDidMount() {
        // ReactTooltip.rebuild();
        // 避免表格无价格
        this.fetchPlatformMining().then(() => {
            this.fetchPlatformDetail()
            if (this.state.isLogin) {
                this.fetchUserMining()
                this.fetchUserDetail()
            }
        })
        // Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this)
        this.updateData = setInterval(() => {
            this.fetchPlatformMining()
        }, this.heartbeat)
        window.addEventListener('resize', this.onResize.bind(this))
    }
    // 卸载组件
    componentWillUnmount() {
        if (this.updateData) {
            clearInterval(this.updateData)
            this.updateData = null
        }
        window.removeEventListener('resize', this.onResize)
        super.componentWillUnmount()
    }
    // 监听页面变化
    onResize() {
        if (isMobile()) History.push('/minetrade')
    }
    // 价格更新
    // onUpdatePrice(data) {
    //     const { tdPrice, oldPlatformInfo, oldUserInfo, oldPlatformList, oldUserList } = this.state;
    //     if (data['TDBTC'] && data['TDBTC'].LAST && data['TDBTC'].LAST !== tdPrice) {
    //         this.setState({ tdPrice: data['TDBTC'].LAST })
    //         oldPlatformInfo && this.setPlatformInfo(oldPlatformInfo, data['TDBTC'].LAST)
    //         oldUserInfo && this.setUserInfo(oldUserInfo, data['TDBTC'].LAST)
    //         oldPlatformList && this.setDetailData(oldPlatformList, 'platformList', data['TDBTC'].LAST)
    //         oldUserList && this.setDetailData(oldUserList, 'userList', data['TDBTC'].LAST)
    //     }
    // }
    // 获取平台挖矿信息
    fetchPlatformMining() {
        return new Promise(resolve => {
            Net.httpRequest('mining/dashboard', null, data => {
                if (!data.Status) {
                    const info = data.Data
                    this.setPlatformInfo(info)
                    this.setState({ oldPlatformInfo: info })
                    resolve(info)
                }
            }, this)
        })
    }
    // 获取用户挖矿信息
    fetchUserMining() {
        Net.httpRequest('mining/userMining', null, data => {
            if (!data.Status) {
                const info = data.Data
                this.setUserInfo(info)
                this.setState({ oldUserInfo: info })
            }
        }, this)
    }
    // 设置平台挖矿信息
    setPlatformInfo(data, price) {
        const tdPrice = data.Mining ? data.Mining.Price ? data.Mining.Price : 0 : 0
        // const tdPrice = price || this.state.tdPrice
        const totalTd = data.Mining ? data.Mining.Total ? data.Mining.Total : 0 : 0
        const currentTd = data.Mining ? data.Mining.Coming ? data.Mining.Coming : 0 : 0
        const period = data.Mining ? data.Mining.Period ? data.Mining.Period : 0 : 0
        const costTd = data.Mining ? data.Mining.Commission ? data.Mining.Commission : 0 : 0
        const today = data.Bonus ? data.Bonus.Today ? data.Bonus.Today : 0 : 0
        const total = data.Bonus ? data.Bonus.Total ? data.Bonus.Total : 0 : 0
        const Pay = data.Mining ? data.Mining.Pay ? data.Mining.Pay : 0 : 0
        this.setState({
            platformInfo: {
                totalTD: this.thousandBitSeparator(Number(totalTd).toFixed(4)),
                bonusTotal: this.thousandBitSeparator(Number(total).toFixed(8)),
                currentTD: this.thousandBitSeparator(Number(currentTd).toFixed(4)),
                bonusToday: this.thousandBitSeparator(Number(today).toFixed(8)),
                currentCycle: period,
                totalCost: this.thousandBitSeparator(Number(costTd).toFixed(8)),
                TDPrice: this.thousandBitSeparator(Number(tdPrice).toFixed(8)),
                pay: this.thousandBitSeparator(Number(Pay).toFixed(4)),
            },
            tdPrice: Number(tdPrice).toFixed(8)
        })
    }
    // 设置用户挖矿信息
    setUserInfo(info, price) {
        const data = info.Mining ? info.Mining : {}
        const totalTd = data.History ? data.History.Total ? data.History.Total : 0 : 0
        const bonusTotal = info.Bonus ? info.Bonus.Total ? info.Bonus.Total : 0 : 0
        const bonusToday = info.Bonus ? info.Bonus.Today ? info.Bonus.Today : 0 : 0
        const validTd = data.History ? data.History.Left ? data.History.Left : 0 : 0
        const preTd = data.History ? data.History.Period ? data.History.Period : 0 : 0
        const pay = data.History ? data.History.Pay ? data.History.Pay : 0 : 0
        const tdPrice = price || this.state.tdPrice
        const Coming = data.Coming ? data.Coming.Total ? data.Coming.Total : 0 : 0
        this.setState({
            userInfo: {
                totalTD: this.thousandBitSeparator(Number(totalTd).toFixed(4)),
                totalBTC: this.thousandBitSeparator(Number(totalTd * tdPrice).toFixed(8)),
                totalCost: this.thousandBitSeparator(Number(bonusTotal).toFixed(8)),
                currentCost: this.thousandBitSeparator(Number(bonusToday).toFixed(8)),
                validTD: this.thousandBitSeparator(Number(validTd).toFixed(4)),
                validBTC: this.thousandBitSeparator(Number(preTd).toFixed(2)),
                currentTD: this.thousandBitSeparator(Number(Coming).toFixed(4)),
                currentBTC: this.thousandBitSeparator(Number(Coming * tdPrice).toFixed(8)),
                pay: this.thousandBitSeparator(Number(pay).toFixed(4))
            }
        })
    }
    // 获取平台收益明细
    fetchPlatformDetail(page = 1, act) {
        const { startTime, endTime, action } = this.state
        Net.httpRequest('mining/history', {
            PageSize: 10,
            Page: page,
            Action: act !== undefined ? act : action,
            StartTime: startTime,
            EndTime: endTime
        }, data => {
            if (data.Data && data.Data.List) {
                this.setDetailData(data.Data.List, 'platformList')
                this.setState({
                    oldPlatformList: data.Data.List,
                    platformDetail: {
                        total: data.Data.Total,
                        page: data.Data.Page,
                        count: data.Data.PageCount
                    }
                })
            } else {
                this.setState({
                    platformList: [],
                    oldPlatformList: null,
                    platformDetail: {
                        total: 0,
                        page: 1,
                        count: 0
                    }
                })
            }
        }, this)
    }
    // 获取用户收益明细
    fetchUserDetail(page = 1, act) {
        const { startTime, endTime, action } = this.state
        Net.httpRequest('mining/userDetail', {
            PageSize: 10,
            Page: page,
            Action: act !== undefined ? act : action,
            StartTime: startTime,
            EndTime: endTime
        }, data => {
            if (data.Data && data.Data.List) {
                this.setDetailData(data.Data.List, 'userList')
                this.setState({
                    oldUserList: data.Data.List,
                    userDetail: {
                        total: data.Data.Total,
                        page: data.Data.Page,
                        count: data.Data.PageCount
                    }
                })
            } else {
                this.setState({
                    userList: [],
                    oldUserList: null,
                    userDetail: {
                        total: 0,
                        page: 1,
                        count: 0
                    }
                })
            }
        }, this)
    }
    // 设置收益明细数据
    setDetailData(data, name, price) {
        if (!data.length) return
        if (this.state.action) {
            this.setDaysDetailData(data, name, price)
        } else {
            this.setCycleDetailData(data, name, price)
        }
    }
    // 按天查看
    setDaysDetailData(data, name, price) {
        const list = []
        const state = {}
        let countOutputValue = 0
        let countOutputTotal = 0
        let countExchangeTotal = 0
        const tdPrice = price || this.state.tdPrice
        data.forEach(function (element) {
            const value = element.toUSDT ? element.toUSDT : 0
            const outputTotal = element.mine ? element.mine : 0
            const poundageValue = element.fee ? element.fee : 0
            countOutputTotal += outputTotal
            countExchangeTotal += poundageValue
            countOutputValue += value
            list.push({
                cycle: element.time,
                output: value ? this.thousandBitSeparator(Number(value).toFixed(4)) + '/' + this.thousandBitSeparator(Number(outputTotal).toFixed(4)) : this.thousandBitSeparator(Number(outputTotal).toFixed(4)),
                exchange: this.thousandBitSeparator((outputTotal * tdPrice).toFixed(8)),
                poundage: this.thousandBitSeparator(Number(poundageValue).toFixed(8)),
                distribute: ''
            })
        }, this)
        state[name] = list
        this.setState(state)
        this.setState({ tableTitle: [3, 4, 5, 6] })
        if (name === 'platformList') {
            this.setState({
                platformCount: {
                    countOutputTotal: this.thousandBitSeparator(Number(countOutputTotal).toFixed(4)),
                    countExchangeTotal: this.thousandBitSeparator((countOutputTotal * tdPrice).toFixed(8))
                }
            })
        } else {
            this.setState({
                userCount: {
                    countOutputValue: this.thousandBitSeparator(Number(countOutputValue).toFixed(4)),
                    countOutputTotal: this.thousandBitSeparator(Number(countOutputTotal).toFixed(4)),
                    countExchangeTotal: this.thousandBitSeparator((countOutputTotal * tdPrice).toFixed(8))
                }
            })
        }
    }
    // 按周期查看
    setCycleDetailData(data, name, price) {
        const list = []
        const state = {}
        let countOutputValue = 0
        let countOutputTotal = 0
        let countExchangeValue = 0
        let countExchangeTotal = 0
        const tdPrice = price || this.state.tdPrice
        data.forEach(function (element) {
            // const cycleHealth = element.health ? element.health * 5 * 60000 : 0
            const health = name === 'platformList' ? element.health : element.health
            const cycleHealth = 5 * 60000
            const currentPeriod = element.currentPeriod ? element.currentPeriod : 0
            const cycleTime = new Date(moment(element.time)).getTime() - cycleHealth
            const cycleValue = moment(cycleTime).format('YYYY-MM-DD HH:mm')
            const outputTotal = element.mine ? element.mine : 0
            const outputValue = outputTotal / element.health * currentPeriod
            // const exchangeValue = element.toUSDT ? Number(element.toUSDT).toFixed(2) : 0.00
            const poundageValue = element.fee ? element.fee : 0
            countOutputValue += outputValue
            countOutputTotal += outputTotal
            countExchangeValue += outputValue * tdPrice
            countExchangeTotal += outputTotal * tdPrice
            list.push({
                cycle: cycleValue + '~' + element.time,
                output: this.thousandBitSeparator(Number(outputValue).toFixed(4)) + '/' + this.thousandBitSeparator(Number(outputTotal).toFixed(4)),
                exchange: this.thousandBitSeparator((outputValue * tdPrice).toFixed(8)) + '/' + this.thousandBitSeparator((outputTotal * tdPrice).toFixed(8)),
                poundage: this.thousandBitSeparator(Number(poundageValue).toFixed(8)),
                distribute: currentPeriod + '/' + health
            })
        }, this)
        state[name] = list
        this.setState(state)
        this.setState({ tableTitle: [3, 4, 5, 6, 7] })
        if (name === 'platformList') {
            this.setState({
                platformCount: {
                    countOutputValue: this.thousandBitSeparator(Number(countOutputValue).toFixed(4)),
                    countOutputTotal: this.thousandBitSeparator(Number(countOutputTotal).toFixed(4)),
                    countExchangeValue: this.thousandBitSeparator(countExchangeValue.toFixed(8)),
                    countExchangeTotal: this.thousandBitSeparator(countExchangeTotal.toFixed(8))
                }
            })
        } else {
            this.setState({
                userCount: {
                    countOutputValue: this.thousandBitSeparator(Number(countOutputValue).toFixed(4)),
                    countOutputTotal: this.thousandBitSeparator(Number(countOutputTotal).toFixed(4)),
                    countExchangeValue: this.thousandBitSeparator(countExchangeValue.toFixed(8)),
                    countExchangeTotal: this.thousandBitSeparator(countExchangeTotal.toFixed(8))
                }
            })
        }
    }
    // 价格变动
    componentWillUpdate(nextProps, nextState) {
        const oldPrice = JSON.stringify(this.state.tdPrice)
        const newPrice = JSON.stringify(nextState.tdPrice)
        const { oldUserInfo, oldPlatformList, oldUserList } = this.state
        if (oldPrice !== newPrice) {
            oldUserInfo && this.setUserInfo(oldUserInfo, Number(newPrice))
            oldPlatformList && this.setDetailData(oldPlatformList, 'platformList', Number(newPrice))
            oldUserList && this.setDetailData(oldUserList, 'userList', Number(newPrice))
        }
    }
    // 千位分隔符
    thousandBitSeparator(num) {
        let DIGIT = /(^|\s)\d+(?=\.?\d*($|\s))/g
        let MILI = /(?=(?!\b)(\d{3})+\.?\b)/g
        return num && num.toString().replace(DIGIT, m => m.replace(MILI, ','))
    }
    // 切换TAB
    changeTab(tab) {
        if (tab !== this.state.tab) {
            if (tab) {
                this.fetchUserDetail()
            } else {
                this.fetchPlatformDetail()
            }
            this.setState({ tab: tab })
        }
    }
    // 选择开始时间
    startDate(date) {
        this.setState({ startDate: date })
        const newTime = moment(date).format('YYYY-MM-DD')
        const newStart = parseInt(new Date(newTime + ' 00:00').getTime() / 1000)
        this.setState({ startTime: newStart })
    }
    // 选择结束时间
    endDate(date) {
        this.setState({ endDate: date })
        const newTime = moment(date).format('YYYY-MM-DD')
        const newStart = parseInt(new Date(newTime + ' 23:59').getTime() / 1000)
        this.setState({ endTime: newStart })
    }
    // 搜索时间
    selectPeriod() {
        if (this.state.endTime >= this.state.startTime) {
            if (this.state.tab) {
                this.fetchUserDetail()
            } else {
                this.fetchPlatformDetail()
            }
        }
    }
    // 切换平台明细分页
    platformChangePage(page) {
        this.fetchPlatformDetail(page)
    }
    // 切换用户明细分页
    userChangePage(page) {
        this.fetchUserDetail(page)
    }
    //
    changeAction(val) {
        if (this.state.action !== val) {
            this.setState({ action: val })
            if (this.state.tab) {
                this.fetchUserDetail(1, val)
            } else {
                this.fetchPlatformDetail(1, val)
            }
        }
    }
    // 跳转登录页
    JumpLogon() {
        History.push({ pathname: '/login', query: { return_to: '/mining' } })
    }
    render() {

        const tabList = [Intl.lang("trading.dig.1"), Intl.lang("trading.dig.2")];
        const { tab, startDate, endDate, platformInfo, tdPrice, userInfo, platformList, userList, isNoData, isLogin, platformDetail, userDetail, platformCount, userCount, action, tableTitle } = this.state;
        return (
            <div className="okk-trade-contain">
                <div className="trad-dig-bg">
                    <p>{Intl.lang("trading.dig.9")}</p>
                    <h4>{Intl.lang("trading.dig.10")}</h4>
                    <p className="last-p-title"><a href="https://support.tdex.com/hc/zh-cn/articles/360015588212-%E4%BB%80%E4%B9%88%E6%98%AF%E4%BA%A4%E6%98%93%E6%8C%96%E7%9F%BF-%E6%94%B6%E5%85%A5%E5%88%86%E7%BA%A2- " target="_blank">{Intl.lang("trading.dig.11")}</a></p>
                </div>
                {/*  平台挖矿信息  */}
                <div className="trad-dig-sum">
                    <div>
                        <span>{Intl.lang("trading.dig.12")}TD</span>
                        <p>{platformInfo.pay}/{platformInfo.totalTD}</p>
                        <span>{Intl.lang("trading.dig.27")}BTC：{platformInfo.bonusTotal}</span>
                    </div>
                    <div>
                        <span>{Intl.lang("trading.dig.28")}TD</span>
                        <p>{platformInfo.currentTD}</p>
                        <span>{Intl.lang("trading.dig.29")}BTC：{platformInfo.bonusToday}</span>
                    </div>
                    <div>
                        <span>{Intl.lang("trading.dig.34")}：{platformInfo.currentCycle}
                            <ToolTip title={Intl.lang("trading.dig.tips")}><i className="iconfont icon-question m-hide"></i></ToolTip>
                        </span>
                        <p>
                            <span style={{ fontWeight: 500, fontSize: '14px', verticalAlign: 'text-bottom' }}>
                                {Intl.lang("trading.dig.35")}BTC：
                            </span>{platformInfo.totalCost}
                        </p>
                        <span>{Intl.lang("trading.dig.25")}BTC：{tdPrice}</span>
                    </div>
                </div>
                <div className="trad-dig-title">
                    <h3>{Intl.lang("trading.dig.16")}</h3>
                </div>
                {/* 我的收益  */}
                <div>
                    {
                        isLogin ?
                            <div className="trad-dig-sum2">
                                <div>
                                    <div className="dig-sum-pic">
                                        <img src={process.env.PUBLIC_URL + "/images/mining/dig-icon1.png"} />
                                    </div>
                                    <span>{Intl.lang("trading.dig.17")}TD</span>
                                    <p>{userInfo.pay}/{userInfo.totalTD}</p>
                                    <span>{Intl.lang("trading.dig.18")}BTC：{userInfo.totalBTC}</span>
                                </div>
                                <div>
                                    <div className="dig-sum-pic">
                                        <img src={process.env.PUBLIC_URL + "/images/mining/dig-icon3.png"} />
                                    </div>
                                    <span>{Intl.lang("trading.dig.36")}TD</span>
                                    <p>{userInfo.validTD}</p>
                                    <span>{Intl.lang("trading.dig.37")}：{userInfo.validBTC}</span>
                                </div>
                                <div>
                                    <div className="dig-sum-pic">
                                        <img src={process.env.PUBLIC_URL + "/images/mining/dig-icon2.png"} />
                                    </div>
                                    <span>{Intl.lang("trading.dig.19")}BTC</span>
                                    <p>{userInfo.totalCost}</p>
                                    <span>{Intl.lang("trading.dig.20")}BTC：{userInfo.currentCost}</span>
                                </div>
                                <div>
                                    <div className="dig-sum-pic">
                                        <img src={process.env.PUBLIC_URL + "/images/mining/dig-icon4.png"} />
                                    </div>
                                    <span>{Intl.lang("trading.dig.28")}TD</span>
                                    <p>{userInfo.currentTD}</p>
                                    <span>{Intl.lang("trading.dig.18")}BTC：{userInfo.currentBTC}</span>
                                </div>
                            </div>
                            :
                            <div>
                                <div className="dig-no-data" style={{ paddingTop: '10px' }}>
                                    <img src={process.env.PUBLIC_URL + "/images/mining/dig-emojy.png"} />
                                </div>
                                <div><p className="dig-no-data-p"><span style={{ color: '#777' }} onClick={() => { this.JumpLogon() }}>{Intl.lang("trading.dig.26")}</span></p></div>
                            </div>
                    }

                </div>
                {/* TAB切换  */}
                <div className="trad-dig-tab">
                    <ul>
                        {tabList.map((v, i) => {
                            return <li key={i} onClick={() => this.changeTab(i)}><span className={tab === i ? "active" : ""}>{v}</span></li>
                        })}
                    </ul>
                    <ul className="zwe-select-list">
                        <li className="date-picket-box first-li">
                            {action ? Intl.lang("trading.dig.31") : Intl.lang("trading.dig.30")}
                            <div className="first-select">
                                <p onClick={() => { this.changeAction(0) }}>{Intl.lang("trading.dig.30")}</p>
                                <p onClick={() => { this.changeAction(1) }}>{Intl.lang("trading.dig.31")}</p>
                            </div>
                        </li>
                        <li className="date-picket-box">
                            <i className="iconfont icon-date pdl-5 pos-a"></i>
                            <DatePicker dateFormat="YYYY-MM-DD"
                                selected={startDate}
                                locale="zh-gb"
                                minDate={moment().subtract(1, 'year')}
                                maxDate={moment()}
                                onChange={this.startDate.bind(this)} />
                        </li>
                        <li className="date-picket-box" style={{ marginLeft: '5px' }}>
                            <i className="iconfont icon-date pdl-5 pos-a"></i>
                            <DatePicker dateFormat="YYYY-MM-DD" locale="zh-gb" selected={endDate}
                                minDate={moment().subtract(1, 'year')}
                                maxDate={moment()}
                                onChange={this.endDate.bind(this)} />
                        </li>
                        <li><button onClick={() => this.selectPeriod()} className="btn with-btn logBtn ml-10 date-picket-box-btn" type="submit">{Intl.lang("Asset.111")}</button></li>
                    </ul>

                </div>
                {/* 平台收益明细  */}
                <div className="zwb-platform-detail" style={{ display: tab ? 'none' : 'block' }}>
                    {
                        !platformList.length ?
                            <div className="dig-tab-list">
                                <table className="deform">
                                    <thead>
                                        <tr>
                                            {tableTitle.map((v, i) => {
                                                return <td key={i}>{Intl.lang(`trading.dig.${v}`)}</td>
                                            })}
                                        </tr>
                                    </thead>
                                </table>
                                <div className="dig-no-data">
                                    <img src={process.env.PUBLIC_URL + "/images/mining/dig-emojy.png"} />
                                </div>
                                <div><p className="dig-no-data-p">{Intl.lang("bank.1_27")}</p></div>
                            </div>
                            :
                            <div>
                                <div className="dig-tab-list" style={{ minHeight: '755px' }}>
                                    <table className="deform">
                                        <thead>
                                            <tr>
                                                {tableTitle.map((v, i) => {
                                                    return <td key={i}>{Intl.lang(`trading.dig.${v}`)}</td>
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                platformList.map((v, i) => {
                                                    return <tr key={i}>
                                                        <td>{v.cycle}</td>
                                                        <td>{v.output}</td>
                                                        <td>{v.exchange}</td>
                                                        <td>{v.poundage}</td>
                                                        {!action ? <td>{v.distribute}</td> : null}
                                                    </tr>
                                                })
                                            }
                                            <tr className="tab-list-add" style={{ visibility: platformList.length ? 'visible' : 'hidden', borderBottom: 0 }}>
                                                <td>{Intl.lang("trading.dig.8")}</td>
                                                <td>{platformCount.countOutputValue ? platformCount.countOutputValue + '/' : ''}{platformCount.countOutputTotal}</td>
                                                <td>{platformCount.countExchangeValue ? platformCount.countExchangeValue + '/' : ''}{platformCount.countExchangeTotal}</td>
                                                <td style={{ borderBottom: 0 }}></td>
                                                {!action ? <td style={{ borderBottom: 0 }}></td> : null}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <Pager className="trad-dig-Pg"
                                    data={{ PageSize: 10, Total: platformDetail.total, Page: platformDetail.page, PageCount: platformDetail.count }}
                                    onChange={this.platformChangePage.bind(this)}>
                                </Pager>
                            </div>
                    }

                </div>
                {/* 个人收益明细 */}
                <div className="zwb-user-detail" style={{ display: tab ? 'block' : 'none' }}>
                    {
                        isLogin ?
                            <div>
                                {
                                    !userList.length ?
                                        <div className="dig-tab-list">
                                            <table className="deform">
                                                <thead>
                                                    <tr>
                                                        {tableTitle.map((v, i) => {
                                                            return <td key={i}>{Intl.lang(`trading.dig.${v}`)}</td>
                                                        })}
                                                    </tr>
                                                </thead>
                                            </table>
                                            <div className="dig-no-data">
                                                <img src={process.env.PUBLIC_URL + "/images/mining/dig-emojy.png"} />
                                            </div>
                                            <div><p className="dig-no-data-p">{Intl.lang("bank.1_27")}</p></div>
                                        </div>
                                        :
                                        <div>
                                            <div className="dig-tab-list" style={{ minHeight: '755px' }}>
                                                <table className="deform">
                                                    <thead>
                                                        <tr>
                                                            {tableTitle.map((v, i) => {
                                                                return <td key={i}>{Intl.lang(`trading.dig.${v}`)}</td>
                                                            })}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            userList.map((v, i) => {
                                                                return <tr key={i}>
                                                                    <td>{v.cycle}</td>
                                                                    <td>{v.output}</td>
                                                                    <td>{v.exchange}</td>
                                                                    <td>{v.poundage}</td>
                                                                    {!action ? <td>{v.distribute}</td> : null}
                                                                </tr>
                                                            })
                                                        }
                                                        <tr className="tab-list-add" style={{ visibility: userList.length ? 'visible' : 'hidden', borderBottom: 0 }}>
                                                            <td>{Intl.lang("trading.dig.8")}</td>
                                                            <td>{userCount.countOutputValue ? userCount.countOutputValue + '/' : ''}{userCount.countOutputTotal}</td>
                                                            <td>{userCount.countExchangeValue ? userCount.countExchangeValue + '/' : ''}{userCount.countExchangeTotal}</td>
                                                            <td style={{ borderBottom: 0 }}></td>
                                                            {!action ? <td style={{ borderBottom: 0 }}></td> : null}
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <Pager className="trad-dig-Pg"
                                                data={{ PageSize: 10, Total: userDetail.total, Page: userDetail.page, PageCount: userDetail.count }}
                                                onChange={this.userChangePage.bind(this)}>
                                            </Pager>
                                        </div>
                                }
                            </div>
                            :
                            <div className="dig-tab-list">
                                <div className="dig-no-data">
                                    <img src={process.env.PUBLIC_URL + "/images/mining/dig-emojy.png"} />
                                </div>
                                <div><p className="dig-no-data-p"><span style={{ color: '#777' }} onClick={() => { this.JumpLogon() }}>{Intl.lang("trading.dig.26")}</span></p></div>
                            </div>
                    }
                </div>
            </div>

        )
    }
}

export default Mining;
