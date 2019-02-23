import Vue from 'vue';

import picker from './picker'
import datepicker from './datepicker'

export default (Vue, options) => {

	Vue.prototype.$picker = picker
	Vue.prototype.$datepicker = datepicker
}

export { picker, datepicker }