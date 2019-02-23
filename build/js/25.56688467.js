webpackJsonp([25],{120:function(e,a,t){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),function(e){function n(e,a){if(!(e instanceof a))throw new TypeError("Cannot call a class as a function")}function l(e,a){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!a||"object"!==typeof a&&"function"!==typeof a?e:a}function s(e,a){if("function"!==typeof a&&null!==a)throw new TypeError("Super expression must either be null or a function, not "+typeof a);e.prototype=Object.create(a&&a.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),a&&(Object.setPrototypeOf?Object.setPrototypeOf(e,a):e.__proto__=a)}var c=t(0),i=t.n(c),r=t(24),m=t(7),o=t(2),u=t(9),p=t(235),h=(t(26),t(5),t(79),t(132)),E=t(144),d=(t(20),function(){function e(e,a){for(var t=0;t<a.length;t++){var n=a[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(a,t,n){return t&&e(a.prototype,t),n&&e(a,n),a}}()),f=e,v=function(e){function a(e){n(this,a);var t=l(this,(a.__proto__||Object.getPrototypeOf(a)).call(this,e));return t.state={mobileCodeSec:0,hadJoin:!1,hadSend:!1,verify:!1,errData:["","","","",""],phoneData:{}},t}return s(a,e),d(a,[{key:"componentWillMount",value:function(){this.getQuestion()}},{key:"componentDidMount",value:function(){}},{key:"loadTelPhone",value:function(){var e=this,a=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,t={},n=function(){t[1]&&t[2]&&(f("#newPhone").intlTelInput("destroy"),f("#newPhone").intlTelInput({autoPlaceholder:!1,preferredCountries:["cn","us"]}),f("#newPhone").intlTelInput("setCountry","cn"),e.phone=f("#newPhone"),e.setState({loadedLib:!0}))};p.a.js("lib/telphone/intlTelInput.min.js",function(){t[1]=!0,n()},function(){a<5&&e.loadTelPhone(++a)}),p.a.js("lib/telphone/utils.js",function(){t[2]=!0,n()},function(){a<5&&e.loadTelPhone(++a)})}},{key:"getQuestion",value:function(e){var a=this,t="post",n=e||!1;e&&(t="put"),u.a.httpRequest("user/quest",n,function(t){if(0==t.Status){var n=t.Data;n||a.loadTelPhone(),e?a.setState({hadSend:n,verify:!1}):a.setState({hadJoin:n})}},this,t)}},{key:"getPhoneNumber",value:function(){if(this.state.loadedLib){var e=this.phone.intlTelInput("getSelectedCountryData"),a=parseInt(e.dialCode),t=this.phone.intlTelInput("getNumber"),n=t.replace("+"+a,"");return{Area:Number(a),Mobile:n}}}},{key:"selectCheckBox",value:function(e){for(var a=[],t=document.getElementsByName(e),n=0;n<t.length;n++)t[n].checked&&("other"==t[n].value?a.push(this.refs[e].value):a.push(t[n].value));return a.join(",")}},{key:"getParams",value:function(){var e=this.getPhoneNumber();e.Name=this.refs.userName.value,e.Wechat=this.refs.userWX.value,e.ETH=Number(this.refs.userETH.value),e.TD=Number(this.refs.userTD.value),e.QQ=this.refs.userQQ.value,e.Facebook=this.refs.userFB.value,e.Telegram=this.refs.userTG.value;var a=this.selectCheckBox("likeJoin");return""!=a&&(e.JoinTest="1"==a),e.Exchanges=this.selectCheckBox("clients"),e.TradeYears=this.selectCheckBox("experience"),e.Media=this.selectCheckBox("information"),e.Idea=this.refs.suggest.value,e.Suggest=this.refs.improve.value,e.Code=this.refs.mobileCode.value+"",e}},{key:"resetErrData",value:function(){var e=["","","","",""];this.setState({errData:e})}},{key:"checkMobile",value:function(){var e=this.state.errData,a=this.getPhoneNumber(),t=this.matchMobile(a);a&&a.Mobile?e[1]=t?"":2:e[1]=1,this.setState({errData:e})}},{key:"matchMobile",value:function(e){return"886"===e.Mobile.substr(0,3)||("86"==e.Area?h.a.mobile(e.Mobile):this.phone.intlTelInput("isValidNumber"))}},{key:"handleSubmit",value:function(e){e.stopPropagation(),e.preventDefault(),this.resetErrData();var a=!1,t={},n=this.getPhoneNumber(),l=this.refs.userName.value,s=this.refs.userWX.value,c=this.refs.userETH.value,i=this.refs.userTD.value;if(l?t[0]="":(a=!0,t[0]=1),n&&n.Mobile?t[1]="":(a=!0,t[1]=1),s?t[2]="":(a=!0,t[2]=1),""===c?(a=!0,t[3]=1):isNaN(Number(c))?(a=!0,t[3]=2):t[3]="",""===i?(a=!0,t[4]=1):isNaN(Number(i))?(a=!0,t[4]=2):t[4]="",this.matchMobile(n)||(a=!0,t[1]=2),a)return this.setState({errData:t}),!1;this.setState({verify:!0,phoneData:n}),this.sendVerifyCode()}},{key:"sendVerifyCode",value:function(e){e&&e.preventDefault();var a=this,t=this.getPhoneNumber();t.For="quest",u.a.httpRequest("verify/mobile",t,function(e){if(0==e.Status){var t=e.Data.Code;t&&(isNaN(t)||(a.refs.mobileCode.value=t)),a.setState({mobileCodeSec:120})}},this)}},{key:"sendQuestionResult",value:function(e){e.stopPropagation(),e.preventDefault();var a=this.getParams();this.getQuestion(a)}},{key:"onFocus",value:function(e){var a=this.state.errData;a[e]&&(a[e]="",this.setState({errData:a}))}},{key:"close",value:function(){this.setState({verify:!1})}},{key:"turnToMain",value:function(){m.a.replace("/")}},{key:"render",value:function(){var e=this,a=this.state,t=a.hadJoin,n=a.hadSend,l=a.errData,s=a.verify,c=a.phoneData,r=a.mobileCodeSec,m=o.a.getLang();return i.a.createElement("div",{className:"okk-trade-contain"},!t&&!n&&i.a.createElement("div",{className:"question-bg tc"},i.a.createElement("div",{className:"question-title"},i.a.createElement("div",{className:"quest-title-"+m}))),i.a.createElement("div",{className:"contain pdt-1 question-contain media-contain"+(t||n?"":" quest-pos")},t?i.a.createElement("div",{className:"question-succ pd-10 tc"},i.a.createElement("div",{className:"succ-icon mt-80"},i.a.createElement("i",{className:"questionIcon"})),i.a.createElement("p",{className:"mt-30 fs26"},o.a.lang("questionnaire.item.24")),i.a.createElement("div",{className:"mt-50 tc"},i.a.createElement("button",{className:"btn question-btn fem125",onClick:this.turnToMain.bind(this)},o.a.lang("questionnaire.item.25")))):n?i.a.createElement("div",{className:"question-succ pd-10 tc"},i.a.createElement("div",{className:"succ-icon mt-80"},i.a.createElement("i",{className:"iconfont icon-success"})," "),i.a.createElement("p",{className:"mt-30 fs26"},o.a.lang("questionnaire.item.22")),i.a.createElement("p",{className:"mt-20 fs16"},o.a.lang("questionnaire.item.23")),i.a.createElement("div",{className:"mt-50 tc"},i.a.createElement("button",{className:"btn question-btn fem125",onClick:this.turnToMain.bind(this)},o.a.lang("TRANSFER.STATUS.1")))):i.a.createElement("form",{className:"question-all-box",onSubmit:function(a){e.handleSubmit(a)},autoComplete:"off"},i.a.createElement("div",{className:"question-cross l"}),i.a.createElement("div",{className:"question-cross r"}),i.a.createElement("div",{className:"question-desc"},o.a.lang("questionnaire.desc")),i.a.createElement("div",{className:"question-box mt-25"},i.a.createElement("div",{className:"pos-r"},i.a.createElement("h5",null,i.a.createElement("i",{className:"red1 pdr-5"},"*"),o.a.lang("questionnaire.item.1")),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30 "+(l[0]?"bd-err":"")},i.a.createElement("input",{className:"fem",type:"text",ref:"userName",onFocus:function(){return e.onFocus(0)},placeholder:o.a.lang("questionnaire.item.2")})),l[0]&&i.a.createElement("span",{className:"pos-a fem75 red1 pdl-10"},o.a.lang("form.error.empty"))),i.a.createElement("div",{className:"pos-r"},i.a.createElement("h5",null,i.a.createElement("i",{className:"red1 pdr-5"},"*"),o.a.lang("Personal.101")),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30 "+(l[1]?"bd-err":"")},i.a.createElement("input",{className:"fem",type:"text",id:"newPhone",ref:"newPhone",onFocus:function(){return e.onFocus(1)},onBlur:function(){return e.checkMobile()},placeholder:o.a.lang("accountSafe.2_149")})),l[1]&&i.a.createElement("span",{className:"pos-a fem75 red1 pdl-10"},2==l[1]?o.a.lang("Login.109"):o.a.lang("form.error.empty"))),i.a.createElement("div",{className:"question-flex"},i.a.createElement("div",{className:"pos-r"},i.a.createElement("h5",null,i.a.createElement("i",{className:"red1 pdr-5"},"*"),o.a.lang("questionnaire.item.3")),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30 "+(l[2]?"bd-err":"")},i.a.createElement("input",{className:"fem",type:"text",ref:"userWX",onFocus:function(){return e.onFocus(2)},placeholder:o.a.lang("questionnaire.item.4")})),l[2]&&i.a.createElement("span",{className:"pos-a fem75 red1 pdl-10"},o.a.lang("form.error.empty"))),i.a.createElement("div",null,i.a.createElement("h5",null,"QQ"),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30"},i.a.createElement("input",{className:"fem",type:"text",ref:"userQQ",placeholder:o.a.lang("questionnaire.item.5")})))),i.a.createElement("div",{className:"question-flex"},i.a.createElement("div",null,i.a.createElement("h5",null,"Facebook"),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30"},i.a.createElement("input",{className:"fem",type:"text",ref:"userFB",placeholder:o.a.lang("questionnaire.item.6","Facebook")}))),i.a.createElement("div",null,i.a.createElement("h5",null,"Telegram"),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30"},i.a.createElement("input",{className:"fem",type:"text",ref:"userTG",placeholder:o.a.lang("questionnaire.item.6","Telegram")})))),i.a.createElement("div",{className:"question-flex"},i.a.createElement("div",{className:"pos-r"},i.a.createElement("h5",null,i.a.createElement("i",{className:"red1 pdr-5"},"*"),o.a.lang("questionnaire.item.10")),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30 "+(l[3]?"bd-err":"")},i.a.createElement("input",{className:"fem",type:"text",ref:"userETH",onFocus:function(){return e.onFocus(3)},placeholder:o.a.lang("questionnaire.item.7","ETH")})),l[3]&&i.a.createElement("span",{className:"pos-a fem75 red1 pdl-10"},2==l[3]?o.a.lang("Withdrawals.correct_input"):o.a.lang("form.error.empty"))),i.a.createElement("div",{className:"pos-r"},i.a.createElement("h5",null,i.a.createElement("i",{className:"red1 pdr-5"},"*"),o.a.lang("questionnaire.item.11")),i.a.createElement("div",{className:"input-normal m-wp-100 w320-h30 "+(l[4]?"bd-err":"")},i.a.createElement("input",{className:"fem",type:"text",ref:"userTD",onFocus:function(){return e.onFocus(4)},placeholder:o.a.lang("questionnaire.item.7","TD")})),l[4]&&i.a.createElement("span",{className:"pos-a fem75 red1 pdl-10"},2==l[4]?o.a.lang("Withdrawals.correct_input"):o.a.lang("form.error.empty")))),i.a.createElement("h5",null,o.a.lang("questionnaire.item.12")),i.a.createElement("div",{className:"lh-32"},i.a.createElement("label",{className:"custom-label w-140"},i.a.createElement("input",{className:"custom-radio",type:"radio",name:"likeJoin",value:"1"}),i.a.createElement("span",{className:"custom-radioInput"}),i.a.createElement("span",null,o.a.lang("questionnaire.item.18")[0])),i.a.createElement("label",{className:"custom-label w-140"},i.a.createElement("input",{className:"custom-radio",type:"radio",name:"likeJoin",value:"0"}),i.a.createElement("span",{className:"custom-radioInput"}),i.a.createElement("span",null,o.a.lang("questionnaire.item.18")[1]))),i.a.createElement("h5",null,o.a.lang("questionnaire.item.14")),i.a.createElement("div",{className:"lh-32"},i.a.createElement("label",{className:"custom-label w-140"},i.a.createElement("input",{className:"custom-radio",type:"radio",name:"experience",value:"0-1"}),i.a.createElement("span",{className:"custom-radioInput"}),i.a.createElement("span",null,o.a.lang("questionnaire.item.20")[0])),i.a.createElement("label",{className:"custom-label w-140"},i.a.createElement("input",{className:"custom-radio",type:"radio",name:"experience",value:"1-3"}),i.a.createElement("span",{className:"custom-radioInput"}),i.a.createElement("span",null,o.a.lang("questionnaire.item.20")[1])),i.a.createElement("label",{className:"custom-label w-140"},i.a.createElement("input",{className:"custom-radio",type:"radio",name:"experience",value:"3-5"}),i.a.createElement("span",{className:"custom-radioInput"}),i.a.createElement("span",null,o.a.lang("questionnaire.item.20")[2])),i.a.createElement("label",{className:"custom-label w-140"},i.a.createElement("input",{className:"custom-radio",type:"radio",name:"experience",value:"5-"}),i.a.createElement("span",{className:"custom-radioInput"}),i.a.createElement("span",null,o.a.lang("questionnaire.item.20")[3]))),i.a.createElement("h5",null,o.a.lang("questionnaire.item.13")),i.a.createElement("div",{className:"question-flex lh-32"},i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"clients",className:"input_check",value:o.a.lang("questionnaire.item.19")[0]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.19")[0])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"clients",className:"input_check",value:o.a.lang("questionnaire.item.19")[1]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.19")[1])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"clients",className:"input_check",value:o.a.lang("questionnaire.item.19")[2]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.19")[2])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"clients",className:"input_check",value:o.a.lang("questionnaire.item.19")[3]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.19")[3])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"clients",className:"input_check",value:o.a.lang("questionnaire.item.19")[4]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.19")[4])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"clients",className:"input_check",value:"other"}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.8")),i.a.createElement("input",{className:"checkbox-subTxt",ref:"clients"}))),i.a.createElement("h5",null,o.a.lang("questionnaire.item.15")),i.a.createElement("div",{className:"question-flex lh-32"},i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"information",className:"input_check",value:o.a.lang("questionnaire.item.21")[0]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.21")[0])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"information",className:"input_check",value:o.a.lang("questionnaire.item.21")[1]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.21")[1])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"information",className:"input_check",value:o.a.lang("questionnaire.item.21")[2]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.21")[2])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"information",className:"input_check",value:o.a.lang("questionnaire.item.21")[3]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.21")[3])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"information",className:"input_check",value:o.a.lang("questionnaire.item.21")[4]}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.21")[4])),i.a.createElement("label",{className:"custom-checkbox"},i.a.createElement("div",null,i.a.createElement("input",{type:"checkbox",name:"information",className:"input_check",value:"other"}),i.a.createElement("i",null)),i.a.createElement("span",null,o.a.lang("questionnaire.item.8")),i.a.createElement("input",{className:"checkbox-subTxt",ref:"information"}))),i.a.createElement("h5",null,o.a.lang("questionnaire.item.16")),i.a.createElement("textarea",{name:"suggest",ref:"suggest",className:"input-normal",maxLength:"1000"}),i.a.createElement("h5",null,o.a.lang("questionnaire.item.17")),i.a.createElement("textarea",{name:"improve",ref:"improve",className:"input-normal",maxLength:"1000"}),i.a.createElement("div",{className:"mt-50 tc"},i.a.createElement("button",{className:"btn question-btn fem125"},o.a.lang("common.submit")))),i.a.createElement("div",null,i.a.createElement("p",{className:"fs16 lh-40"},o.a.lang("Recharge.tips")),i.a.createElement("p",null,o.a.lang("questionnaire.item.9"))))),s&&i.a.createElement("div",{className:"mask home-popinner"},i.a.createElement("form",{className:"regist-box question-pos",onSubmit:function(a){e.sendQuestionResult(a)}},i.a.createElement("div",{className:"dialog-close t0 pd-10 point",onClick:this.close.bind(this)},i.a.createElement("i",{className:"iconfont icon-close transit"})),i.a.createElement("div",{className:"tc fem-175 login-title"},i.a.createElement("span",{className:"pdl-10"},o.a.lang("login.mobile_verify"))),i.a.createElement("div",null,i.a.createElement("div",{className:"login-txt lh-32 tc h-50"},o.a.lang("questionnaire.item.26"),i.a.createElement("span",{className:"tb gray fem125"},c.Mobile)),i.a.createElement("div",{className:"tc"},i.a.createElement("input",{type:"tel",className:"w-160",name:"vaildCode",ref:"mobileCode",placeholder:o.a.lang("accountSafe.2_124"),maxLength:"6"}),i.a.createElement(E.a,{className:"reg-btn lh-40 c-8",onClick:function(a){return e.sendVerifyCode(a)},count:r}))),i.a.createElement("div",{className:"tc mt-10 pdb-30 mt-20"},i.a.createElement("button",{type:"submit",className:"btn btn-gold w300-h40 m-w248-h40 fem125 bdRadius-0"},o.a.lang("common.confirm"))))))}}]),a}(r.a);a.default=v}.call(a,t(13))}});