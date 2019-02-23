import url from './url'
import api from './config'

export const fetchData = (name, params) => {
  return api.post(url[name], JSON.stringify(params)).then(response => response)
}