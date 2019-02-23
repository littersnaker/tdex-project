import Vue from 'vue'
import Mine from './mine.vue'
import i18n from '@/language/mine'
import store from '@/store/mine'
import toast from '@/components/Toast'
import VueScroller from 'vue-scroller'
import VuePicker from '@/components/VuePicker'
Vue.use(toast)
Vue.use(VuePicker)
Vue.use(VueScroller)

new Vue({
  el: '#mine',
  i18n,
  store,
  render: h => h(Mine)
})