import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import createWs from '../net/ws'
import Auth from '../model/auth';
import {CHAT_WS_URL} from '../config';
import System from '../model/system';
import { getEmojiData } from '../model/emojiSource';
import { htmlEscape } from '../utils/util';
//import BadWord from '../../public/badWords.js';

import LogoPng from '../images/logo.png';

const $ = window.$;

class Chat extends PureComponent {

	constructor(props) {
		super(props);

		this.chatOpen = false;
		this.chatMax = false;

        this.WS_URl = CHAT_WS_URL;

        this.unmount = false;
		this.maxSize = 100;   //显示信息最多条数
		this.msgMaxLen = 100; //消息最长限制
		this.nickNameLen = 12;
		this.sayLastTime = 0;
		this.sayIntervalSec = 5;
		// this.isConnect = false;
		this.tabPrefKey = "chatTab";
		this.lang = Intl.getLang();
		this.badWords = "习近平|江泽民|胡锦涛|共产党|毛泽东|毛主席|刘少奇|朱德|周恩来|周总理|邓小平|蒋介石|林彪|江青|金正日|你妈|尼玛|逼|波|你妈逼|妈卖批|mmp|贱|垃圾|废物|傻逼|傻比|蠢猪|婊子|贱人|贱货|贱逼|色女|母狗|fuck|tmd|他妈的|我操|操|我日";
		this.webBadWords = "script|javascript|[\$\(]|https|http|ftp|file|rtsp|mms|[:\/\/].*[com\|cn]|[:\/\/]|www.|www|.com|.cn";
		this.AppEmoji = null;

		this.msgBox = [[],[],[],[]];
        this.isDrag = false;
		this.dragType = 'Y';
		this.curX = 0;
		this.state = {
			tab:this.getPreference(),
			channels:[],
			curChannel:null,
			msgs: [],
			usrCount: 0,
			isSetNick: false,
			nickName: "",
			tdShow: false,
			showLoad:true
		};
	}
	getPreference(){
		var tab = this.lang=='zh-cn'? 0: this.lang=='en-us'? 2 : 1;
		var newTab = Auth.loadPreference(this.tabPrefKey, tab);

		return newTab;
	}

	componentDidMount() {
        this.initWsConnect();
        this.initChatDom();
        this.checkLogin(this.props);

		this.AppEmoji = getEmojiData();
	}

	componentWillReceiveProps(nextProps){
		if (this.props.user!=nextProps.user){
            this.checkLogin(nextProps);
		}
	}
	checkLogin(props){
		//判断是否登陆
		if(Auth.checkUserAuth()) {
			if (this.state.user) return;

			const {user} = props;
			if (!user.Uid) return;

			this.setState({user: user, uid: user.Uid});
			if (this.ws.checkOpen()) this.auth(user);
		}
	}
	initWsConnect(){
		var wsUrl = this.WS_URl;
		var ws = this.ws = createWs(wsUrl, {reqDataType:'qs', heartBeatInterval:20}), self = this;
		if (ws){
			ws.on('open', ()=>{
				self.setState({showLoad:false});
                self.msgBox = [[],[],[],[]];
                self.getChannelsList();
                if (Auth.checkUserAuth()) self.auth(self.props.user);
                self.toast(Intl.lang("chat.1"), false, 2500);
			});

			ws.on('close', ()=>{
				console.log("chat close");
			});

			ws.on('error', ()=>{
                console.log("chat error");
			});

            ws.on('reconnect', ()=>{
            	self.setState({showLoad:true});
                self.toast(Intl.lang("chat.reConnect")+'...', true);
			});

			ws.on('message', this._onMessage.bind(this));

			ws.doOpen();
		}
	}
    initChatDom(){
        var self = this;
        //表情选项卡
        $(".expression ul li").on("click", function() {
            $(".expression ul li").eq($(this).index()).addClass("active").siblings().removeClass('active');
            $(".emjoy").hide().eq($(this).index()).show();
        });
        //点击输入input框
        $(".emjoy span").on("click", function(e) {
        	if (self.checkCanSay()){
                var _s = $(this);
                var old = $("#input").val();
                $("#input").val(old + _s.text());
			}else{
                e.stopPropagation();
			}
        });

        $("#input").on("keydown", function(e) {
            if (self.checkCanSay()) {
                if (e.keyCode == 13) {
                    self.sendMessage();
                }
            }else{
                e.stopPropagation();
                e.preventDefault();
			}
        });
    }
    checkCanSay(){
		return Auth.checkUserAuth() && this.state.nickName;
	}
	toast(msg, isRed, outMilSec){
        $('.frequent').fadeIn();
        $('.frequent').css('color', isRed ? 'red':'green');
        $('.frequent').text(msg);

        if (outMilSec){
        	if (this.fadeOutTimer){
        		clearTimeout(this.fadeOutTimer);
			}
			var self = this;
            this.fadeOutTimer = setTimeout(function() {
				if (!self.unmount) $('.frequent').fadeOut();
			}, outMilSec);
        }
	}

