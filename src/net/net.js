import request from './request';
import Event from '../core/event'
import {toast, isIeLowVersion, getErrMsg} from '../utils/common'
import Notification from '../utils/notification';
import {HTTP_API_URL} from '../config'
import Intl from '../intl';
import AuthModel from '../model/auth'
import cdAlert from '../utils/CDAlert';


const $ = window.$;
const _hmt = window._hmt;

const Net = {
    sysTimeHandler: null,
    freqReqErrCode: 10154, //频繁请求错误码
    freqReqResetTime: 0, //下次允许请求的时间
    reqApiMap:{}, //api请求保存
    apiErrorNoPrompt: ["user/login", "user/register", "user/activate", "user/forget", "user/token"], //不自动提示的api接口
    apiNoLimitRepeat: ["trade/open", "trade/close", "trade/orders", "spot/buy", "spot/sell",
        "spot/orders", "spot/history", "futures/open", "futures/close", "futures/closeAll", "futures/cancel", "futures/merge", "user/token"], //不限制重复请求时间的api

    parseResponse: (response)=>{
        var contentType = response.headers.get('Content-Type');
        var respPromise;
        if (contentType){
            var type = contentType.split(";")[0];
            switch (type) {
                case 'text/html':
                    respPromise = response.text();
                    break
                // case 'application/json':
                //     return response.json();
                //     break
                default:
                    respPromise = response.json();
            }
        }else{
            var suffix = response.url.substr(-5);
            // console.log(suffix);
            if (suffix=='.json'){
                respPromise = response.json();
            }else{
                respPromise = response.text();
            }
        }

        return respPromise.then((body)=>{
            return {obj:body, header:response.headers};
        });
    },

    //errAutoPrompt: 接口返回错误时，是否自动弹出提示，默认自动弹出
    httpRequest(name, reqData, listener, winObj, method = 'post', reqDataType = 'json', dataType, errAutoPrompt=true) {
        method = method.toLowerCase();

        var startTime = new Date().getTime();
        var fullUrl = name.substr(0, 4)!='http' ? HTTP_API_URL + name : name;

        if (typeof(listener)=="function" && winObj) {
            this.addListener(name, listener, winObj);
        }

        var data = "";
        // var tradeValue = AuthModel.getTradeIdValue();
        var methodName = method;
        if (reqData && ['post', 'put'].indexOf(method)!=-1 && reqDataType == 'json'){
            data = reqData;
        }else if (method == 'get' && reqData){
            fullUrl = fullUrl + '?'+ (typeof(reqData)=='string' ? reqData : $.param(reqData));
            data = "";
            methodName = 'post';
        }else if (method == 'delete' && reqData){
            data = reqData;
            methodName = 'delete';
        }

        var token = AuthModel.getToken();
        if (!token && !data) {

        }else if (!data){
            data = JSON.stringify({"Token": token, "Time": Number(AuthModel.getTokenTime())});
        } else {
            data = JSON.stringify({"Token": token, "Time": Number(AuthModel.getTokenTime()), "Data": data});
        }
        //
        // if ( tradeValue ){
        //     fullUrl += (fullUrl.indexOf("?") > 0 ? "&" : "?") + "MyTradeId="+tradeValue;
        // }

        if (this.apiNoLimitRepeat.indexOf(name)==-1){
            var saveInfo = this.reqApiMap[fullUrl];
            var now = new Date().getTime();
            if (saveInfo && saveInfo[data]){
                if ( now - saveInfo[data] < 500 ) {
                    //toast("请勿频繁请求", true);
                    if (typeof(listener)=="function"){
                        var data = {Status:-2};
                        if (winObj){
                            this.dispatch(name, data);
                            this.removeListener(name, listener);
                        }else{
                            listener(data);
                        }
                    }
                    if ("production" !== process.env.NODE_ENV){
                        self.showError("请勿频繁请求！");
                        console.log("repeat http request:", fullUrl);
                    }else{
                        self.showError(Intl.lang("error.api.callLimit"));
                    }
                    return;
                }
            }
            if (this.reqApiMap[fullUrl]){
                var rData = this.reqApiMap[fullUrl][data];
                if (rData){
                    rData.t = now;
                    rData.count += 1;
                    if (rData.count >= 10){
                        this.isDisconn = true;
                        console.log("http request disconnect!")
                        return;
                    }
                }else{
                    this.reqApiMap[fullUrl][data] = {t:now, count:1};
                }
            }
            else {
                this.reqApiMap[fullUrl] = {};
                this.reqApiMap[fullUrl][data] = {t:now, count:1};
            }
        }

        var self = this;
        request(fullUrl, {method:methodName, body:data}).then(this.parseResponse).then(({obj, header})=>{
            // setTimeout(()=>{
                try{
                    var endtime1 = new Date().getTime();
                    console.log("request "+name+" "+(endtime1-startTime)+"ms");

                    if (self.reqApiMap[fullUrl])delete self.reqApiMap[fullUrl][data];

                    const _callListener = ()=>{
                        if (typeof(listener)=="function"){
                            if (winObj){
                                self.dispatch(name, obj);
                                self.removeListener(name, listener);
                            }else{
                                listener(obj);
                            }
                        }
                    }

                    if (obj && obj.Status && obj.Status!=0){
                        //服务端限制频繁访问
                        if (obj.Status == self.freqReqErrCode){
                            if (winObj){
                                self.removeListener(name, listener);
                            }
                            if (_hmt) _hmt.push(["_trackEvent", name, "error", "server-"+obj.Status]);

                            if (self.freqReqResetTime==0){
                                //弹窗屏蔽
                                var now = self.sysTimeHandler();
                                var resetTs = parseInt(header.get("x-ratelimit-reset"));
                                if (resetTs){
                                    var remainSec = resetTs - now;
                                    if (remainSec>0){
                                        cdAlert(remainSec);
                                        self.freqReqResetTime = resetTs;
                                    }
                                }
                            }

                            return;
                        }
                        _callListener();

                        if (obj.Status==10004 || obj.Status==10301){
                            AuthModel.resetAuth();
                            AuthModel.redirectLogin();
                            // toast("登录已过期失效");
                        }else{
                            if (self.apiErrorNoPrompt.indexOf(name)==-1 && errAutoPrompt){
                                self.showError(obj);
                            }
                        }

                        if (_hmt) _hmt.push(["_trackEvent", name, "error", "server-"+obj.Status]);
                    }else{
                        if (self.freqReqResetTime && self.freqReqResetTime - self.sysTimeHandler()<=0){
                            self.freqReqResetTime = 0;
                        }

                        _callListener();

                        if (_hmt) _hmt.push(["_trackEvent", name, "success"]);
                    }
                    console.log("request "+name+" dispatch "+(new Date().getTime()-endtime1)+"ms");
                }catch (e){
                    if ("production" !== process.env.NODE_ENV) console.error(e);
                }
            // }, 2000);
        }).catch((err)=>{
            try {
                if (_hmt) _hmt.push(["_trackEvent", name, "error", "http-"+(err && err.response ? err.response.status : "")]);

                if (typeof(listener) == "function") {
                    var obj = {Status: -1};
                    if (winObj) {
                        self.dispatch(name, obj);
                        self.removeListener(name, listener);
                    } else {
                        listener(obj);
                    }
                }

                //非生产环境提示错误，生产环境5秒后重新请求
                if ("production" !== process.env.NODE_ENV){
                    self.showError("接口"+name+"出错:"+err.message);
                }
                else {
                    setTimeout(function () {
                        self.httpRequest(name, reqData, listener, winObj, method, reqDataType, dataType);
                    }, 5000);
                }
            }catch (e){
                if ("production" !== process.env.NODE_ENV) console.error(e);
            }
        });
    },
    showError(obj){
        Notification.error(this.getErrMsg(obj));
    },
    getErrMsg(obj){
        var msg;
        var to = typeof(obj);
        if (to=='object'){
            if (obj.Data){
                msg = getErrMsg(obj.Error, obj.Data);
            }else{
                var errMsg = obj.Error;
                if (errMsg){
                    errMsg = errMsg.split(" @")[0];
                }
                else if(obj.Status && Number(obj.Status)>=1000 && Number(obj.Status)<3000){
                    errMsg = Intl.lang("server.status."+obj.Status);
                }
                msg = obj.Status + " -- " + errMsg
            }
        }else{
            msg = obj;
        }
        return msg;
    },
    setSysTimeHandler(handler){
        this.sysTimeHandler = handler;
    },
    addListener(name, listener, obj){
        Event.addListener(name, listener, obj);
    },
    dispatch(name, data){
        Event.dispatch(name, data);
    },
    removeListeners(obj){
        Event.removeListeners(obj);
    },
    removeListener(name, listener){
        Event.removeListener(name, listener);
    },
};

export default Net;
