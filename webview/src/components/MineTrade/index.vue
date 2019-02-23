<template>
  <scroller>
    <div class="mine-trade">
      <div class="mine-banner" @click="$emit('viewLogs', 'help')">
        <img v-if="lang" src="../../images/minetrade-banner-cn.png" alt="mine-banner" />
        <img v-if="!lang" src="../../images/minetrade-banner-us.png" alt="mine-banner" />
        <div class="banner-button">
          <a href="javascript:;">
            {{$t('banner.detail')}}
          </a>
        </div>
      </div>
      <div class="mine-wrapper">
        <div class="wrapper-list">
          <div class="list-item" v-for="(value, key, index) in platformInfo" :key="key">
            <div class="item-left">
              <i class="item-left-icon" :class="'item-left-icon-' + index"></i>
            </div>
            <div class="item-right">
              <p class="item-title">{{$t(value.title)}}{{ key === 'cost' ? ' BTC' : ' TD'}}</p>
              <p class="item-number">
                <span v-if="value.pay">{{value.pay}}/</span>{{value.td}}</p>
              <p v-if="value.text">{{$t(value.text)}}：{{value.cycle}}</p>
              <p>{{$t(value.desc)}} BTC</p>
              <p>{{value.btc}}</p>
            </div>
          </div>
        </div>
        <h2>{{$t('my.earnings')}}</h2>
        <div class="wrapper-user">
          <div class="user-login" v-if="!userAuth.cookie">
            <p>
              <a href="javascript:;" @click="login">{{$t('user.login')}}</a>
              {{$t('user.view.detail')}}
            </p>
          </div>
          <div class="list-item" v-if="userAuth.cookie" v-for="(value, key, index) in userInfo" :key="key">
            <div class="item-left">
              <i class="item-left-icon" :class="'item-left-icon-' + (index + 3)"></i>
            </div>
            <div class="item-right">
              <p class="item-title">{{$t(value.title)}}</p>
              <p class="item-number">{{value.td}}</p>
              <p>{{$t(value.desc)}}</p>
              <p>{{value.btc}}</p>
            </div>
          </div>
        </div>
        <h2>
          {{$t('platform.detail')}}
          <span @click="$emit('viewLogs', 'platform')">{{$t('view.detail')}}</span>
        </h2>
        <div class="wrapper-table">
          <ul class="table-list">
            <li v-for="(item, key, index) in platformTable">
              <span>{{$t(item.text)}}</span>
              <p>{{item.value}}</p>
            </li>
          </ul>
        </div>
        <h2>
          {{$t('user.detail')}}
          <span v-if="userAuth.cookie && !noData" @click="$emit('viewLogs', 'user')">{{$t('view.detail')}}</span>
        </h2>
        <div class="wrapper-table">
          <div class="user-login" v-if="!userAuth.cookie">
            <p>
              <a href="javascript:;" @click="login">{{$t('user.login')}}</a>
              {{$t('user.view.detail')}}
            </p>
          </div>
          <ul class="table-list" v-if="userAuth.cookie && !noData">
            <li v-for="(item, key, index) in userTable">
              <span>{{$t(item.text)}}</span>
              <p>{{item.value}}</p>
            </li>
          </ul>
          <div class="user-nodata" v-if="userAuth.cookie && noData">
            <i></i>
            <p>
              {{$t('user.nodata')}}
            </p>
          </div>
        </div>
      </div>
    </div>
  </scroller>
</template>

