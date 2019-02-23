import request from './request';
import {jsonToQueryString, parseUri} from '../utils/util'
import {isIeLowVersion} from "../utils/common"

const $ = window.$;

function parseData(data) {
    try {
        var start = 0;
        var list = [];
        do {
            var index = data.indexOf('\n', start)
            if (index > 0) {
                var count = parseInt(data.substring(start, index))
                var content = data.substring(index + 1, index + count + 1)
                start = index + count + 1;

                if (count > 0) {
                    var obj = JSON.parse(content);
                    //if (obj.Event == 'Heartbeat') console.log(content);
                    // if (obj.Data && /^[\s]*[\{\[]+[^\]^\}]+[\}\]]+[\s]*$/.test(obj.Data)) obj.Data = JSON.parse(obj.Data);
                    // if (typeof obj.Data == "string")
                    //console.log(obj);
                    list.push(obj);
                }
            }
        } while (index > 0)

        return list;
    } catch (e) {
        console.log(e);
    }
}

function ajax(url, data, method, listener){
    if (isIeLowVersion()){
        if (method == 'post'){
            if (data){
                url += (url.indexOf('?') > 0 ? "&" : "?") + jsonToQueryString( data );
                data = "";
            }
        }
        // IE8 不支持长时间等待，否则会卡主再无返回，所以加一个超时
        url += url.indexOf("?") > 0?"&Timeout=1":"?Timeout=1";
    }

    request(url, {method:method}).then((res)=>{
        if (typeof(listener)=="function"){
            listener(res);
        }
    }).catch((err)=>{
        if (typeof(listener)=="function"){
            listener(null, err);
        }
    });
};

function onDataReceive(data) {
    var list = parseData(data);
    if (!list) console.log(data);
    else{
        for (var i = 0, len = list.length; i < len; i++) {
            var obj = list[i];
            this.onResponse(obj);
        }
    }
}

function SWS(path, SessionId, callback){
    var uri = parseUri(path);
    if (uri.protocol){
        this.url = (uri.protocol == 'https' ? 'wss' : 'ws') + '://' + uri.host + (uri.port ? ':' + uri.port : '') + uri.path + '?SessionId=' + SessionId;
    }else{
        this.url = (window.location.protocol=='https'? 'wss' : 'ws')+'://'+window.location.host + path + '?SessionId=' + SessionId;
    }
    this.callback = callback;
    this.msgMap = {};
    this.connectState = 0;
}
SWS.prototype.onDataReceive = onDataReceive;
SWS.prototype.doOpen = function(){
    if (this.connectState >= 1) return;
    this.connectState = 1;

    var self = this;

    var opened = false;
    var BrowserWebSocket = window.WebSocket || window.MozWebSocket;

    try{
        this.ws = new BrowserWebSocket(this.url);

        this.ws.onopen = function(evt){
            self.onOpen(evt);
            opened = true;
            SWS.Support = true;
        };
        this.ws.onclose = function(evt){
            if (!opened && !SWS.Support) { // 可能是不支持 ws 或 wss
                SimpleWs.xhr = true;
            }
            self.onClose(evt);
        };
        this.ws.onmessage = function(evt){
            self.onData(evt);
        };
        this.ws.onerror = function(e){
            self.onError('websocket error', e);
        };
    }catch (e){
        console.log(e);
    }
}
SWS.prototype.onOpen = function(evt){
    this.connectState = 2;
    this.onResponse({Event:'open'});
    //Event.dispatch("ws_open");

}
SWS.prototype.onClose = function(evt){
    if (this.connectState) {
        this.onResponse({Event:'close'});
    }
    this.connectState = 0;
}
SWS.prototype.onData = function(evt){
    this.onResponse({Event:'message'});
    if (evt.data && evt.data != "0\n") {
        this.onDataReceive(evt.data);
    }
}
SWS.prototype.onError = function(evt){
    this.onResponse({Event:'error'});
    this.ws.close();
}
SWS.prototype.emit = function(name, data){
    this.ws.send(JSON.stringify({Action: name, Data: JSON.stringify(data)}));
    //if (name == 'Heartbeat') console.log(JSON.stringify({Action: name, Data: JSON.stringify(data)}));
}
SWS.prototype.on = function(name, handler){
    this.msgMap[name] = handler;
}
SWS.prototype.clean = function(){
    this.ws.close();
}
SWS.prototype.reconnect = function(){
    this.connectState = 0;

    if (this.ws) {
        this.ws.close();
    }
    this.doOpen();
}
SWS.prototype.onResponse = function(obj){
    if (obj){
        var callback = this.msgMap[obj.Event];
        if (callback) callback(obj.Data);
    }
}

function SXHR(path, SessionId, callback){
    this.url = path + '?SessionId=' + SessionId;
    this.callback = callback;
    this.msgMap = {};
};
SXHR.prototype.onDataReceive = onDataReceive;
SXHR.prototype.doOpen = function(){
    this.timer = null;
    this.needReqCount = 0;
    this.isClose = false;

    var self = this;
    this.cb = function(){
        if (self.needReqCount <= 0) return;
        self.needReqCount--;
        self.startTime = new Date().getTime();
        self.timer = null;

        ajax(self.url, "", 'get', function (data) {
            try {
                if (data){
                    if (data && data != "0\n") {
                        self.onDataReceive(data);
                    }
                }else{
                    self.onResponse({Event:'error'});
                }
            } catch (e) {
                console.log(e);
            }

            // 至少间隔 1s
            if (!self.isClose){
                self.needReqCount++;

                var diffTime = new Date().getTime() - self.startTime;
                self.timer = setTimeout(self.cb, (diffTime > 1000)?0:(1000-diffTime));
            }
        });
    };

    setTimeout(function(){
        self.onResponse({Event:'open'});
    }, 10);
}
SXHR.prototype.emit = function(name, data){
    var self = this;
    ajax(this.url, {
        Action: name,
        Data: JSON.stringify(data)
    }, 'post', function(resp){
        if (resp && resp != "0\n") {
            self.onDataReceive(resp);
        }
        self.needReqCount++;
        if (self.timer == null){
            self.cb();
        }
    });
}

SXHR.prototype.on = function(name, handler){
    this.msgMap[name] = handler;
}

SXHR.prototype.clean = function(){
    this.onResponse({Event:'close'});
    this.isClose = true;
    if (this.timer){
        clearTimeout(this.timer);
        this.timer = null;
    }
}
SXHR.prototype.reconnect = function(){}
SXHR.prototype.onResponse = function(obj){
    if (obj){
        var callback = this.msgMap[obj.Event];
        if (callback) callback(obj.Data);
    }
}

var SimpleWs = {
    xhr: false,
    connect(path, callback){
        var self = this;
        ajax(path, "", 'get', function (SessionId) {
            if (!SessionId){
                self.connect(path, callback);
                return;
            }
            var socket;
            if (self.xhr || $.browser.safari && $.browser.version <= "534.57.2" || (!window.WebSocket && !window.MozWebSocket) || isIeLowVersion()){
                socket = new SXHR(path, SessionId, callback);
            }else{
                socket = new SWS(path, SessionId, callback);
            }
            if (socket){
                if (callback) callback(socket);
            }
        });
    }
};

export default SimpleWs;
