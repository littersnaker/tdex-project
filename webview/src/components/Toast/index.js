import ToastVue from './toast.vue'
export default {
  install(Vue, options) {
    const CONSTRUCTOR = Vue.extend(ToastVue)
    const CACHE = {}
    Object.assign(ToastVue.DEFAULT_OPT, options)
    function toasts(msg, options = {}) {
      options.message = msg
      let toastWrap = CACHE[options.id] || (CACHE[options.id] = new CONSTRUCTOR)
      if (!toastWrap.$el) {
        let vm = toastWrap.$mount()
        document.querySelector(options.parent || 'body').appendChild(vm.$el)
      }
      toastWrap.queue.push(options)
    }
    let toast = {
      info: function (msg) {
        toasts(msg, options = { className: 'et-warn' })
      },
      error: function (msg) {
        toasts(msg, options = { className: 'et-alert' })
      },
      success: function (msg) {
        toasts(msg, options = { className: 'et-info' })
      }
    }
    Vue.$toast = Vue.prototype.$toast = toast
  }
}