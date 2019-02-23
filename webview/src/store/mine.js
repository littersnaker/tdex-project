import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

const state = {
  userAuth: { // 用户认证信息
    cookie: '', // 服务端返回的 MyTradeId 字段
    token: '',  // 服务端返回 Token
    time: 0,  // 同 Token 一起返回的时间戳
    device: 'web'  // 设备类型 android 或 ios
  }
}

const actions = {

}

const mutations = {
  // 设置用户认证信息
  setUserAuth(state, data) {
    state.userAuth.cookie = data.cookie
    state.userAuth.token = data.token
    state.userAuth.time = Number(data.time)
    state.userAuth.device = data.device
  }
}
export default new Vuex.Store({
  state,
  actions,
  mutations
})