	componentWillUnmount() {
        this.unmount = true;
		this.quitChat();
	}
	quitChat(){
		if(this.ws){
			this.ws.destroy();
			this.ws = null;
		}
		$(".expression ul li").off('click');
		$(".input .emojy").off('click');
		$(".emjoy span").off('click');
		$(".emjoy span").off('click');
		$("#input").off("keydown");
	}
	//聊天滚动条自动往下
	addScrollTop() {
		if(this.chatOpen){
			var msgDiv = document.getElementById("msgDiv");
			msgDiv.scrollTop = msgDiv.scrollHeight;
		}
	}
	//判断显示时间
	showTime(nS) {
		var curTimeLang = this.state.curChannel.replace(/room:/g, "");
		var curLang = curTimeLang.replace(/_/g, "-");
		var	getTime = new Date(parseInt(nS) * 1000).toLocaleString(curLang, { hour: 'numeric',minute:'numeric', hour12: true });
		if (curLang == 'en-us'){
			var getTimeStr = '';
			if (getTime.indexOf("AM") != -1 ){
				getTimeStr = getTime.replace(/AM/g, "a.m.");
			}else if(getTime.indexOf("PM") != -1){
				getTimeStr = getTime.replace(/PM/g, "p.m.");
			}
			return getTimeStr;
		}
		return getTime;
	}
	//发送消息
	sendMessage() {
		// 多个敏感词，这里直接以数组的形式展示出来
		var msg = $("#input").val(), badWords = this.badWords+'|'+this.webBadWords;
		var showContent = msg.replace(new RegExp(badWords, 'gi'), "*"),
		self = this;

		if(msg == "") {
			this.toast(Intl.lang("chat.5"), true, 2000);
		} else {
			var now = System.getServerTimeStamp();
			if (now - this.sayLastTime < this.sayIntervalSec){
				this.toast(Intl.lang("chat.4", this.sayIntervalSec), true, 2000);
				return;
			}
			if (showContent.length > this.msgMaxLen){
				this.toast(Intl.lang("chat.msg.tooLong", this.msgMaxLen), true, 2000);
				return;
			}
            this.ws.emit({
                id: System.getServerTimeStamp(),
                sub: self.state.curChannel,
                msg: showContent,
                task: "msg",
            });

			this.sayLastTime = now;
            $('#input').val('');
		}
	}
	// 获取频道列表 Channels
	getChannelsList() {
		this.ws.emit({id:System.getServerTimeStamp(), task:'sub'});
	}
	// 加入频道
	joinChannel(channel) {
		this.ws.emit({id:System.getServerTimeStamp(), sub:channel, task:'join'});
		// this.ws.emit("id=" + System.getServerTimeStamp() + "&uid=" + this.state.uid + "&sub=" + channel + "&task=join");
	}
    auth(user){
		this.ws.emit({id:System.getServerTimeStamp(), uid:user.Uid, token:user.Token, time:user.Time, task:"auth"});
	}
	// 切换频道
	changeChannel(tab) {
		var channel = this.state.channels[tab];
		Auth.savePreference(this.tabPrefKey, tab);
		// this.msgBox[tab] = [];
        this.msgBox[tab] = [];

		this.setState({
			curChannel: channel,
			tab: tab,
            msgs: this.msgBox[tab]
		});

		this.exitChannel(this.state.curChannel);
		this.joinChannel(channel);
	}
	// 退出频道
	exitChannel(channel) {
        this.ws.emit({id:System.getServerTimeStamp(), sub:channel, task:'exit'});
	}
    _onMessage(obj) {
        if(!obj.task) return;
        switch(obj.task) {
            case "sub":{
                var tab = this.state.tab, channel = obj.data.subs[tab];
                this.setState({
                    channels: obj.data.subs,
                    curChannel: channel
                });
                this.joinChannel(channel);
                break;
            }
            case "userupdate":
                if(obj.data.action == "join") {
                    var usrCount = obj.data.cnt||0;
                    this.setState({
                        usrCount
                    });
                }
                break;
            case "join":
                var chats = obj.data.chats;
                this.receiveMsgs(chats||[]);
                break;
            case "exit":
                break;
            case "error":
	            this.toast(Intl.lang("chat.code"+obj.data.code), true, 2000)
                break;
			case "auth":
				if (obj.data.result=='success'){
					var nickName = obj.data.data;
					if (!nickName){ //还没设置昵称
						this.setState({isSetNick:true});
					}else{
						this.setState({nickName});
					}
				}
				break;
            case "msg":
                if (obj.data){
                	this.receiveMsgs([obj.data])
                }
                break;
			case "setuser":
				if (obj.data.result=="success"){
                    this.setState({nickName:this.nickName, isSetNick:false});
				}
				break;
        }
	}
    receiveMsgs(list){
        list.forEach((data, i)=>{
            var msgTab = this.state.channels.indexOf(data.sub);
            var Msg = this.msgBox[msgTab];
            if(Msg.length>this.maxSize){
                Msg.shift();
            }
            Msg.push(data);
		});

        var msgs = this.msgBox[this.state.tab]||[];
        this.setState({
            msgs
        });
        this.addScrollTop();
	}
	getChannels(channels){
		var rooms = {
			"room:zh_cn"	: '中文',
			"room:en_us" : 'English',
			"room:zh_tw"	: '繁体',
			"room:service": Intl.lang("chat.service")
		};
		var channelList = [];
		if(channels){
			for(var i in channels){
				var name = channels[i];
				if(rooms[name]){
					channelList.push(rooms[name]);
				}
			}
		}
		return channelList;
	}
    onCreateNick(nick){
        var reg = new RegExp(this.badWords, 'gi');
        if (!nick.trim()){
        	this.toast(Intl.lang("chat.nick.empty"), true, 2000);
        	return;
		}
        if (reg.test(nick)){
        	this.toast(Intl.lang("chat.nick.badWord"), true, 2000);
        	return;
		}
		if (nick.length > this.nickNameLen){
        	this.toast(Intl.lang("chat.nick.tooLen", this.nickNameLen), true, 2000);
        	return;
		}

		this.nickName = nick;
		this.ws.emit({id:System.getServerTimeStamp(), nickname:nick, task:"setuser"});
	}

