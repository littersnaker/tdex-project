// import 'whatwg-fetch';
// import {API_URL} from '../config'
// import {isEmptyObject} from '../utils/util'


/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 *
 * @return {object}           The response data
 */
 function request(url, options) {
  //带cookies、跨域
  if (!options){
      options = {};
  }
  options = Object.assign({credentials: 'include', mode: 'cors', headers:{ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}}, options);

  // console.log("request "+url);
  return fetch(url, options)
    .then(checkStatus)
}


export default request;
