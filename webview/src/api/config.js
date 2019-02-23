import Vue from 'vue'
import axios from 'axios'
const api = axios.create({
  timeout: 5000,
  withCredentials: true,
  baseURL: process.env.NODE_ENV === 'production' ? 'https://tl.tdex.com' : '/zwb',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  }
})

//添加自定义实例请求拦截器
api.interceptors.request.use(
  config => config,
  error => console.error(error)
)
//添加自定义实例响应拦截器
api.interceptors.response.use(
  response => {
    if (response.data.Status) {
      return false
    }
    return response.data.Data ? response.data.Data : response.data
  },
  error => {
    console.error(error)
    return false
  }
)

export default api