	chatMinOrMax(eve){
		if(this.chatMax){
			$(".chat").animate({
				width: "260px"
			}, 150);
			$(eve.target).addClass("icon-fangda");
			$(eve.target).removeClass("icon-suoxiao");
			this.chatMax = false;
		}else {
			$(".chat").animate({
				width: "50%"
			}, 150);
			$(eve.target).removeClass("icon-fangda");
			$(eve.target).addClass("icon-suoxiao");
			this.chatMax = true;
		}
	}
	addChatH() {
		if(this.chatOpen) {
		} else {
			$(".main_body").animate({
				height: "100%"
			}, 250, "swing", function() {
				$('.triangle_up').removeClass("icon-dropUp").addClass("icon-dropDown");
			});
			this.chatOpen = true;
		}
		if(this.props.isTrade) {
			this.tradeToggle();
		}
	}
	intoChat(){
		if(this.chatOpen) {
			$(".expression").fadeOut();
			$(".main_body").animate({
				height: "0px"
			}, 250, "swing", function(){
				$('.triangle_up').removeClass("icon-dropDown").addClass("icon-dropUp");
			});

			this.chatOpen = false;
		} else {
			$(".main_body").animate({
				height: "100%"
			}, 250, "swing", function(){
				$('.triangle_up').removeClass("icon-dropUp").addClass("icon-dropDown");
			});

			this.chatOpen = true;
		}
		this.tradeToggle();
	}
	tradeToggle(){
		this.setState({tdShow: this.chatOpen});
	}
	emojiToggle(){
		$(".expression").slideToggle(150);
	}

    dragStart = (e, type)=>{
    	if($('#klineMask')){
    		$('#klineMask').removeClass('hide');
    	}
        e.preventDefault();
        e.stopPropagation();
        if (!this.isDrag){
			this.dragType = type;
            this.currentY = e.screenY;
			this.currentX = e.screenX;
            this.isDrag = true;
			if(this.dragType==="Y") {
				this.contentH = $("#msgDiv").height();
				this.newContentH = this.contentH;
			}else if(this.dragType==="X") {
				this.contentW = $("#chatId").width();
				this.newContentW = this.contentW;
			}else{
				this.startX = e.clientX;
				this.lastX = this.curX;
				this.chatW = $("#chatId").width()+2;

				$("#chatId").css({transform: 'translate('+ -this.lastX +'px,0)'});
			}
            $(document).on('mouseup', this.dragEnd);
            $(document).on('mousemove', this.dragMove);
        }
	};

