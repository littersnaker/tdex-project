import {checkBrowserSupport} from "../utils/common"
import {parseUri, jsonToQueryString} from '../utils/util'
import pako from 'pako'

const $ = window.$;

function createWs(path, options){
    if (checkBrowserSupport()){
        return new SWS(path, options);
    }
}

function SWS(path, options){
    var uri = parseUri(path);
    if (uri.protocol){
        this.url = ((uri.protocol == 'https' || uri.protocol=='wss') ? 'wss' : 'ws') + '://' + uri.host + (uri.port ? ':' + uri.port : '') + uri.path;
    }else{
        this.url = (window.location.protocol=='https:'? 'wss' : 'ws')+'://'+window.location.host + path;
    }

    this.opts = options;
    this.reqDataType = options && options.reqDataType=='qs' ? 'qs' : 'json';
    this.msgMap = {};
    this.heartBeatTimer = 0;
    this.checkHeartBeatLastTime = 0;
    this.lastPingtSvtTime = 0;
    this.heartBeatInterval = options && options.heartBeatInterval ? options.heartBeatInterval : 10; //后端心跳10秒
    this.errorTimer = 0;

    this.offCount = 0; //判断到断线的次数后，检查是否真的断线，再重连
    this.offMaxCount = 2;

    this.connState = 0; //0:未有连接；1:正在重连; 2：正在连接; 3:已连接; -1:错误
}

SWS.prototype.doOpen = function(){
    if (this.connState >= 2) return;

    this.connState = 2;
    this.afterOpenEmit = [];

    var self = this;

    var BrowserWebSocket = window.WebSocket || window.MozWebSocket;
    var ws = new BrowserWebSocket(this.url);
    ws.binaryType = "arraybuffer";

    ws.onopen = function(evt){
        self._onOpen(evt);
    };
    ws.onclose = function(evt){
        self._onClose(evt);
    };
    ws.onmessage = function(evt){
        self._onMessage(evt.data);
    };
    ws.onerror = function(e){
        self._onError(e);
    };
    this.ws = ws;
}

SWS.prototype._onOpen = function(evt){
    this.connState = 3;
    this._onReceiver({Event:'open'});

    while (this.afterOpenEmit.length>0){
        var data = this.afterOpenEmit.shift();
        this._send(data);
    }
}

SWS.prototype.checkOpen = function () {
    if (this.connState==3) return true;

    return false;
}

SWS.prototype._onClose = function(evt){
    if (this.connState) {
        this._onReceiver({Event:'close'});
    }
    this.connState = 0;
}

SWS.prototype._onError = function(err){
    this._onReceiver({Event:'error', Data: err});

    console.log('ws error');

    this.connState = -1;

    if (!this.errorTimer){
        this.errorTimer = setTimeout( ()=>{
            this.errorTimer = 0;
            this._reconnect();
        }, 500);
    }
}

SWS.prototype._onMessage = function(msg){
    try{
        if (typeof(msg)=='object'){
            var ua = new Uint8Array(msg);
            msg = pako.inflate(ua,{to:"string"});
        }

        this.connState = 3;

        if (this.offCount){
            console.log("receiver "+this.url + ":"+ msg + "! "+ new Date().toLocaleString());
        }

        var data = JSON.parse(msg);
        if (data.ping){
            var pingTime = data.ping;
            this.emit({pong: pingTime});

            //当服务端心跳间隔改变，修改心跳间隔
            if (this.lastPingtSvtTime > 0 && pingTime > this.lastPingtSvtTime){
                var interval = pingTime - this.lastPingtSvtTime;
                if (interval != this.heartBeatInterval && interval < 20){
                    this.heartBeatInterval = interval;
                }
            }
            this.lastPingtSvtTime = pingTime;
        }else if(data.pong){

        }else{
            this._onReceiver({Event:'message', Data:data});
        }

        this.offCount = 0;

        //两秒钟一次
        if (new Date().getTime() - this.checkHeartBeatLastTime > 2) this._checkHeartbeat();
    }catch(e){
        console.error(e);
    }
}

SWS.prototype._checkHeartbeat = function () {
    if (this.heartBeatTimer){
        clearInterval(this.heartBeatTimer);
    }
    // console.log('check '+this.url+' heart beat '+ (this.heartBeatInterval+2) + ' sec');
    this.heartBeatTimer = setInterval(this._checkOffCount.bind(this), (this.heartBeatInterval+2)*1000);
    this.checkHeartBeatLastTime = new Date().getTime();
}

SWS.prototype._checkOffCount = function(){
    this.offCount++;

    if (this.offCount<this.offMaxCount){
        console.log("send ping!"+this.url + ":"+new Date().toLocaleString());
        this.emit({ping: new Date().getTime()});
        return;
    }

    this._reconnect();
}

SWS.prototype._reconnect = function(){
    if (this.connState==1) return;

    console.log("reconnect!"+this.url + ":"+ new Date().toLocaleString());
    if (this.heartBeatTimer){
        clearInterval(this.heartBeatTimer);
        this.heartBeatTimer = 0;
    }

    if (this.ws && this.connState!=0) {
        this.ws.close();
    }

    this.connState = 1;

    setTimeout(()=>{
        this._onReceiver({Event:'reconnect'});
        this.doOpen();
    }, 500);
}

SWS.prototype._onReceiver = function(obj){
    try{
        if (obj){
            var callback = this.msgMap[obj.Event];
            if (callback) callback(obj.Data);
        }
    }catch (e){
        console.error(e);
    }
}

SWS.prototype.emit = function(data){
    if (this.connState != 3){
        this.afterOpenEmit.push(data);
        //this._onReceiver({Event:'error', Data: 'wait for socket open'});
        return;
    }

    this._send(data);
}

SWS.prototype._send = function(data){
    if (this.reqDataType=='json'){
        data = JSON.stringify(data);
    }else{
        data = jsonToQueryString(data);
    }

    this.ws.send(data);
}

SWS.prototype.on = function(name, handler){
    this.msgMap[name] = handler;
}

SWS.prototype.doClose = function(){
    if (this.ws) this.ws.close();
}

SWS.prototype.destroy = function () {
    if (this.heartBeatTimer){
        clearInterval(this.heartBeatTimer);
        this.heartBeatTimer = 0;
    }
    if (this.errorTimer){
        clearTimeout(this.errorTimer);
        this.errorTimer = 0;
    }

    this.doClose();

    this.msgMap = {};
    this.heartBeatTimer = 0;
    this.lastPingtSvtTime = 0;
    this.errorTimer = 0;

    this.connState = 0;
}

export default createWs;
