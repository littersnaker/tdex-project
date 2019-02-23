import React from 'react'
import PureComponent from '../core/PureComponent'
import Intl from '../intl'
import Net from '../net/net'
import History from '../core/history'
// import Decimal from '../utils/decimal'

export default class Ico extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      lang: Intl.getLang(),
      height: Intl.getLang() === 'en-us' ? '4980px' : '4680px',
      day: 10,
      maxDay: 20,
      lastRate: 100,
      price: 0.000,
    }

  }


  // 取活动信息
  fetchActivityInfo() {
    Net.httpRequest('activity/info', { ActivityId: 1002 }, data => {
      if (!data.Status) this.activityInfoData(data.Data.Params)
    }, this)
  }

  // 处理活动信息数据
  activityInfoData(data) {
    this.setState({
      day: data.Day,
      maxDay: data.MaxDay,
      lastRate: Math.round(data.LastRate * 100),
      price: data.Price.toFixed(3)
    })
  }

  // 跳转到申购页面
  toSubscription(event) {
    switch (event) {
      case 'toSubscription':
        // 前往申购页面
        History.push({ pathname: '/subscription' })
        break
      case 'whitePaper':
        // 白皮书
        console.log(' >>缺少白皮书资源...')
        break
      case 'watchVideo':
        // 推荐好友
        History.push({ pathname: '/invite' })
        break
      case 'toHistoryRate':
        // 查看中签率历史
        History.push({ pathname: '/icoHistory', query: { type: 'rate' } })
        break
      case 'toHistoryApply':
        // 查看申购价历史
        History.push({ pathname: '/icoHistory', query: { type: 'apply' } })
        break
    }
  }

  componentDidMount() {
    this.fetchActivityInfo()
    window.toSubscription = this.toSubscription.bind(this)
  }

  componentWillReceiveProps() {

    if (Intl.getLang() === 'en-us') {
      this.setState({ height: '4980px' })
    } else {
      this.setState({ height: '4680px' })
    }

    if (Intl.getLang() !== this.state.lang) {
      this.setState({ lang: Intl.getLang() })
    }
  }

  render() {
    const { lang, height, day, maxDay, lastRate, price } = this.state

    return <div className="zwb-main-section">
      <iframe src={`tdex.html#lang=${lang}&day=${day}&maxDay=${maxDay}&lastRate=${lastRate}&price=${price}`}
        frameBorder="0" scrolling="no" style={{ width: "100%", height: height }} id="ico_frm">
      </iframe>
    </div>
  }
}