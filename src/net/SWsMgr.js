import SimpleWs from '../net/SimpleWs';
import {WS_URL} from '../config';
import AuthModel from '../model/auth'

export default {
    socket: null,
    socketConnState: 0,
    lastConnectTime: 0,
    priceUpdateHandler: null,
    exchangeUpdateHandler: null,

    isJoinNotify: false,

    heartbeatTimer: null,
    deadHeartCount: 0,
    reconnectCount: 5,
    reconnectTimer:null,

    innerEventList: ['error', 'open', 'close', 'Heartbeat', 'Join'],

    eventMap: {},

    init(){
        this.connect();
    },
    connect(){
        //价格行情及用户事件的推送
        var self = this;
        if (this.socket && !SimpleWs.xhr) {
            // this.socket.reconnect();
            return
        }

        SimpleWs.connect(WS_URL, function(ss){
            if (!ss) return;

            self.socket = ss;

            var opened = false;
            ss.on('error', function(err){
                self.socketConnState = -1;
                self._onEvent('error', err);
            });

            ss.on('open', function () {
                self.socketConnState = 2;
                opened = true;

                ss.emit('Join', {Channel: 'Spot'});

                self.joinNotify();

                self.resetDeadHeartCount();
                self.startHeartbeat();
                self._onEvent('open');
            });

            ss.on('close', function () {
                console.log("websocket close");
                self.isJoinNotify = false;
                self.reconnect();
                self.stopHeartbeat();

                self._onEvent('close');
            });

            ss.on('Heartbeat', function () {
                self.resetDeadHeartCount();
            });

            ss.on('Join', function(data){
                console.log(data);

                self._onEvent('Join');
            });

            for (var event in self.eventMap){
                if (self.innerEventList.indexOf(event)==-1){
                    ss.on(event, self._onEvent.bind(self, event));
                }
            }

            ss.doOpen();
        });
    },
    on(event, handler){
        //message Product  MaxAmount  Price Spot Exchange WalletUpdate OrdersUpdate MailBoxUpdate ListUpdate PayUpdate InterestsUpdate
        if (!this.eventMap[event]) this.eventMap[event] = [];
        else{
            if (this.eventMap[event].indexOf(handler)!=-1) return;
        }
        this.eventMap[event].push(handler);

        //不在内置事件中的，要赋值到
        if (this.socket && this.innerEventList.indexOf(event)== -1){
            this.socket.on(event, this._onEvent.bind(this, event));
        }
    },
    _onEvent(event, data){
        var handlerList = this.eventMap[event];
        if (handlerList){
            handlerList.forEach((handler)=>{
                if (handler) handler(data);
            });

            // console.log(event, JSON.stringify(data));
        }
    },
    joinNotify(){
        var tradeIdVal = AuthModel.getTradeIdValue();
        if (this.socketConnState < 2 || !tradeIdVal) return;

        if (!this.socket) return;

        this.socket.emit("Join", {Channel: "Notify|" + tradeIdVal});

        this.isJoinNotify = true;

        console.log("join notify");
    },
    resetJoinNotify(){
        this.isJoinNotify = false;
    },
    resetDeadHeartCount: function() {
        this.deadHeartCount = 0;
        this.reconnectCount = 5;                 //this.testNum++; console.log("clear reconnect:", this.testNum);
        if (this.reconnectTimer){
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = 0;
            //console.log("clear reconnect");
        }
    },
    //客户端发送
    startHeartbeat: function(){
        if (this.heartbeatTimer==null){
            var self = this;
            this.heartbeatTimer = setInterval(function(){
                self.socket.emit("Heartbeat");
                self.deadHeartCount++;

                if (self.deadHeartCount >= 4){
                    self.reconnect();
                }
            }, 5000);
        }
    },
    stopHeartbeat: function(){
        if (this.heartbeatTimer){
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
            this.deadHeartCount = 0;
        }
    },
    reconnect: function(){
        if (new Date().getTime() - this.lastConnectTime < 1*this.reconnectCount*1000)
            return;

        this.reconnectCount++;

        this.socketConnState = 0;
        this.isJoinNotify = false;             //console.log("reconnect after",1*this.reconnectCount*1000, "ms");
        //this.stopHeartbeat();
        this.reconnectTimer = setTimeout(() => {this.connect();}, 1*this.reconnectCount*1000);

        this.lastConnectTime = new Date().getTime();
    },
}