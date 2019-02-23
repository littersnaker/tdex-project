<template>
  <scroller :on-infinite="infinite" :no-data-text="$t('noDataText')">
    <div class="mine-logs">
      <div class="header-info">
        <p>{{$t('user.total.title')}}</p>
        <p class="number">{{headerInfo.pay}}/{{headerInfo.td}}</p>
        <p>{{$t('user.total.desc')}}：{{headerInfo.btc}}</p>
      </div>
      <h2>
        {{$t('mine.list')}}
        <span @click="selectViewType">{{$t(select)}}</span>
      </h2>
      <div class="select-date">
        <div class="select-left" @click="selectStartDate">
          <p>{{$t('start.date')}}</p>
          <p>{{startDate}}</p>
        </div>
        <div class="select-right" @click="selectEndDate">
          <p>{{$t('end.date')}}</p>
          <p>{{endDate}}</p>
        </div>
      </div>
      <div class="logs-table">
        <ul class="table-list" v-for="(child, index) in tableData" :key="index">
          <li v-for="(item, key, index) in child" :key="key">
            <span>{{$t(item.text)}}</span>
            <p>{{item.value}}</p>
          </li>
        </ul>
      </div>
    </div>
  </scroller>
</template>

<script>
import moment from 'moment'
import { fetchData } from '@/api'
export default {
  props: {
    views: {
      type: String,
      default: 'platform'
    },
    tdPrice: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      page: 1,
      total: 0,
      action: 0,
      select: 'select.cycle',
      headerInfo: {
        td: '0',
        pay: '0',
        btc: '0'
      },
      platform: {
        header: 'platformInfo',
        table: 'platformTable'
      },
      user: {
        header: 'userInfo',
        table: 'userTable'
      },
      startDate: moment().subtract(2, 'day').format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD'),
      tableData: [],
      oldTableData: null
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
        console.log(' >> Watch price:', this.tdPrice)
        this.oldTableData && this.setTableData(this.oldTableData)
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
    // 上拉加载
    infinite(done) {
      setTimeout(() => {
        if (this.page <= this.total) {
          this.page++
          this.fetchTableData()
          done()
        } else {
          done(true)
        }
      }, 1000)
    },
    // 选择查看类型
    selectViewType() {
      this.$picker({
        title: this.$i18n.t('select'),
        oktext: this.$i18n.t('confirm'),
        closetext: this.$i18n.t('close'),
        option: [this.$i18n.t('select.cycle'), this.$i18n.t('select.day')]
      }).then(value => {
        if (value === '按周期查看' || value === 'Mining period') {
          this.select = 'select.cycle'
          this.action = 0
          this.resetRequestData()
        } else if (value === '按天数查看' || value === 'Days') {
          this.select = 'select.day'
          this.action = 1
          this.resetRequestData()
        }
      }).catch(err => console.log(err))
    },
    // 重置请求数据
    resetRequestData() {
      this.page = 1
      this.total = 0
      this.tableData = []
      this.fetchTableData()
    },
    // 选择开始时间
    selectStartDate() {
      this.$datepicker({
        title: this.$i18n.t('select'),
        oktext: this.$i18n.t('confirm'),
        closetext: this.$i18n.t('close'),
      }).then(value => {
        const startValue = parseInt(value.join(''))
        const endValue = parseInt(this.endDate.replace(/-/g, ''))
        if (startValue > endValue) {
          this.$toast.error(this.$i18n.t('toast.start'))
        } else {
          this.startDate = value.join('-')
          this.resetRequestData()
        }
      }).catch(err => console.log(err))
    },
    // 选择结束时间
    selectEndDate() {
      this.$datepicker({
        title: this.$i18n.t('select'),
        oktext: this.$i18n.t('confirm'),
        closetext: this.$i18n.t('close'),
      }).then(value => {
        const endValue = parseInt(value.join(''))
        const startValue = parseInt(this.startDate.replace(/-/g, ''))
        if (endValue < startValue) {
          this.$toast.error(this.$i18n.t('toast.end'))
        } else {
          this.endDate = value.join('-')
          this.resetRequestData()
        }
      }).catch(err => console.log(err))
    },
    // 获取头部数据
    fetchHeaderData() {
      fetchData(this[this.views].header, this.userAuth).then(data => {
        if (!data) return
        if (this[this.views].header !== 'platformInfo') {
          this.setUserInfo(data)
        } else {
          this.setPlatformInfo(data)
        }
      })
    },
    // 设置平台信息
    setPlatformInfo(data) {
      const tdPrice = data.Mining ? data.Mining.Price ? data.Mining.Price : 0 : 0
      const totalTd = data.Mining ? data.Mining.Total ? data.Mining.Total : 0 : 0
      const pay = data.Mining ? data.Mining.Pay ? data.Mining.Pay : 0 : 0
      this.headerInfo.td = this.thousandBitSeparator(Number(totalTd).toFixed(4))
      this.headerInfo.pay = this.thousandBitSeparator(Number(pay).toFixed(4))
      this.headerInfo.btc = this.thousandBitSeparator((totalTd * tdPrice).toFixed(8))
      this.tdPrice = tdPrice
    },
    // 设置用户信息
    setUserInfo(info) {
      const data = info.Mining ? info.Mining : {}
      const totalTd = data.History ? data.History.Total ? data.History.Total : 0 : 0
      const pay = data.History ? data.History.Pay ? data.History.Pay : 0 : 0
      this.headerInfo.td = this.thousandBitSeparator(Number(totalTd).toFixed(4))
      this.headerInfo.pay = this.thousandBitSeparator(Number(pay).toFixed(4))
      this.headerInfo.btc = this.thousandBitSeparator((totalTd * this.tdPrice).toFixed(8))
    },
    // 获取表格数据
    fetchTableData() {
      const params = this.userAuth
      params.Data = {
        Page: this.page,
        PageSize: 5,
        Action: this.action,
        StartTime: parseInt(new Date(this.startDate).getTime() / 1000),
        EndTime: parseInt(new Date(this.endDate + ' 23:59').getTime() / 1000)
      }
      fetchData(this[this.views].table, params).then(data => {
        if (data && data.List) {
          this.total = data.PageCount
          if (this.action) {
            this.setActionTableData(data.List)
          } else {
            this.setTableData(data.List)
          }
          !this.tableData.length && (this.oldTableData = data.List)
        }
      })
    },
    // 设置表格数据
    setTableData(data) {
      if (!data.length) return
      data.forEach(function(element) {
        const cycleHealth = 5 * 60000
        const currentPeriod = element.currentPeriod ? element.currentPeriod : 0
        const health = this.views === 'platform' ? element.health : element.health
        const cycleTime = new Date(moment(element.time)).getTime() - cycleHealth
        const cycleValue = moment(cycleTime).format('YYYY-MM-DD HH:mm')
        const outputTotal = element.mine ? element.mine : 0
        const outputValue = outputTotal / element.health * currentPeriod
        const poundageValue = element.fee ? element.fee : 0
        this.tableData.push({
          cycle: {
            text: 'table.cycle',
            value: cycleValue + '~' + element.time
          },
          output: {
            text: 'table.output',
            value: this.thousandBitSeparator(Number(outputValue).toFixed(4)) + '/' + this.thousandBitSeparator(Number(outputTotal).toFixed(4))
          },
          exchange: {
            text: 'table.exchange',
            value: this.thousandBitSeparator((outputValue * this.tdPrice).toFixed(8)) + '/' + this.thousandBitSeparator((outputTotal * this.tdPrice).toFixed(8))
          },
          poundage: {
            text: 'table.poundage',
            value: this.thousandBitSeparator(poundageValue.toFixed(8))
          },
          distribute: {
            text: 'table.distribute',
            value: currentPeriod + '/' + health
          }
        })
      }, this)
    },
    setActionTableData(data) {
      if (!data.length) return
      data.forEach(function(element) {
        const value = element.toUSDT ? element.toUSDT : 0
        const outputTotal = element.mine ? element.mine : 0
        const poundageValue = element.fee ? element.fee : 0
        this.tableData.push({
          cycle: {
            text: 'table.cycle',
            value: element.time
          },
          output: {
            text: 'table.output',
            value: value ? this.thousandBitSeparator(Number(value).toFixed(4)) + '/' + this.thousandBitSeparator(Number(outputTotal).toFixed(4)) : this.thousandBitSeparator(Number(outputTotal).toFixed(4))
          },
          exchange: {
            text: 'table.exchange',
            value: this.thousandBitSeparator((outputTotal * this.tdPrice).toFixed(8))
          },
          poundage: {
            text: 'table.poundage',
            value: this.thousandBitSeparator(poundageValue.toFixed(8))
          }
        })
      }, this)
    }
  },
  created() {
    this.fetchHeaderData()
    this.fetchTableData()
  },
  mounted() {
    document.body.style = 'background: #12151c !important;'
  }
}
</script>