<script>
import moment from 'moment'
import { fetchData } from '@/api'
export default {
  data() {
    return {
      platformInfo: { // 平台信息
        total: {
          title: 'platform.total.title',
          desc: 'platform.total.desc',
          td: '0',
          btc: '0',
          pay: '0'
        },
        current: {
          title: 'platform.current.title',
          desc: 'platform.current.desc',
          td: '0',
          btc: '0'
        },
        cost: {
          title: 'platform.cost.title',
          text: 'platform.cost.text',
          desc: 'platform.cost.desc',
          td: '0',
          btc: '0',
          cycle: '0'
        }
      },
      userInfo: {  // 用户信息
        total: {
          title: 'user.total.title',
          desc: 'user.total.desc',
          btc: '0',
          td: '0',
          pay: '0'
        },
        usable: {
          title: 'user.usable.title',
          desc: 'user.usable.desc',
          btc: '0',
          td: '0'
        },
        bonus: {
          title: 'user.bonus.title',
          desc: 'user.bonus.desc',
          btc: '0',
          td: '0'
        },
        current: {
          title: 'user.current.title',
          desc: 'user.total.desc',
          btc: '0',
          td: '0'
        }
      },
      platformTable: {
        cycle: {
          text: 'table.cycle',
          value: '0~0'
        },
        output: {
          text: 'table.output',
          value: '0/0'
        },
        exchange: {
          text: 'table.exchange',
          value: '0'
        },
        poundage: {
          text: 'table.poundage',
          value: '0'
        },
        distribute: {
          text: 'table.distribute',
          value: '0/0'
        }
      },
      userTable: {
        cycle: {
          text: 'table.cycle',
          value: '0~0'
        },
        output: {
          text: 'table.output',
          value: '0/0'
        },
        exchange: {
          text: 'table.exchange',
          value: '0'
        },
        poundage: {
          text: 'table.poundage',
          value: '0'
        },
        distribute: {
          text: 'table.distribute',
          value: '0/0'
        }
      },
      noData: false,
      lang: true,
      oldPlatformTable: null,
      oldUserTable: null,
      tdPrice: 0
    }
  },
  computed: {
    userAuth() {
      return this.$store.state.userAuth
    }
  },
  watch: {
    tdPrice(oldVal, newVal) {
      if (oldVal !== newVal) {
        this.oldPlatformTable && this.setTableData(this.oldPlatformTable, 'platformTable')
        this.oldUserTable && this.setTableData(this.oldUserTable, 'userTable')
      }
    }
  },
  methods: {
    // 千位分隔符
    thousandBitSeparator(num) {
      let DIGIT = /(^|\s)\d+(?=\.?\d*($|\s))/g
      let MILI = /(?=(?!\b)(\d{3})+\.?\b)/g
      return num && num.toString().replace(DIGIT, m => m.replace(MILI, ','))
    },
    // 获取平台数据
    fetchPlatformData() {
      fetchData('platformInfo').then(data => {
        if (!data) return
        const tdPrice = data.Mining ? data.Mining.Price ? data.Mining.Price : 0 : 0
        const totalTd = data.Mining ? data.Mining.Total ? data.Mining.Total : 0 : 0
        const currentTd = data.Mining ? data.Mining.Coming ? data.Mining.Coming : 0 : 0
        const period = data.Mining ? data.Mining.Period ? data.Mining.Period : 0 : 0
        const costTd = data.Mining ? data.Mining.Commission ? data.Mining.Commission : 0 : 0
        const today = data.Bonus ? data.Bonus.Today ? data.Bonus.Today : 0 : 0
        const total = data.Bonus ? data.Bonus.Total ? data.Bonus.Total : 0 : 0
        const Pay = data.Mining ? data.Mining.Pay ? data.Mining.Pay : 0 : 0

        this.platformInfo.total.td = this.thousandBitSeparator(Number(totalTd).toFixed(4))
        this.platformInfo.total.pay = this.thousandBitSeparator(Number(Pay).toFixed(4))
        this.platformInfo.total.btc = this.thousandBitSeparator(Number(total).toFixed(8))
        this.platformInfo.current.td = this.thousandBitSeparator(Number(currentTd).toFixed(4))
        this.platformInfo.current.btc = this.thousandBitSeparator(Number(today).toFixed(8))
        this.platformInfo.cost.cycle = period
        this.platformInfo.cost.td = this.thousandBitSeparator(Number(costTd).toFixed(8))
        this.platformInfo.cost.btc = this.thousandBitSeparator(Number(tdPrice).toFixed(8))
        this.tdPrice = tdPrice
        this.$emit('setTdPrice', tdPrice)
      })
    },
    // 获取平台表格数据
    fetchPlatformTable() {
      fetchData('platformTable', {
        Data: {
          Page: 1,
          PageSize: 1,
          Action: 0,
          StartTime: parseInt(new Date(moment().subtract(7, 'day').format('YYYY-MM-DD')).getTime() / 1000),
          EndTime: parseInt(Date.now() / 1000)
        }
      }).then(data => {
        if (data && data.List) {
          this.setTableData(data.List, 'platformTable')
          this.oldPlatformTable = data.List
        }
      })
    },
    // 设置表格数据
    setTableData(data, name) {
      if (!data.length) return
      const element = data[0]
      const cycleHealth = 5 * 60000
      const currentPeriod = element.currentPeriod ? element.currentPeriod : 0
      // const health = name === 'userTable' ? element.health : element.health
      const cycleTime = new Date(moment(element.time)).getTime() - cycleHealth
      // console.log(' >> 333 :', new Date(moment(element.time)).getTime())
      const cycleValue = moment(cycleTime).format('YYYY-MM-DD HH:mm')
      const outputTotal = element.mine ? element.mine : 0
      const outputValue = outputTotal / element.health * currentPeriod
      const poundageValue = element.fee ? element.fee : 0
      this[name].cycle.value = cycleValue + '~' + element.time
      this[name].output.value = this.thousandBitSeparator(Number(outputValue).toFixed(4)) + '/' + this.thousandBitSeparator(Number(outputTotal).toFixed(4))
      this[name].exchange.value = this.thousandBitSeparator((outputValue * this.tdPrice).toFixed(8)) + '/' + this.thousandBitSeparator((outputTotal * this.tdPrice).toFixed(8))
      this[name].poundage.value = this.thousandBitSeparator(Number(poundageValue).toFixed(8))
      this[name].distribute.value = currentPeriod + '/' + element.health
    },
    // 获取用户挖矿数据
    fetchUserInfo() {
      fetchData('userInfo', {
        Token: this.userAuth.token,
        Time: this.userAuth.time
      }).then(info => {
        if (!info) return
        const data = info.Mining ? info.Mining : {}
        const totalTd = data.History ? data.History.Total ? data.History.Total : 0 : 0
        const bonusTotal = info.Bonus ? info.Bonus.Total ? info.Bonus.Total : 0 : 0
        const bonusToday = info.Bonus ? info.Bonus.Today ? info.Bonus.Today : 0 : 0
        const validTd = data.History ? data.History.Left ? data.History.Left : 0 : 0
        const preTd = data.History ? data.History.Period ? data.History.Period : 0 : 0
        const pay = data.History ? data.History.Pay ? data.History.Pay : 0 : 0
        const tdPrice = this.tdPrice
        const Coming = info.Coming ? info.Coming.Total ? info.Coming.Total : 0 : 0
        this.userInfo.total.td = this.thousandBitSeparator(Number(totalTd).toFixed(4))
        this.userInfo.total.pay = this.thousandBitSeparator(Number(pay).toFixed(4))
        this.userInfo.total.btc = this.thousandBitSeparator(Number(totalTd * tdPrice).toFixed(8))
        this.userInfo.usable.td = this.thousandBitSeparator(Number(validTd).toFixed(4))
        this.userInfo.usable.btc = this.thousandBitSeparator(Number(preTd).toFixed(2))
        this.userInfo.bonus.td = this.thousandBitSeparator(Number(bonusTotal).toFixed(8))
        this.userInfo.bonus.btc = this.thousandBitSeparator(Number(bonusToday).toFixed(8))
        this.userInfo.current.td = this.thousandBitSeparator(Number(Coming).toFixed(4))
        this.userInfo.current.btc = this.thousandBitSeparator((Coming * tdPrice).toFixed(8))
      })
    },
    // 获取用户表格数据
    fetchUserTable() {
      fetchData('userTable', {
        Token: this.userAuth.token,
        Time: this.userAuth.time,
        Data: {
          Page: 1,
          PageSize: 1,
          Action: 0,
          StartTime: parseInt(new Date(moment().subtract(7, 'day').format('YYYY-MM-DD')).getTime() / 1000),
          EndTime: parseInt(Date.now() / 1000)
        }
      }).then(data => {
        if (data && data.List) {
          this.setTableData(data.List, 'userTable')
          this.oldUserTable = data.List
        } else {
          this.noData = true
        }
      })
    },
    // 获取用户数据
    fetchUserData() {
      this.fetchUserInfo()
      this.fetchUserTable()
    },
    // 登录
    login() {
      const { device } = this.$store.state.userAuth
      switch (device) {
        case 'ios':
          window.postMessage(JSON.stringify({ type: 'login' }))
          break
        case 'android':
          window.androidShare.jsMethod('login')
          break
        default:
          parent.postMessage({ type: 'login' }, '*')
      }
    }
  },
  created() {
    if (this.$i18n.locale === 'en-us') {
      this.lang = false
    }
    this.fetchPlatformData()
    this.fetchPlatformTable()
    if (this.userAuth.cookie && this.userAuth.token && !this.oldUserTable) {
      this.fetchUserData()
    }
  },
  mounted() {
    document.body.style = 'background: #0e0f12 !important;'
  }
}
</script>