    dragMove = (e)=>{
        e.preventDefault();
        e.stopPropagation();
		var getDocH = $(window).height() - 105;
		var getDocW = $(window).width();
        if (this.isDrag){
			if(this.dragType==="Y"){
				var newContentH = this.contentH + this.currentY - e.screenY;
				if(newContentH>=getDocH){
					$("#msgDiv").height(getDocH);
				}else{
					$("#msgDiv").height(newContentH);
				}
				this.newContentH = newContentH;
			}else if(this.dragType==="X"){
				var newContentW = this.contentW + this.currentX - e.screenX;
				if(newContentW>=getDocW){
					$("#chatId").width(getDocW);
				}else if(newContentW<260){
					$("#chatId").width(260);
				}else{
					$("#chatId").width(newContentW);
				}

				this.newContentW = newContentW;
			}else{
				let deltaX = this.startX - e.clientX + this.lastX;
				if(deltaX<0){
					deltaX = 0;
				}else if(deltaX>(getDocW-this.chatW)){
					deltaX = getDocW-this.chatW;
				}
				if(this.curX != deltaX){
					this.curX = deltaX;
					$("#chatId").css({transform: 'translate('+ -deltaX +'px,0)'});
				}
			}
        }
    };

	dragEnd = (e)=>{
		if($('#klineMask')){
    		$('#klineMask').addClass('hide');
    	}
        e.preventDefault();
        e.stopPropagation();
        if (this.isDrag) {
            this.isDrag = false;
            $(document).off('mousemove', this.dragMove);
            $(document).off('mouseup', this.dragEnd);
        }
	};
	//适配App表情
	changeExp (msg){
		var msg = htmlEscape(msg).replace(new RegExp(this.webBadWords, 'gi'), "*");

		var regex = new RegExp('\\[[a-zA-Z0-9\\/\\u4e00-\\u9fa5]+\\]', 'g');
		var newFace = msg.match(regex);
		if(newFace && newFace.length){
			newFace.forEach((item, i)=>{
				var flag = this.AppEmoji[item];
				if(flag){
					let imgHtml = '<img src="'+process.env.PUBLIC_URL+'/images/emotions/'+flag+'.png" />';
					msg = msg.replace(item, imgHtml);
				}
			});
		}
		return msg;
	}

