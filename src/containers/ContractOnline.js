import React from 'react'
import PureComponent from '../core/PureComponent'
import Intl from '../intl'
import GlobelStore from '../stores'
import history from '../core/history'
import { getParameterByName } from '../utils/util'

class ContractOnline extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {}
  }

  clickJump = index => {
    const uInfo = GlobelStore.getUserInfo()
    const device = getParameterByName('device')
    switch (index) {
      case 0: {
        if (device && device === 'ios') {
          window.postMessage(JSON.stringify({ type: 'trade' }))
        } else if (device && device === 'android') {
          window.androidShare.jsMethod('trade')
        } else {
          history.push({
            pathname: '/login',
            query: { return_to: '/trade/BTCUSD' }
          })
        }
        break
      }
      case 1: {
        if (!uInfo.Email && device && device === 'ios') {
          window.postMessage(JSON.stringify({ type: 'login' }))
        } else if (!uInfo.Email && device && device === 'android') {
          window.androidShare.jsMethod('login')
        } else {
          history.push('/activities/luckDraw')
        }
        break
      }
    }
  }

  render() {
    const activeList = [
      {
        title: Intl.lang('contract.online.text7'),
        text: Intl.lang('contract.online.text8'),
        btn: Intl.lang('contract.online.text9')
      },
      {
        title: Intl.lang('contract.online.text10'),
        text: Intl.lang('contract.online.text11'),
        tips: Intl.lang('contract.online.text12'),
        btn: Intl.lang('contract.online.text13')
      },
      {
        title: Intl.lang('contract.online.text14'),
        text: Intl.lang('contract.online.text15'),
        btn: Intl.lang('contract.online.text16')
      }
    ]
    const ruleList = [
      Intl.lang('contract.online.text17'),
      Intl.lang('contract.online.text18'),
      Intl.lang('contract.online.text19'),
      Intl.lang('contract.online.text20'),
      Intl.lang('contract.online.text21'),
      Intl.lang('contract.online.text22')
    ]
    return (
      <div className="contract-online-style">
        <div className="inside-page-web-bg" />
        <div className="inside-web-part">
          <h3 className="contract-online-title">
            <span className="contract-online-fff">
              {Intl.lang('contract.online.text1')}
            </span>
            <span className="contract-online-f3b652">
              {Intl.lang('contract.online.text2')}
            </span>
          </h3>
          <p className="contract-online-text contract-online-fff">
            {Intl.lang('contract.online.text3')}
            <span>{Intl.lang('contract.online.text4')}</span>
          </p>
          <p className="contract-online-time contract-online-fff">
            {Intl.lang('contract.online.text5')}
          </p>
          <div className="contract-online-content">
            <div className="contract-online-unline" />
            <div className="contract-online-flex">
              {activeList &&
                activeList.map((item, key) => {
                  return (
                    <div className={'item ' + Intl.getLang()} key={key}>
                      <div className="contract-online-actvity-title">
                        <h4>{item.title}</h4>
                        <p>{item.text}</p>
                        <p className="fs12">{item.tips}</p>
                      </div>
                      <div className={'contract-online-actvity-bg bg-' + key} />
                      {key === 2 ? (
                        <a href="https://jinshuju.net/f/uzEoIf" target="_blank">
                          {item.btn}
                        </a>
                      ) : (
                        <button onClick={this.clickJump.bind(this, key)}>
                          {item.btn}
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>
            <div className="contract-online-rule">
              <h3>{Intl.lang('contract.online.text6')}</h3>
              <ul className="contract-online-rule-text">
                {ruleList &&
                  ruleList.map((item, key) => {
                    return (
                      <li
                        key={key}
                        dangerouslySetInnerHTML={{ __html: item }}
                      />
                    )
                  })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ContractOnline
