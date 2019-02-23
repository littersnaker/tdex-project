import React from 'react'
import Intl from '../intl'
import PureComponent from '../core/PureComponent'
import Net from '../net/net'
import Event from '../core/event'
import Account from '../model/account'
import { getCurrencySymbol } from '../utils/common'

export default class Ico extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      baseHistoy: [],
      rate: '--',         // 昨日中签率
      price: '0.000', // 今日申购价
      startTime: 0,   // 申购开始时间
      endTime: 0,     // 申购结束时间
      nextTime: 0,    // 下一次开始时间
      period: 0,     // 下一次周期
      inputAmount: '',  // 输入金额
      availableBalance: '฿0.000',  // 可用余额
      walletList: {},         // 钱包列表
      timeText: Intl.lang('ico.todayEndTime'),
      timeNumber: '00:00:00',
      isSelect: false,
      currentCoin: '1'    // 当前币种
    }
    this.timer = null
    this.selectList = [
      { index: '1', name: 'BTC' },
      { index: '2', name: 'ETH' },
      { index: '3', name: 'USDT' }
    ]
    this.convert = {
      '1': 'BTC',
      '2': 'ETH',
      '3': 'USDT'
    }
  }

  // 补零
  supplementZero(n) {
    return n < 10 ? '0' + n : n
  }

  // 取活动信息
  fetchActivityInfo() {
    Net.httpRequest('activity/info', { ActivityId: 1002 }, data => {
      if (!data.Status) this.activityInfoData(data.Data.Params)
    }, this)
  }

  // 设置活动信息
  activityInfoData(data) {
    this.setState({
      rate: data.LastRate ? Math.round(data.LastRate * 100) + '%' : '--',
      price: data.Price.toFixed(3),
      endTime: data.EndTime * 1000,
      startTime: data.BeginTime * 1000,
      nextTime: data.NextTime * 1000,
      period: data.Period * 1000
    })
    this.timer = setInterval(() => {
      const showTime = this.displayTime()
      this.setState({
        timeText: showTime.timeText,
        timeNumber: showTime.timeNumber
      })
    }, 1000)
  }

  // 显示倒计时
  displayTime() {

    let leftTime
    const { startTime, endTime, nextTime, period } = this.state
    const data = { timeText: Intl.lang('ico.todayEndTime'), timeNumber: '00:00:00' }

    if (Date.now() < startTime) {
      leftTime = parseInt((startTime - Date.now()) / 1000)
      data.timeText = Intl.lang('ico.todayStartTime')
    }

    if (startTime <= Date.now() && Date.now() <= endTime) {
      leftTime = parseInt((endTime - Date.now()) / 1000)
      data.timeText = Intl.lang('ico.todayEndTime')
    }

    if (Date.now() > endTime) {
      if ((nextTime + period) > Date.now()) {
        leftTime = parseInt(((nextTime + period) - Date.now()) / 1000)
        data.timeText = Intl.lang('ico.todayStartTime')
      } else {
        leftTime = 0
        data.timeText = Intl.lang('ico.todayStartTime')
      }
    }

    let o = this.supplementZero(Math.floor(leftTime / 3600))
    let m = this.supplementZero(Math.floor(leftTime / 60 % 60))
    let s = this.supplementZero(leftTime % 60)
    data.timeNumber = `${o}:${m}:${s}`
    return data
  }

  // 取我的申购记录
  fetchMyHistory() {
    Net.httpRequest('activity/tokenApplyHistory', { Type: 2 }, data => {
      if (!data.Status && data.Data && data.Data.List && data.Data.List.length) {
        this.setState({ baseHistoy: data.Data.List })
      }
    }, this)
  }

  // 请求申购
  requestApplyToken(bool) {
    const params = {}
    if (bool) {
      params.SpendAll = true
    } else {
      if (!this.state.inputAmount) {
        return
      }
      params.SpendAll = false
      params.Coins = {}
      params.Coins[this.state.currentCoin] = Number(this.state.inputAmount)
    }
    Net.httpRequest('activity/tokenApply', params, data => {
      if (!data.Status && data.Data && data.Data.List && data.Data.List.length) {
        this.setState({ baseHistoy: data.Data.List })
      }
    }, this)
  }

  // 钱包更新
  onWalletUpdate(val) {
    if (!val) {
      return false
    }
    this.setState({ walletList: val })
    if (val['1']) {
      this.setState({ availableBalance: getCurrencySymbol('1').sb + val['1'].AA.toFixed(4) })
    }
  }

  // 输入金额
  changeInput(event) {
    this.setState({ inputAmount: event.target.value })
  }

  // 显示下拉
  showSelect() {
    if (this.state.isSelect) {
      this.setState({ isSelect: false })
    } else {
      this.setState({ isSelect: true })
    }
  }

  // 选择币种
  selectCoin(item) {
    const symbol = getCurrencySymbol(item.index) ? getCurrencySymbol(item.index).sb : '$'
    this.setState({
      isSelect: false,
      currentCoin: item.index,
      availableBalance: this.state.walletList[item.index]
        ? symbol + this.state.walletList[item.index].AA.toFixed(4)
        : symbol + '0.000'
    })
  }

  componentWillMount() {
    Event.addListener(Event.EventName.WALLET_UPDATE, this.onWalletUpdate.bind(this), this)
    Event.addListener(Event.EventName.WALLET_TOTAL_UPDATE, this.onWalletUpdate.bind(this), this)
  }

  componentDidMount() {
    this.fetchActivityInfo()
    if (Account.getWalletInfo()) {
      this.onWalletUpdate(Account.getWalletInfo())
    }
    this.fetchMyHistory()
  }

  // 销毁
  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    super.componentWillUnmount()
  }

  getMyHistory() {
    const myHistory = []
    this.state.baseHistoy.forEach((elm) => {
      myHistory.push({
        time: elm.Time.replace('T', ' ').substring(0, 19),
        coin: elm.Params.Coin ? elm.Params.Coin.toFixed(2) + this.convert[elm.Params.Currency] : Intl.lang('ico.beAnnounced'),
        exchange: elm.Params.Exchange ? '$' + elm.Params.Exchange.toFixed(2) : Intl.lang('ico.beAnnounced'),
        price: elm.Params.Price ? '$' + elm.Params.Price.toFixed(3) : Intl.lang('ico.beAnnounced'),
        rate: elm.Params.Rate ? Math.round(elm.Params.Rate * 100) + '%' : Intl.lang('ico.beAnnounced'),
        amount: elm.Params.Amount ? parseInt(elm.Params.Amount) : Intl.lang('ico.beAnnounced')
      })
    })
    return myHistory
  }


  render() {

    const { rate, price, isSelect, currentCoin, availableBalance, timeNumber, timeText } = this.state
    const myHistory = this.getMyHistory()

    return <div className="zwb-main-section">
      <div className="container">
        <h2>{Intl.lang('ico.exchangeTDEx')}</h2>
        <div className="container-center">

          <div className="center-new-left">
            <div className="left-top">
              <div className="top-left">
                <h3>{Intl.lang('ico.todayExchange')}</h3>
                <span>{price}</span>
              </div>
              <div className="top-right">
                <h3>{Intl.lang('ico.currentRate')}</h3>
                <span>{rate}</span>
              </div>
            </div>
            <div className="left-bottom">
              <h3>{Intl.lang('ico.watchAmount')}</h3>
              <div className="bottom-info">
                <div className="info-item info-left">
                  <p>{Intl.lang('ico.btc')}</p>
                  <h4>฿88.8888</h4>
                </div>
                <div className="info-item info-center">
                  <p>{Intl.lang('ico.eth')}</p>
                  <h4>Ξ88.8888</h4>
                </div>
                <div className="info-item info-right">
                  <p>USDT</p>
                  <h4>$88.8888</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="center-new-right">
            <p>{timeText}<span>{timeNumber}</span><a href="javascript:;">{Intl.lang('ico.todayActivityTime')}</a></p>
            <div className="right-select">
              <div className="select-content" onClick={() => this.showSelect()}>
                <span>{this.convert[currentCoin]}</span>
                <ul className="select-list" style={{ height: isSelect ? '90px' : '0' }}>
                  {
                    this.selectList.map(elm => {
                      return <li key={elm.index} onClick={() => this.selectCoin(elm)}>{elm.name}</li>
                    })
                  }
                </ul>
                <a href="javascript:;" className="select-item"></a>
              </div>
              <div className="select-text">{Intl.lang('ico.exchangeAccount')}</div>
            </div>
            <div className="user-wallet">
              <p>{Intl.lang('ico.availableAmount')}<span>{availableBalance}</span></p>
            </div>
            <div className="apply-amount">
              <input value={this.state.inputAmount} onChange={this.changeInput.bind(this)} type="number" />
              <h4>{Intl.lang('ico.exchangeAmount')}：</h4>
            </div>
            <div className="apply-button">
              <a href="javascript:;" onClick={() => this.requestApplyToken(true)}>{Intl.lang('ico.fullExchange')}</a>
              <a href="javascript:;" onClick={() => this.requestApplyToken(false)}>{Intl.lang('ico.confirmExchange')}</a>
            </div>
          </div>
        </div>

        <p className="tip">{Intl.lang('ico.exchangeTip')}</p>
        <h2>{Intl.lang('ico.myExchange')}</h2>
        <div className="container-table">
          <table className="table">
            <thead>
              <tr>
                <th>{Intl.lang('ico.time')}</th>
                <th>{Intl.lang('ico.exchangeAmount')}</th>
                <th>{Intl.lang('ico.toAmount')}</th>
                <th>{Intl.lang('ico.exchangePrice')}</th>
                <th>{Intl.lang('ico.exchangeRate')}</th>
                <th>{Intl.lang('ico.succesAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {
                myHistory.length
                  ? myHistory.map((elm, i) => {
                    return <tr key={i}>
                      <td>{elm.time}</td>
                      <td>{elm.coin}</td>
                      <td>{elm.exchange}</td>
                      <td>{elm.price}</td>
                      <td>{elm.rate}</td>
                      <td>{elm.amount}</td>
                    </tr>
                  })
                  : <tr>
                    <td colSpan="6">{Intl.lang('ico.noData')}</td>
                  </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  }
}