	render() {
		const {msgs, tab, usrCount, channels, isSetNick, nickName, tdShow, showLoad } = this.state, {isTrade} = this.props;
		const channelList = this.getChannels(channels);
		const self = this;
        const canSay = self.checkCanSay();
		let tradeIcon = false;
		if(isTrade && !tdShow){ tradeIcon = true;}
		return(
			<div className={"chat "+(tradeIcon?"tradeChat":"")} id="chatId">
				{(isTrade && !tdShow) ?
				<div className="trade_header" onClick={()=>this.intoChat()}><i className="iconfont icon-chat"></i></div>
					:
				<div id="cHeaderId" className="header">
					{tdShow && <p className="drag-y" onMouseDown={(e)=>this.dragStart(e,'Y')}><span className="iconfont icon-dragY"></span></p>}
					<nav id="chatNavId" className="fl">
						<p className="drag-x" onMouseDown={(e)=>this.dragStart(e,'X')}><span className="iconfont icon-dragX"></span></p>
						<h3 onMouseDown={(e)=>this.dragStart(e,'move')} style={{cursor:'move'}}>TDEx</h3>
					</nav>
					<nav className="fr">
						<i className="iconfont icon-fangda bigger" onClick={(e)=>this.chatMinOrMax(e)}></i>
						<i className="iconfont icon-dropUp triangle_up" onClick={()=>this.intoChat()}></i>
					</nav>
				</div>
				}
				<div className="main_body">
					<div className="nav">
						<ul>
						{channelList && channelList.map((item, i)=>{
							return <li key={i} className={tab==i?"active":null} onClick={()=>this.changeChannel(i)}><p>{item}</p></li>
						})}
						</ul>
					</div>
					<div className="users">
						{tab!=3 ? (<h6>{Intl.lang("chat.online")}<span id="online">{usrCount}</span></h6>) : (<h6><span id="online">&nbsp;</span> </h6>)}
					</div>
					<div className="message show" id="msgDiv">
						
						<ul id="msgDiv">
						{showLoad == true ? <div className="loader-box"><div className="loader loading"></div></div> : msgs && msgs.map((item, i)=>{
							var newMsg = this.changeExp(item.msg);
							var nickName = htmlEscape(item.nickname);

							var myType = item.mtype;
							if( myType == 1) {
								return <li key={i}><p><span className="show_time">[{self.showTime(item.time)}]</span><span className="name">{nickName+" : "}</span><span className="msg dis-inb" dangerouslySetInnerHTML={{__html:newMsg}}></span></p></li>
							}
							else if( myType == 2) {
								return <li className="myType2" key={i}><p><span><i className="iconfont icon-kefunv"></i></span><span className="name">{nickName+" : "}</span><span className="red3">{item.msg}</span></p></li>
							}
							else if (myType == 3) {
								return <li className="myType3"  key={i}><p><span><img src={LogoPng} /></span><span>{item.msg}</span></p></li>
							}
						})}
						</ul>
					</div>
					
					<div className="input">
						<input id="input" type="text" placeholder ={Intl.lang(!Auth.checkUserAuth() ? "chat.3" : (nickName ? "chat.10" : "chat.nick"))} disabled={!canSay ? true : false}/>
						<div className="emojy" onClick={()=>this.emojiToggle()}>😃</div>
						{/*<i className="iconfont icon-huiche icon"></i>*/}
						<div className="frequent"></div>
					</div>
					<div className="expression">
						<ul>
							<li className="active"><span>😄</span></li>
							<li><span>🐶</span></li>
							<li><span>🍑</span></li>
							<li><span>✈️</span></li>
							<li><span>🔢</span></li>
							<li><span>🕐</span></li>
							<div className="close" onClick={()=>this.emojiToggle()}>
								<i className="iconfont icon-close"></i>
							</div>
						</ul>
						<div className="emjoy show">
							<span>😄</span><span>😆</span><span>😊</span><span>😃</span><span>😏</span><span>😍</span><span>😘</span><span>😚</span><span>😳</span><span>😆</span><span>😁</span><span>😉</span><span>😜</span><span>😝</span><span>😀</span><span>😗</span><span>😟</span><span>😦</span><span>😧</span><span>😮</span><span>😬</span><span>😕</span><span>😯</span><span>😑</span><span>😒</span><span>😅</span><span>😓</span><span>😥</span><span>😩</span><span>😔</span><span>😞</span><span>😖</span><span>😨</span><span>😰</span><span>😣</span><span>😢</span><span>😭</span><span>😂</span><span>😲</span><span>😱</span><span>😫</span><span>😠</span><span>😡</span><span>😤</span><span>😪</span><span>😋</span><span>😷</span><span>😎</span><span>😵</span><span>👿</span><span>😈</span><span>😐</span><span>😶</span><span>😇</span><span>👽</span><span>💛</span><span>💙</span><span>💜</span><span>❤️</span><span>💚</span><span>💔</span><span>💓</span><span>💗</span><span>💕</span><span>💞</span><span>💘</span><span>💖</span><span>✨</span><span>⭐</span><span>🌟</span><span>💫</span><span>💥</span><span>💥</span><span>💢</span><span>❗</span><span>❓</span><span>❕</span><span>❔</span><span>💤</span><span>💨</span><span>💦</span><span>🎶</span><span>🎵</span><span>🔥</span><span>💩</span><span>👍</span><span>👎</span><span>👌</span><span>👊</span><span>✊</span><span>✌️</span><span>👋</span><span>✋</span><span>👐</span><span>☝️</span><span>👇</span><span>👈</span><span>👉</span><span>🙌</span><span>🙏</span><span>👆</span><span>👏</span><span>💪</span><span>🏃</span><span>🏃</span><span>👫</span><span>👪</span><span>👬</span><span>👭</span><span>💃</span><span>👯</span><span>🙆</span><span>🙅</span><span>💁</span><span>🙋</span><span>👰</span><span>🙎</span><span>🙍</span><span>🙇</span><span>💏</span><span>💑</span><span>💆</span><span>💇</span><span>💅</span><span>👦</span><span>👧</span><span>👩</span><span>👨</span><span>👶</span><span>👵</span><span>👴</span><span>👱</span><span>👲</span><span>👳</span><span>👷</span><span>👮</span><span>👼</span><span>👸</span><span>😺</span><span>😸</span><span>😻</span><span>😽</span><span>😼</span><span>🙀</span><span>😿</span><span>😹</span><span>😾</span><span>👹</span><span>👺</span><span>🙈</span><span>🙉</span><span>🙊</span><span>💂</span><span>💀</span><span>🐾</span><span>👄</span><span>💋</span><span>💧</span><span>👂</span><span>👀</span><span>👃</span><span>👅</span><span>💌</span><span>👤</span><span>👥</span><span>💬</span><span>💭</span>
						</div>
						<div className="emjoy">
							<span>☀️</span><span>☔</span><span>☁️</span><span>❄️</span><span>⛄</span><span>⚡</span><span>🌀</span><span>🌁</span><span>🌊</span><span>🐱</span><span>🐶</span><span>🐭</span><span>🐹</span><span>🐰</span><span>🐺</span><span>🐸</span><span>🐯</span><span>🐨</span><span>🐻</span><span>🐷</span><span>🐽</span><span>🐮</span><span>🐗</span><span>🐵</span><span>🐒</span><span>🐴</span><span>🐎</span><span>🐫</span><span>🐑</span><span>🐘</span><span>🐼</span><span>🐍</span><span>🐦</span><span>🐤</span><span>🐥</span><span>🐣</span><span>🐔</span><span>🐧</span><span>🐢</span><span>🐛</span><span>🐝</span><span>🐜</span><span>🐞</span><span>🐌</span><span>🐙</span><span>🐠</span><span>🐟</span><span>🐳</span><span>🐋</span><span>🐬</span><span>🐄</span><span>🐏</span><span>🐀</span><span>🐃</span><span>🐅</span><span>🐇</span><span>🐉</span><span>🐐</span><span>🐓</span><span>🐕</span><span>🐖</span><span>🐁</span><span>🐂</span><span>🐲</span><span>🐡</span><span>🐊</span><span>🐪</span><span>🐆</span><span>🐈</span><span>🐩</span><span>🐾</span><span>💐</span><span>🌸</span><span>🌷</span><span>🍀</span><span>🌹</span><span>🌻</span><span>🌺</span><span>🍁</span><span>🍃</span><span>🍂</span><span>🌿</span><span>🍄</span><span>🌵</span><span>🌴</span><span>🌲</span><span>🌳</span><span>🌰</span><span>🌱</span><span>🌼</span><span>🌾</span><span>🐚</span><span>🌐</span><span>🌞</span><span>🌝</span><span>🌚</span><span>🌑</span><span>🌒</span><span>🌓</span><span>🌔</span><span>🌕</span><span>🌖</span><span>🌗</span><span>🌘</span><span>🌜</span><span>🌛</span><span>🌙</span><span>🌍</span><span>🌎</span><span>🌏</span><span>🌋</span><span>🌌</span><span>⛅</span>
						</div>
						<div className="emjoy">
							<span>🎍</span><span>💝</span><span>🎎</span><span>🎒</span><span>🎓</span><span>🎏</span><span>🎆</span><span>🎇</span><span>🎐</span><span>🎑</span><span>🎃</span><span>👻</span><span>🎅</span><span>🎄</span><span>🎁</span><span>🔔</span><span>🔕</span><span>🎋</span><span>🎉</span><span>🎊</span><span>🎈</span><span>🔮</span><span>💿</span><span>📀</span><span>💾</span><span>📷</span><span>📹</span><span>🎥</span><span>💻</span><span>📺</span><span>📱</span><span>☎️</span><span>☎️</span><span>📞</span><span>📟</span><span>📠</span><span>💽</span><span>📼</span><span>🔉</span><span>🔈</span><span>🔇</span><span>📢</span><span>📣</span><span>⌛</span><span>⏳</span><span>⏰</span><span>⌚</span><span>📻</span><span>📡</span><span>➿</span><span>🔍</span><span>🔎</span><span>🔓</span><span>🔒</span><span>🔏</span><span>🔐</span><span>🔑</span><span>💡</span><span>🔦</span><span>🔆</span><span>🔅</span><span>🔌</span><span>🔋</span><span>📲</span><span>✉️</span><span>📫</span><span>📮</span><span>🛀</span><span>🛁</span><span>🚿</span><span>🚽</span><span>🔧</span><span>🔩</span><span>🔨</span><span>💺</span><span>💰</span><span>💴</span><span>💵</span><span>💷</span><span>💶</span><span>💳</span><span>💸</span><span>📧</span><span>📥</span><span>📤</span><span>✉️</span><span>📨</span><span>📯</span><span>📪</span><span>📬</span><span>📭</span><span>📦</span><span>🚪</span><span>🚬</span><span>💣</span><span>🔫</span><span>🔪</span><span>💊</span><span>💉</span><span>📄</span><span>📃</span><span>📑</span><span>📊</span><span>📈</span><span>📉</span><span>📜</span><span>📋</span><span>📆</span><span>📅</span><span>📇</span><span>📁</span><span>📂</span><span>✂️</span><span>📌</span><span>📎</span><span>✒️</span><span>✏️</span><span>📏</span><span>📐</span><span>📕</span><span>📗</span><span>📘</span><span>📙</span><span>📓</span><span>📔</span><span>📒</span><span>📚</span><span>🔖</span><span>📛</span><span>🔬</span><span>🔭</span><span>📰</span><span>🏈</span><span>🏀</span><span>⚽</span><span>⚾️</span><span>🎾</span><span>🎱</span><span>🏉</span><span>🎳</span><span>⛳</span><span>🚵</span><span>🚴</span><span>🏇</span><span>🏂</span><span>🏊</span><span>🏄</span><span>🎿</span><span>♠️</span><span>♥️</span><span>♣️</span><span>♦️</span><span>💎</span><span>💍</span><span>🏆</span><span>🎼</span><span>🎹</span><span>🎻</span><span>👾</span><span>🎮</span><span>🃏</span><span>🎴</span><span>🎲</span><span>🎯</span><span>🀄</span><span>🎬</span><span>📝</span><span>📝</span><span>📖</span><span>🎨</span><span>🎤</span><span>🎧</span><span>🎺</span><span>🎷</span><span>🎸</span><span>👞</span><span>👡</span><span>👠</span><span>💄</span><span>👢</span><span>👕</span><span>👕</span><span>👔</span><span>👚</span><span>👗</span><span>🎽</span><span>👖</span><span>👘</span><span>👙</span><span>🎀</span><span>🎩</span><span>👑</span><span>👒</span><span>👞</span><span>🌂</span><span>💼</span><span>👜</span><span>👝</span><span>👛</span><span>👓</span><span>🎣</span><span>☕</span><span>🍵</span><span>🍶</span><span>🍼</span><span>🍺</span><span>🍻</span><span>🍸</span><span>🍹</span><span>🍷</span><span>🍴</span><span>🍕</span><span>🍔</span><span>🍟</span><span>🍗</span><span>🍖</span><span>🍝</span><span>🍛</span><span>🍤</span><span>🍱</span><span>🍣</span><span>🍥</span><span>🍙</span><span>🍘</span><span>🍚</span><span>🍜</span><span>🍲</span><span>🍢</span><span>🍡</span><span>🍳</span><span>🍞</span><span>🍩</span><span>🍮</span><span>🍦</span><span>🍨</span><span>🍧</span><span>🎂</span><span>🍰</span><span>🍪</span><span>🍫</span><span>🍬</span><span>🍭</span><span>🍯</span><span>🍎</span><span>🍏</span><span>🍊</span><span>🍋</span><span>🍒</span><span>🍇</span><span>🍉</span><span>🍓</span><span>🍑</span><span>🍈</span><span>🍌</span><span>🍐</span><span>🍍</span><span>🍠</span><span>🍆</span><span>🍅</span><span>🌽</span>
						</div>
						<div className="emjoy">
							<span>🏠</span><span>🏡</span><span>🏫</span><span>🏢</span><span>🏣</span><span>🏥</span><span>🏦</span><span>🏪</span><span>🏩</span><span>🏨</span><span>💒</span><span>⛪</span><span>🏬</span><span>🏤</span><span>🌇</span><span>🌆</span><span>🏯</span><span>🏰</span><span>⛺</span><span>🏭</span><span>🗼</span><span>🗾</span><span>🗻</span><span>🌄</span><span>🌅</span><span>🌠</span><span>🗽</span><span>🌉</span><span>🎠</span><span>🌈</span><span>🎡</span><span>⛲</span><span>🎢</span><span>🚢</span><span>🚤</span><span>⛵</span><span>⛵</span><span>🚣</span><span>⚓</span><span>🚀</span><span>✈️</span><span>🚁</span><span>🚂</span><span>🚊</span><span>🚞</span><span>🚲</span><span>🚡</span><span>🚟</span><span>🚠</span><span>🚜</span><span>🚙</span><span>🚘</span><span>🚗</span><span>🚗</span><span>🚕</span><span>🚖</span><span>🚛</span><span>🚌🚍</span><span>🚨</span><span>🚓</span><span>🚔</span><span>🚒</span><span>🚑</span><span>🚐</span><span>🚚</span><span>🚋</span><span>🚉</span><span>🚆</span><span>🚅</span><span>🚄</span><span>🚈</span><span>🚝</span><span>🚃</span><span>🚎</span><span>🎫</span><span>⛽</span><span>🚦</span><span>🚥</span><span>⚠️</span><span>🚧</span><span>🔰</span><span>🏧</span><span>🎰</span><span>🚏</span><span>💈</span><span>♨️</span><span>🏁</span><span>🎌</span><span>🏮</span><span>🗿</span><span>🎪</span><span>🎭</span><span>📍</span><span>🚩</span><span>🇯</span><span>🇵</span><span>🇰</span><span>🇷</span><span>🇨</span><span>🇳</span><span>🇺</span><span>🇸</span><span>🇫</span><span>🇷</span><span>🇪</span><span>🇸</span><span>🇮</span><span>🇹</span><span>🇷</span><span>🇺</span><span>🇬</span><span>🇧</span><span>🇬</span><span>🇧</span><span>🇩</span><span>🇪</span>
						</div>
						<div className="emjoy">
							<span>🔟</span><span>🔢</span><span>🔣</span><span>◀️</span><span>⬇️</span><span>▶️</span><span>⬅️</span><span>🔠</span><span>🔡</span><span>🔤</span><span>↙️</span><span>↘️</span><span>➡️</span><span>⬆️</span><span>↖️</span><span>↗️</span><span>⏬</span><span>⏫</span><span>🔽</span><span>⤵️</span><span>⤴️</span><span>↩️</span><span>↪️</span><span>↔️</span><span>↕️</span><span>🔼</span><span>🔃</span><span>🔄</span><span>⏪</span><span>⏩</span><span>ℹ️</span><span>🆗</span><span>🔀</span><span>🔁</span><span>🔂</span><span>🆕</span><span>🔝</span><span>🆙</span><span>🆒</span><span>🆓</span><span>🆖</span> <span>🎦</span><span>🈁</span><span>📶</span><span>🈹</span><span>🈴</span><span>🈺</span><span>🈯</span><span>🈷️</span><span>🈶</span><span>🈵</span><span>🈚</span><span>🈸</span><span>🈳</span><span>🈲</span><span>🈂️</span><span>🚻</span><span>🚹</span><span>🚺</span><span>🚼</span><span>🚭</span><span>🅿️</span><span>♿</span><span>🚇</span><span>🛄</span><span>🉑</span><span>🚾🚰</span><span>🚮</span><span>㊙</span> <span>㊗</span> <span>Ⓜ️</span><span>🛂</span><span>🛅</span><span>🛃</span><span>🉐</span><span>🆑</span><span>🆘</span><span>🆔</span><span>🚫</span><span>🔞</span><span>📵</span><span>🚯</span><span>🚱</span><span>🚳</span><span>🚷</span><span>🚸</span><span>⛔</span><span>✳️</span><span>❇️</span><span>✴️</span><span>💟</span><span>🆚</span> <span>📳</span><span>📴</span><span>💹</span><span>💱</span><span>♈</span> <span>♉</span><span>♊</span><span>♋</span><span>♌</span> <span>♍</span><span>♎</span><span>♏</span><span>♐</span><span>♑</span><span>♒</span><span>♓</span><span>⛎</span><span>🔯</span><span>❎</span><span>🅰️</span><span>🅱️</span><span>🆎</span><span>🅾️</span><span>💠</span><span>♻️</span><span>🔚</span><span>🔙</span><span>🔛</span><span>🔜</span>
						</div>
						<div className="emjoy">
							<span>🕐</span><span>🕜</span><span>🕙🕥</span><span>🕚</span><span>🕦</span><span>🕛</span><span>🕧</span><span>🕑</span><span>🕝</span><span>🕒</span><span>🕞</span><span>🕓</span><span>🕟</span><span>🕔</span><span>🕠</span><span>🕕</span><span>🕡</span><span>🕖</span><span>🕢</span><span>🕗</span><span>🕣</span><span>🕘</span><span>🕤</span><span>💲</span><span>™️</span><span>❌</span><span>❗</span><span>‼️</span><span>⁉️</span><span>⭕</span><span>✖️</span><span>➕</span><span>➖</span><span>➗</span><span>💮</span><span>💯</span><span>✔️</span><span>🔘</span><span>🔗</span><span>➰</span><span>〰</span><span>〽</span><span>️🔱</span><span>▪️</span><span>▫️</span><span>◾◽</span><span>◼️</span><span>◻️</span><span>⬛</span><span>⬜</span><span>✅🔲</span><span>🔳</span><span>⚫</span><span>⚪</span><span>🔴</span><span>🔵</span><span>🔷</span><span>🔶</span><span>🔹</span><span>🔸</span><span>🔺</span><span>🔻</span>
						</div>
					</div>
				</div>
				{(isSetNick&&this.chatOpen) && <div id="nickPanel" className="nick"><NickNamePanel onSubmit={this.onCreateNick.bind(this)}/></div>}
			</div>
		)
	}
}

export default Chat;

class NickNamePanel extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {
        	nick: '',
		}
    }

    onChangeNick(e){
        e.stopPropagation();

        var value = e.target.value;
        this.setState({nick: value});
	}

    onSubmit(e){
    	e.preventDefault();
        e.stopPropagation();

        this.props.onSubmit(this.state.nick);
	}
    render(){
    	const {nick} = this.state;
    	return <div className="tc mt-20">
			<form>
            <p>{Intl.lang("chat.welcome")}</p>
            <p>{Intl.lang("chat.nick.fill")}</p>
            <div className="tc mt-10"><input type="text" value={nick} onChange={this.onChangeNick.bind(this)}/></div>
            <div className="tc mt-20"><button className="btn btn-submit wp-50" type="submit" onClick={this.onSubmit.bind(this)}>{Intl.lang("chat.enter")}</button></div>
			</form>
        </div>
	}
}