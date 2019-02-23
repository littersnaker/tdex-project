var $ = window.$;
export default {
    mobile: function(mobileNo){
        // var checkMobile = /^(13[0-9]{9})|(18[0-9]{9})|(14[0-9]{9})|(17[0-9]{9})|(15[0-9]{9})|(19[0-9]{9})$/;
        var checkMobile = /^(1[0-9]{10})$/;
        if (!checkMobile.test(mobileNo)){
            return false;
        }

        return true;
    },
    email: function(email){
        var newEmail = email.trim();
        var checkEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!checkEmail.test(newEmail)){
            return false;
        }

        return true;
    },
    //手机2800+7位数字
    //邮箱 .t@2800.com 结尾
    isTestEmail(email){
        if (email.indexOf('.t@2800.com')!=-1) return true;
        return false;
    },
    password: function(pass) {
        //return /^(?=.*[A-Z])(?=.*\d)(^\s+)[^]{8,24}$/.test(pass)
        return /^(?=.*[A-Z])(?=.*\d)[^\s]{8,24}$/.test(pass);
    },
    maxFloat: function(val, num){
        var pattern=new RegExp("^(-?\d+)(\.\d{1,"+num+"})?$");
        if(pattern.test(val)){
            return false;
        }
        return true;
    },
    blankChar(val){
        return val.replace(/\s+/g,"");
    }
    /*
    cnbankcard: function(cardNo, callback){
        //TODO:多语言版本需改动
        var banks = {
            "SRCB": "深圳农村商业银行",
            "BGB": "广西北部湾银行",
            "SHRCB": "上海农村商业银行",
            "BJBANK": "北京银行",
            "WHCCB": "威海市商业银行",
            "BOZK": "周口银行",
            "KORLABANK": "库尔勒市商业银行",
            "SPABANK": "平安银行",
            "SDEB": "顺德农商银行",
            "HURCB": "湖北省农村信用社",
            "WRCB": "无锡农村商业银行",
            "BOCY": "朝阳银行",
            "CZBANK": "浙商银行",
            "HDBANK": "邯郸银行",
            "BOC": "中国银行",
            "BOD": "东莞银行",
            "CCB": "中国建设银行",
            "ZYCBANK": "遵义市商业银行",
            "SXCB": "绍兴银行",
            "GZRCU": "贵州省农村信用社",
            "ZJKCCB": "张家口市商业银行",
            "BOJZ": "锦州银行",
            "BOP": "平顶山银行",
            "HKB": "汉口银行",
            "SPDB": "上海浦东发展银行",
            "NXRCU": "宁夏黄河农村商业银行",
            "NYNB": "广东南粤银行",
            "GRCB": "广州农商银行",
            "BOSZ": "苏州银行",
            "HZCB": "杭州银行",
            "HSBK": "衡水银行",
            "HBC": "湖北银行",
            "JXBANK": "嘉兴银行",
            "HRXJB": "华融湘江银行",
            "BODD": "丹东银行",
            "AYCB": "安阳银行",
            "EGBANK": "恒丰银行",
            "CDB": "国家开发银行",
            "TCRCB": "江苏太仓农村商业银行",
            "NJCB": "南京银行",
            "ZZBANK": "郑州银行",
            "DYCB": "德阳商业银行",
            "YBCCB": "宜宾市商业银行",
            "SCRCU": "四川省农村信用",
            "KLB": "昆仑银行",
            "LSBANK": "莱商银行",
            "YDRCB": "尧都农商行",
            "CCQTGB": "重庆三峡银行",
            "FDB": "富滇银行",
            "JSRCU": "江苏省农村信用联合社",
            "JNBANK": "济宁银行",
            "CMB": "招商银行",
            "JINCHB": "晋城银行JCBANK",
            "FXCB": "阜新银行",
            "WHRCB": "武汉农村商业银行",
            "HBYCBANK": "湖北银行宜昌分行",
            "TZCB": "台州银行",
            "TACCB": "泰安市商业银行",
            "XCYH": "许昌银行",
            "CEB": "中国光大银行",
            "NXBANK": "宁夏银行",
            "HSBANK": "徽商银行",
            "JJBANK": "九江银行",
            "NHQS": "农信银清算中心",
            "MTBANK": "浙江民泰商业银行",
            "LANGFB": "廊坊银行",
            "ASCB": "鞍山银行",
            "KSRB": "昆山农村商业银行",
            "YXCCB": "玉溪市商业银行",
            "DLB": "大连银行",
            "DRCBCL": "东莞农村商业银行",
            "GCB": "广州银行",
            "NBBANK": "宁波银行",
            "BOYK": "营口银行",
            "SXRCCU": "陕西信合",
            "GLBANK": "桂林银行",
            "BOQH": "青海银行",
            "CDRCB": "成都农商银行",
            "QDCCB": "青岛银行",
            "HKBEA": "东亚银行",
            "HBHSBANK": "湖北银行黄石分行",
            "WZCB": "温州银行",
            "TRCB": "天津农商银行",
            "QLBANK": "齐鲁银行",
            "GDRCC": "广东省农村信用社联合社",
            "ZJTLCB": "浙江泰隆商业银行",
            "GZB": "赣州银行",
            "GYCB": "贵阳市商业银行",
            "CQBANK": "重庆银行",
            "DAQINGB": "龙江银行",
            "CGNB": "南充市商业银行",
            "SCCB": "三门峡银行",
            "CSRCB": "常熟农村商业银行",
            "SHBANK": "上海银行",
            "JLBANK": "吉林银行",
            "CZRCB": "常州农村信用联社",
            "BANKWF": "潍坊银行",
            "ZRCBANK": "张家港农村商业银行",
            "FJHXBC": "福建海峡银行",
            "ZJNX": "浙江省农村信用社联合社",
            "LZYH": "兰州银行",
            "JSB": "晋商银行",
            "BOHAIB": "渤海银行",
            "CZCB": "浙江稠州商业银行",
            "YQCCB": "阳泉银行",
            "SJBANK": "盛京银行",
            "XABANK": "西安银行",
            "BSB": "包商银行",
            "JSBANK": "江苏银行",
            "FSCB": "抚顺银行",
            "HNRCU": "河南省农村信用",
            "COMM": "交通银行",
            "XTB": "邢台银行",
            "CITIC": "中信银行",
            "HXBANK": "华夏银行",
            "HNRCC": "湖南省农村信用社",
            "DYCCB": "东营市商业银行",
            "ORBANK": "鄂尔多斯银行",
            "BJRCB": "北京农村商业银行",
            "XYBANK": "信阳银行",
            "ZGCCB": "自贡市商业银行",
            "CDCB": "成都银行",
            "HANABANK": "韩亚银行",
            "CMBC": "中国民生银行",
            "LYBANK": "洛阳银行",
            "GDB": "广东发展银行",
            "ZBCB": "齐商银行",
            "CBKF": "开封市商业银行",
            "H3CB": "内蒙古银行",
            "CIB": "兴业银行",
            "CRCBANK": "重庆农村商业银行",
            "SZSBK": "石嘴山银行",
            "DZBANK": "德州银行",
            "SRBANK": "上饶银行",
            "LSCCB": "乐山市商业银行",
            "JXRCU": "江西省农村信用",
            "ICBC": "中国工商银行",
            "JZBANK": "晋中市商业银行",
            "HZCCB": "湖州市商业银行",
            "NHB": "南海农村信用联社",
            "XXBANK": "新乡银行",
            "JRCB": "江苏江阴农村商业银行",
            "YNRCC": "云南省农村信用社",
            "ABC": "中国农业银行",
            "GXRCU": "广西省农村信用",
            "PSBC": "中国邮政储蓄银行",
            "BZMD": "驻马店银行",
            "ARCU": "安徽省农村信用社",
            "GSRCU": "甘肃省农村信用",
            "LYCB": "辽阳市商业银行",
            "JLRCU": "吉林农信",
            "URMQCCB": "乌鲁木齐市商业银行",
            "XLBANK": "中山小榄村镇银行",
            "CSCB": "长沙银行",
            "JHBANK": "金华银行",
            "BHB": "河北银行",
            "NBYZ": "鄞州银行",
            "LSBC": "临商银行",
            "BOCD": "承德银行",
            "SDRCU": "山东农信",
            "NCB": "南昌银行",
            "TCCB": "天津银行",
            "WJRCB": "吴江农商银行",
            "CBBQS": "城市商业银行资金清算中心",
            "HBRCU": "河北省农村信用社"
        };
        $.ajax({
            url: "https://ccdcapi.alipay.com/validateAndCacheCardInfo.json",
            dataType: "jsonp",
            jsonp: "_callback",
            timeout: 20000,
            data: '_input_charset=utf-8&cardNo=' + $.trim(cardNo) + '&cardBinCheck=true',
            success: function (data) {
                if (data.stat == "ok" && data.validated) {
                    data.bankName = banks[data.bank];
                }
                if (callback) callback(data);
            }
        });
    },
    getBankInfo: function(id){
        return this.netBankMap(0)[id];
    },
    netBankMap:function(type){
        var map ={
            "0":{
                "中国建设银行": "0 0",
                "中国农业银行": "0 -37px",
                "中国工商银行": "0 -74px",
                "招商银行": "0 -109px",
                "兴业银行": "0 -141px",
                "中信银行": "0 -182px",
                "民生银行": "0 -219px",            // 新旧银行列表key 名称不相同，导致找不到
                "中国民生银行": "0 -219px",
                "中国光大银行": "0 -254px",
                "光大银行": "0 -254px",
                "华夏银行": "0 -292px",
                "深圳发展银行": "0 -367px",
                "中国银行": "0 -406px",
                "中国邮政储蓄银行": "0 -495px",
                "浦发银行": "0 -532px",
                "上海浦东发展": "0 -532px",
                "浦东发展银行": "0 -532px",
                "广东发展银行": "0 -614px",
                "北京银行": "0 -454px",
                "南京银行": "0 -655px",
                "交通银行": "0 -695px",
                "平安银行": "0 -734px",
                "杭州银行": "0 -784px",
                "宁波银行": "0 -824px",
                "上海银行": "0 -910px"
            },
            "1":{
                "中国银行": 963,
                "招商银行": 970,
                //"兴业银行": 972,
                "民生银行": 980,
                "光大银行": 986,
                "中信银行": 962,
                "交通银行": 981,
                //"华夏银行": 982,
                // "宁波银行": 900,
                // "平安银行": 978,
                //"上海银行": 975,
                //"南京银行": 979,
                // "渤海银行": 988,
                // "东亚银行": 987,
                //"北京银行": 989,
                "中国工商银行": 967,
                "浦东发展银行":977,
                "中国农业银行": 964,
                "中国建设银行": 965,
                "广东发展银行": 985,
                //"深圳发展银行": 974,
                // "浙江稠州商业银行": 969,
                // "北京农村商业银行": 990,
                "中国邮政储蓄银行": 971
            }
        };
        return map[type];
    }
    */
}