<style lang="less">
.mine-logs {
  padding: 20px 5%;
  .header-info {
    background: #1a1f27;
    padding: 25px 0;
    text-align: center;
    .number {
      color: #ff971c;
      font-size: 16px;
      line-height: 40px;
      font-weight: 600;
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
      padding-right: 18px;
      &:after {
        content: "";
        width: 0;
        height: 0;
        border-right: 5px solid transparent;
        border-top: 5px solid #fff;
        border-left: 5px solid transparent;
        background-color: transparent;
        position: absolute;
        right: 0;
        top: 22px;
      }
    }
  }
  .select-date {
    overflow: hidden;
    position: relative;
    margin-bottom: 20px;
    &:after {
      content: "";
      width: 3%;
      height: 1px;
      background: #868894;
      position: absolute;
      left: 48.5%;
      top: 50%;
    }
    .select-left {
      width: 46%;
      float: left;
      font-size: 14px;
      line-height: 24px;
      padding: 6px 0;
      text-align: center;
      background: #1a1f27;
      color: #868894;
      position: relative;
      &:after {
        content: "";
        width: 0;
        height: 0;
        border-right: 5px solid transparent;
        border-top: 5px solid #868894;
        border-left: 5px solid transparent;
        background-color: transparent;
        position: absolute;
        right: 10%;
        top: 48%;
      }
    }
    .select-right {
      .select-left;
      float: right;
    }
  }
  .table-list {
    background: #1a1f27;
    padding: 10px 15px;
    margin-bottom: 20px;
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
}
</style>


