<template>
  <div id="mine">
    <component :is="currentView" :views="currentView" ref="mine" @viewLogs="viewLogs" @setTdPrice="setTdPrice" :tdPrice="tdPrice"></component>
  </div>
</template>

<script>
import Cookies from 'js-cookie'
import { fetchUrlParams } from '@/utils'
import user from '@/components/MineLogs'
import platform from '@/components/MineLogs'
import trading from '@/components/MineTrade'
import help from '@/components/MineHelp'
export default {
  components: {
    user,
    platform,
    trading,
    help
  },
  data() {
    return {
      currentView: 'trading',
      tdPrice: 0,
      userToken: null
    }
  },
  methods: {
    // 查看日记
    viewLogs(name) {
      this.currentView = name
      this.noticeWebView(name)
    },
    setTdPrice(val) {
      this.tdPrice = val
      console.log(' >> tdPrice :', this.tdPrice)
    },
    // 接收用户身份信息
    receiveData(info) {
      console.log(' >> Output raw data:', info)
      if (!info) return
      if (typeof info !== 'string') return
      try {
        const data = JSON.parse(info)
        this.$store.commit('setUserAuth', data)
        if (data.device !== 'web' && data.cookie) {
          this.setUserCookie(data.cookie)
        }
        if (data.cookie && data.time && data.token) {
          this.$refs.mine.fetchUserData()
        }
        this.userToken = data
      } catch (err) {
        console.error(' >> Receive data error:', err)
      }
    },
    // 设置用户 Cookie
    setUserCookie(cookie) {
      const hostname = window.location.hostname
      switch (hostname) {
        case 'tdex.com':
          Cookies.remove('TDExId')
          Cookies.set('TDExId', cookie)
          break
        case 'www.tdex.com':
          Cookies.remove('TDExId')
          Cookies.set('TDExId', cookie)
          break
        case 'sandbox.tdex.com':
          Cookies.remove('TDExId')
          Cookies.set('TDExId', cookie)
          break
        default:
          Cookies.remove('TDExLocalSessId')
          Cookies.set('TDExLocalSessId', cookie)
      }
    },
    // 导航跳转
    navJump() {
      if (this.currentView !== 'trading') {
        this.currentView = 'trading'
        this.noticeWebView('trading')
      } else {
        this.noticeWebView('exit')
      }
    },
    // 通知 WebView
    noticeWebView(name) {
      const { device } = this.$store.state.userAuth
      console.log(' >> Notice event: ', name)
      switch (device) {
        case 'ios':
          window.postMessage(JSON.stringify({ type: name }))
          break
        case 'android':
          window.androidShare.jsMethod(name)
          break
        default:
          parent.postMessage({ type: name }, '*')
      }
    },
    // 监听 Message 事件
    eventListener(event) {
      console.log(' Event:', event.data)
      const info = event.data
      if (!info.type) return
      switch (info.type) {
        case 'init':
          this.receiveData(JSON.stringify(info.data))
          break
        case 'jump':
          this.navJump()
          break
      }
    }
  },
  created() {
    window.navJump = this.navJump
    window.receiveData = this.receiveData
    window.addEventListener('message', this.eventListener)
    if (fetchUrlParams('lang')) {
      const lang = fetchUrlParams('lang') === 'en-us' ? 'en-us' : 'zh-cn'
      this.$i18n.locale = lang
    }
    if (fetchUrlParams('debug')) {
      const VConsole = require('../../../static/vconsole.min.js')
      const debugLog = new VConsole()
    }
  }
}
</script>

<style lang="less">
@import url('../../styles/index.less');
</style>