<style lang="less">
.mine-trade {
  background: #0e0f12;
  .mine-banner {
    position: relative;
    img {
      display: block;
      width: 100%;
    }
    .banner-button {
      text-align: center;
      position: absolute;
      bottom: 18%;
      left: 0;
      width: 100%;
    }
    a {
      padding: 5px 30px;
      color: #5d3200;
      font-weight: 600;
      font-size: 14px;
      background: url('../../images/minetrade-icon0.png') no-repeat;
      background-size: cover;
    }
  }
  .mine-wrapper {
    padding: 10px 5% 30px;
    .list-item {
      display: flex;
      align-items: center;
      line-height: 30px;
      font-size: 12px;
      padding: 15px 5px;
      background: #1a1f27;
      margin: 0 0 20px;
      .item-left {
        flex: 0.2;
        text-align: center;
        .item-left-icon {
          width: 30px;
          height: 30px;
          display: inline-block;
          background: url('../../images/minetrade-icon1.png') no-repeat;
          background-size: 100% 100%;
          vertical-align: middle;
          &-1 {
            background: url('../../images/minetrade-icon2.png') no-repeat;
            background-size: 100% 100%;
          }
          &-2 {
            background: url('../../images/minetrade-icon3.png') no-repeat;
            background-size: 100% 100%;
          }
          &-3 {
            width: 24px;
            height: 24px;
            background: url('../../images/minetrade-icon4.png') no-repeat;
            background-size: 100% 100%;
          }
          &-4 {
            width: 24px;
            height: 26px;
            background: url('../../images/minetrade-icon5.png') no-repeat;
            background-size: 100% 100%;
          }
          &-5 {
            width: 24px;
            height: 24px;
            background: url('../../images/minetrade-icon6.png') no-repeat;
            background-size: 100% 100%;
          }
          &-6 {
            width: 26px;
            height: 26px;
            background: url('../../images/minetrade-icon7.png') no-repeat;
            background-size: 100% 100%;
          }
        }
      }
      .item-right {
        flex: 0.8;
        color: #868894;
        font-size: 12px;
        line-height: 20px;
      }
      .item-title {
        color: #ff971c;
        font-size: 12px;
        line-height: 24px;
      }
      .item-number {
        font-size: 14px;
        color: #fff;
        margin-bottom: 10px;
        line-height: 24px;
      }
    }
    &>h2 {
      color: #fff;
      font-weight: 500;
      padding: 10px 0 0;
      line-height: 50px;
      font-size: 16px;
      position: relative;
      span {
        font-size: 14px;
        color: #fff;
        position: absolute;
        right: 2px;
        top: 10px;
        line-height: 50px;
      }
    }
    .table-list {
      background: #1a1f27;
      padding: 10px 15px;
      li {
        list-style: none;
        font-size: 14px;
        color: #fff;
        border-bottom: 1px solid #2d3038;
        padding: 15px 0;
        &:last-child {
          border-bottom: 0;
        }
      }
      span {
        color: #ff971c;
        display: block;
        margin-bottom: 10px;
      }
      p {
        color: #fff;
      }
    }
    .user-login {
      font-size: 14px;
      line-height: 66px;
      background: #1a1f27;
      text-align: center;
      color: #fff;
      a {
        color: #ff971c;
      }
    }
    .user-nodata {
      background: #1a1f27;
      text-align: center;
      color: #fff;
      padding: 20px 0;
      font-size: 14px;
      i {
        display: inline-block;
        width: 60px;
        height: 65px;
        background: url('../../images/minetrade-icon8.png') no-repeat;
        background-size: 100% 100%;
      }
      p {
        line-height: 40px;
      }
    }
  }
}
</style>

