import Net from '../net/net'
import AuthModel from './auth';
import moment from 'moment';

export default {
    serverTimeData: null,
    svrTzMin: 480,

    settingResponseTime: 0,
    setting: null,
    init(callback){
        if (this.serverTimeData == null){
            var reqClientTime = new Date().getTime();

            this.localeTzMin = new Date().getTimezoneOffset()/-1; //本地时区偏差

            var self = this;
            Net.httpRequest("system/time", "",(data)=>{
                if (data.Status == 0){
                    var responseClientTime = new Date().getTime();
                    self.serverTimeData = data.Data;
                    self.serverTimeData.ClientReqTime = responseClientTime - Math.floor((responseClientTime - reqClientTime)/2);
                    //服务器时区偏差
                    self.svrTzMin = self.serverTimeData.ZoneOffset/60;
                    self.clientTzMin = self.clientTimeZoneOffset() || self.svrTzMin; //设置的时区偏差

                    if (callback) callback();
                }
            });

            Net.setSysTimeHandler(this.getServerTimeStamp.bind(this));
        }
    },
    getSetting(callback){
        var self = this;

        if (new Date().getTime() - self.settingResponseTime > 300000){
            Net.httpRequest("system/setting", "", (data)=>{
                if (data.Status==0){
                    self.settingResponseTime = new Date().getTime();
                    self.setting = data.Data;
                    if (callback) callback(data.Data);
                }
            });
        }else{
            if (callback) callback(this.setting);
        }
    },
    isInited(){
        return this.serverTimeData;
    },
    getClientTzOffset(){
        return this.clientTzMin;
    },
    //加载当前的时区小时差
    clientTimeZoneOffset(){
        return AuthModel.loadPreference("tzo");
    },
    //保存本地设置时区
    saveLocalTimeZoneOffset(offsetHour){
        AuthModel.savePreference("tzo", offsetHour);
    },
    //获取服务器时间戳(暂时用客户端时间)
    //秒
    getServerTimeStamp(isMilsec){
        if (this.serverTimeData) return Math.ceil((this.serverTimeData.Timestamp + (new Date().getTime() - this.serverTimeData.ClientReqTime))/(isMilsec?1:1000));
        else return Math.ceil(new Date().getTime() / (isMilsec?1:1000));
    },
    //服务器时间戳转前端设置时区对应的时间字符串
    ts2ClientDt(svrTimeStamp, format='YYYY-MM-DD HH:mm:ss'){
        return moment(svrTimeStamp - (this.localeTzMin - this.clientTzMin)*60000).format(format);
    },
    //服务器时间字符串转前端设置时区对应的时间字符串
    dt2Client(svrDt, format='YYYY-MM-DD HH:mm:ss'){
        return moment(moment(svrDt).valueOf() + (this.clientTzMin - this.svrTzMin)*60000).format(format);
    },
    //服务器时间戳转服务器时间
    ts2Server(svrTimeStamp, format='YYYY-MM-DD HH:mm:ss'){
        return moment(svrTimeStamp*1000 - (this.localeTzMin - this.svrTzMin)*60000).format(format);
    }
}