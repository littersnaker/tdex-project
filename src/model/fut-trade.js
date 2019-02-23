//期货交易相关
//code与产品1:n关系(同一code，可能多个账号类型，每个账户类型，一个产品)
import history from '../core/history';
import Intl from '../intl';
import Decimal from '../utils/decimal';
import Event from '../core/event';
import {PRODUCT_LIST_URL, IS_TRADE_V2} from '../config';

import WsMgr from '../net/WsMgr';
import Net from '../net/net';
import {getCurrencySymbol} from "../utils/common"
import {CONST} from "../public/const"
import SysTime from "./system";
import Product,{FutProduct} from "./product"
import AuthModel from './auth';
import moment from 'moment';
import {setStorage, getStorage} from '../utils/util';
import Notification from '../utils/notification';

// // 指令
// enum Action{
//     // 止盈
//     TP = 0;
//     // 止损
//     SL = 1;
//     // 平仓
//     CLOSE = 2;
//     // 开仓
//     OPEN = 3;
//     // 清算(爆仓处理)
//     CLEAR = 4;
// }
// // 订单状态
// enum State{
//     // 已创建
//     CREATED = 0;
//     // 等待触发
//     WAITING = 1;
//     // 已触发
//     TRIGGERRED = 2;
//     // 执行中
//     EXECUTING = 3;
//     // 已撤销
//     CANCELED = 4;
//     // 已完成
//     FILLED = 5;
// }

export default {
    isInited: false,
    isInitedListener: false,
    appModel: null,
    _mgr: null,

    skinMore: ['primary', 'white', 'gray'], //交易界面样式主题

    defaultPrices: {"ASK":0,"BID":0,"CLOSE":0,"HIGH":0,"LAST":0,"LOW":0,"OPEN":0,"VOL":0,"LastModify":0,"MEAN":0,"LAST_CHANGED": 0,
        "MID":0, "LMT":0, "MARK":0, "INDEX":0, "ASK_M":0, "BID_M":0, "AVOL_M":0,"BVOL_M":0, "FUND_RATE":0, "IND_FUND_RATE":0, "FUND_TS":0, "OPEN_INTEREST":0, "VOL_24h":0, "VOL_MAX":0,
        "ASK1":0,"ASK2":0,"ASK3":0,"ASK4":0,"ASK5":0,"ASK6":0,"ASK7":0,"ASK8":0,"ASK9":0,"ASK10":0,"ASK11":0,"ASK12":0,"ASK13":0,"ASK14":0,"ASK15":0,"ASK16":0,"ASK17":0,"ASK18":0,"ASK19":0,"ASK20":0,
        "AVOL1":0,"AVOL2":0,"AVOL3":0,"AVOL4":0,"AVOL5":0,"AVOL6":0,"AVOL7":0,"AVOL8":0,"AVOL9":0,"AVOL10":0,"AVOL11":0,"AVOL12":0,"AVOL13":0,"AVOL14":0,"AVOL15":0,"AVOL16":0,"AVOL17":0,"AVOL18":0,"AVOL19":0,"AVOL20":0,
        "BID1":0,"BID2":0,"BID3":0,"BID4":0,"BID5":0,"BID6":0,"BID7":0,"BID8":0,"BID9":0,"BID10":0,"BID11":0,"BID12":0,"BID13":0,"BID14":0,"BID15":0,"BID16":0,"BID17":0,"BID18":0,"BID19":0,"BID20":0,
        "BVOL1":0,"BVOL2":0,"BVOL3":0,"BVOL4":0,"BVOL5":0,"BVOL6":0,"BVOL7":0,"BVOL8":0,"BVOL9":0,"BVOL10":0,"BVOL11":0,"BVOL12":0,"BVOL13":0,"BVOL14":0,"BVOL15":0,"BVOL16":0,"BVOL17":0,"BVOL18":0,"BVOL19":0,"BVOL20":0},

    typeList:[], //期货类型
    // _clientProduct:null,

    tradeMap:{},
    currCode: null,
    exchangeRateMap:{}, //btc2cny eth2cny
    // forwardMap:{},

    productIdMap:{}, //所有产品 1:1 <k, v>=> <productID, product>
    codeList: [], //按顺序保存code
    productMap:{}, //所有产品 code与产品1:n关系(同一code，可能多个账号类型，每个账户类型，一个产品) <k, v>=><code, list<product>>
    dblMonthCountMap: {},     //多月合约，同一code，不同月份的list
    productList:[],
    _priceMap:{},

    depthMap: {},
    currDepth: 0,

    reqProductListLastTime: 0,

    rangePricePoint: 100, //止盈止损 触发价 滑点
    rangeTriggerPricePoint:200,  //触发价滑点
    rangeDelegatePricePoint:20, //委托价滑点

    _maxVolProg: 100000, //挂单量进度条 最大值

    leverOptions: [1,2,3,5,10,15,20], //表单中的杠杆选项
    isSharedMax: true, //全仓模式必须用20倍最大杠杆 开关

    rankInPosition: {}, //不同合约在自动减仓队列中的位置

    //各产品的补充属性，小数位
    supplyAttrs: {
        "BTCUSD":{
            "AvgPriceFixed": 2, //开仓均价保留两位小数
            "ScaleFixed":2, //杠杆位数
            "ShowFixed": 4, //显示4位
            "CalcFixed": 8, //计算8位
            "LeverMin": "0.01", //最低杠杆
            "LeverMax": "20",   //最高杠杆
        }
    },
    priceMax: 1000000,
    volumeMax:1000000, //下单最大量
    defaultSetting: {
        isExpert: false, //是否专家模式
        isOneKeyTrade: false, //一键成交
        sellMDepth: 1,    //卖出价 合并深度
        buyMDepth:1,
        depthColumn:2,
        colorTheme: 1,
        sizeTheme: 1,
        quickMktLmt: 0, //快捷开仓 市价还是限价
        postOnlyExecInst: false, //限价下单时，被动委托
        expireParam: 0, //限价下单时，过期时间
        depthCount: 5, //深度数据显示数量
        tradeCount:5, //成交数据显示数量
        showBg: true,  //显示背景数量条
        showVolSum: false //数量切换累积量
    },
    formVar: {
        leverPreKey: "lever",
        volumePreKey: "vol",
        leverOptions: [0.01,1,2,3,5,10,15,20],
        volOptions: [0.2, 0.4, 0.6, 0.8, 1],
    },
    setting: null,
    baseOrders:[], //接口返回的原订单数据
    basePositions:[], //接口返回的原仓位数据

    msgs: [], //通知的信息提示
    msgsTotal:0,
    msgMaxCount: 800,
    msgId:0, //讯息id

    orders: {},
    orderList:[],
    positions: {},
    positionList:[],
    posSummaryList:[], //仓位概要
    tdoTimer:0,
    tdpTimer:0,
    VariableTxtMap:{
        0: 'LAST',
        1: 'MARK',
        2: 'BID',
        3: 'ASK'
    },
    orderMarginTotal:{}, //订单的保证金总额 按cid分
    plTotal:{}, //按cid分的盈亏
    schemeSetting:{}, //Shared true:全仓; false:逐仓; Merge true: 自动合仓; false: 独立仓位

    //contract data的key映射
    contractKeyMap: {
        MarkPrice: 'MARK', //标记价格
        IndicativeSettlePrice: 'INDEX', //指数价格
        FundingRate: 'FUND_RATE',
        IndicativeFundingRate: 'IND_FUND_RATE', //预测费率
        FundingTimestamp: 'FUND_TS',
        OpenInterest: 'OPEN_INTEREST', //未平仓交易量
        Turnover24h: 'VOL_24h', //24小时交易量
    },
    testNoPrice: false,  //测试没有报价时是否出错

    //公式
    formula: {
        //合约价值(委托价值)  标记价格
        contractValue(con, mark_price){
            // var usdVal = 1;//合约美元价值
            if (mark_price && Number(mark_price)>0) return String(Decimal.accDiv(con, mark_price));
            return 0;
        },
        //委托价值
        delegateValue(con, mark_price, volume, scale){
            return Decimal.accMul(this.contractValue(con, mark_price), volume, scale) ;
        },
        //维持保证金费率
        getKeepDepositRate(posTotalVolume, risks){
            var prevKey = 0;
            for (var key in risks){
                if (prevKey && Number(posTotalVolume)>=Number(prevKey) && Number(posTotalVolume)<Number(key)){
                    return risks[prevKey];
                }
                prevKey = key;
            }
            if (Number(posTotalVolume)>=Number(prevKey)) return risks[prevKey];
        },
        //维持保证金
        //risks对应产品表risks
        getKeepDeposit(con, avgPrice, volume, posTotalVolume, risks){
            var rate = this.getKeepDepositRate(posTotalVolume, risks);
            return this.getKeepDepositByRate(con, avgPrice, volume, rate);
        },
        getKeepDepositByRate(con, avgPrice, volume, rate){
            var dv = Number(this.delegateValue(con, avgPrice, volume));
            return Decimal.accMul(dv, rate);
        },
        //减少保证金

        //保证金比例换算杠杆
        depositRateToLever(depositRate){
            if (depositRate && Number(depositRate)>0) return String(Decimal.accDiv(1, depositRate));
            return 0;
        },
        //杠杆换算保证金比例
        leverToDepositRate(lever){
            if (lever && Number(lever)>0){
                return String(Decimal.accDiv(1, lever));
            }
            return 0;
        },
        //保证金=合约规模1 * 数量 * 保证金比例 / 均价
        deposit(con, volume, depositRate, avgPrice, scale){
            if (avgPrice && Number(avgPrice)>0){
                return String(Decimal.accDiv(Decimal.accMul(Number(con)*Number(volume), depositRate), avgPrice, scale));
            }
            return 0;
        },
        //保证金=合约规模1 * 数量 /（ 均价 * 杠杆倍数）
        leverDeposit(con, volume, lever, avgPrice, scale){
            if (avgPrice && Number(avgPrice)>0){
                return String(Decimal.accDiv(Number(con)*Number(volume), Decimal.accMul(avgPrice, lever), scale));
            }
            return 0;
        },
        //保证金换算杠杆
        depositToLever(deposit, con, volume, avgPrice, scale=2){
            if (deposit && avgPrice && Number(deposit)>0 && Number(avgPrice)>0) return String(Decimal.accDiv(Number(con)*Number(volume), Decimal.accMul(deposit, avgPrice), scale));
            return 0;
        },
        //保证金换算保证金比例
        depositToDepositRate(deposit, con, volume, avgPrice, scale){
            if (deposit && avgPrice && Number(deposit)>0 && Number(avgPrice)>0) return String(Decimal.accDiv(Decimal.accMul(deposit, avgPrice), Number(con)*Number(volume), scale));
            return 0;
        },
        //1张订单的费用（保证金+补足+takderFee）
        unitOrderFee(isLmt, side, con, lever, priceInfo, delegatePrice, takerFeeRate, isAdd=true){
            var depositRate = this.leverToDepositRate(lever);
            var volume = 1;
            const {ASK, BID, MARK} = priceInfo;
            var deposit = 0, repay = 0, takerFee = 0;
            if (side==CONST.FUT.Side.BUY){
                deposit = this.deposit(con, volume, depositRate, isLmt?Math.min(delegatePrice, ASK):ASK);
                repay = this.getRepay(side, con, volume, isLmt?Math.max(delegatePrice, ASK): ASK, MARK);
                takerFee = this.takerFee(con, volume, takerFeeRate, isLmt?Math.min(delegatePrice, ASK):ASK);
            }else{
                deposit = this.deposit(con, volume, depositRate, isLmt?delegatePrice:BID);
                repay = this.getRepay(side, con, volume, isLmt?delegatePrice: BID, MARK);
                takerFee = this.takerFee(con, volume, takerFeeRate, isLmt?delegatePrice:BID);
            }
            return isAdd ? Decimal.accAdd(Decimal.accAdd(deposit, repay), takerFee) : {deposit, repay, takerFee};
        },
        //补足保证金=(1/最新价 - 1/标记价格)* 合约规模 * 数量
        //买入：补足保证金 = Max(0,合约乘数*数量/标记价 - 合约乘数*数量/均价)；
        //卖出：补足保证金 = Max(0,合约乘数*数量/均价 - 合约乘数*数量/标记价)
        getRepay(side, con, volume, avgPrice, mark){
            if (avgPrice && mark && Number(avgPrice)>0 && Number(mark)>0){
                var repay = (side==CONST.FUT.Side.BUY?-1:1) * Number(Decimal.accMul(Decimal.accSubtr(Decimal.accDiv(1, avgPrice), Decimal.accDiv(1, mark)), Number(con)*Number(volume)));
                return Decimal.toFixed(Math.max(0, repay));
            }
            return 0;
        },
        //追加保证金=0.01(非固定)
        //费用=合约规模*数量*taker(0.075%)/均价

        //逐仓多仓：强平价 = 合约规模*均价*数量/（合约规模*数量 + 均价*（初始保证金+补足保证金+追加保证金-维持保证金-持仓费用-taker费率*合约规模*数量/均价））
        //逐仓空仓：强平价 = 合约规模*均价*数量/（合约规模*数量 - 均价*（初始保证金+补足保证金+追加保证金-维持保证金-持仓费用-taker费率*合约规模*数量/均价））
        getForceClosePrice(con, volume, side, avgPrice, deposit, keepDeposit, fee, takerFeeRate, scale){
            var val1 = Decimal.accMul(Number(con)*Number(volume), avgPrice);
            var val2 = Decimal.accDiv(Decimal.accMul(takerFeeRate, con*volume), avgPrice);
            var val3 = Decimal.accMul(avgPrice, Decimal.accSubtr(Decimal.accSubtr(Decimal.accSubtr(deposit, keepDeposit), fee), val2));
            var force;
            if (side == CONST.FUT.Side.BUY){
                force = Decimal.accDiv(val1, Decimal.accAdd(con*volume, val3), scale);
            }else{
                force = Decimal.accDiv(val1, Decimal.accSubtr(con*volume, val3), scale);
                force = force<0 ? 1000000 : force;
            }
            return force;
        },
        //多仓 保证金=(合约规模*均价*数量/强平价-数量*合约规模)/均价+维持保证金+持仓费用+taker费率*合约规模*数量/均价
        //空仓 保证金=(数量*合约规模-合约规模*均价*数量/强平价)/均价+维持保证金+持仓费用+taker费率*合约规模*数量/均价
        forceToMargin(con, side, volume, avgPrice, force, keepDeposit, fee, takerFeeRate, scale){
            var val1 = Decimal.accDiv(Decimal.accMul(Number(con)*Number(volume), avgPrice), force);
            var val2 = Decimal.accDiv(Decimal.accMul(takerFeeRate, con*volume), avgPrice);

            var margin;
            if (side==CONST.FUT.Side.BUY){
                margin = Decimal.accAdd(Decimal.accDiv(Decimal.accSubtr(val1, volume*con), avgPrice), Decimal.accAdd(Decimal.accAdd(keepDeposit, fee), val2), scale);
            }else{
                margin = Decimal.accAdd(Decimal.accDiv(Decimal.accSubtr(volume*con, val1), avgPrice), Decimal.accAdd(Decimal.accAdd(keepDeposit, fee), val2), scale);
            }
            return margin;
        },

        //
        //追加保证金与强平价换算
        // addDeposit2ForceClosePrice(con, volume, side, avgPrice, deposit, addDeposit, repayDeposit, cost, risks, scale){
        //     var lever = this.depositToLever(deposit, con, volume, avgPrice);
        //     var depositRate = this.leverToDepositRate(lever);
        //     var keepDeposit = this.getKeepDeposit(con, avgPrice, volume, risks);
        //     return this.getForceClosePrice(con, volume, side, avgPrice, depositRate, keepDeposit, addDeposit, repayDeposit, cost, scale);
        // },
        //强平价换算杠杆
        //买单 保证金比例=(合约规模1 * 数量 * 均价/强平价 - 均价*(追加保证金+补足保证金-费用))/(合约规模*数量)-(1-维持保证金)
        // //卖单 保证金比例=(1+维持保证金)-(合约规模1 * 数量 * 均价/强平价 + 均价*(追加保证金+补足保证金-费用))/(合约规模*数量)
        // forcePrice2DepositRate(con, volume, side, avgPrice, forcePrice, addDeposit, repayDeposit, cost, risks){
        //     var val1 = forcePrice && Number(forcePrice)>0 ? Decimal.accDiv(Decimal.accMul(Number(con)*Number(volume), avgPrice), forcePrice) : 0;
        //     var val3 = Decimal.accMul(avgPrice, Decimal.accSubtr(Decimal.accAdd(addDeposit, repayDeposit), cost));
        //     var keepDeposit = this.getKeepDeposit(con, avgPrice, volume, risks);
        //
        //     var depositRate;
        //     if (side == CONST.FUT.Side.BUY){
        //         depositRate = Decimal.accSubtr(Decimal.accDiv(Decimal.accSubtr(val1, val3), Number(con)*Number(volume)), Decimal.accSubtr(1, keepDeposit));
        //     }else{
        //         depositRate = Decimal.accSubtr(Decimal.accAdd(1+keepDeposit), Decimal.accDiv(Decimal.accSubtr(val1, val3), Number(con)*Number(volume)));
        //     }
        //     return depositRate;
        // },
        // forcePrice2Lever(con, volume, side, avgPrice, forcePrice, addDeposit, repayDeposit, cost, risks){
        //     var depositRate = this.forcePrice2DepositRate(con, volume, side, avgPrice, forcePrice, addDeposit, repayDeposit, cost, risks);
        //     return this.depositRateToLever(depositRate);
        // },
        //强平价与追加保证金换算 或者换算补足保证金
        // forcePrice2AddDeposit(con, volume, side, avgPrice, forcePrice, deposit, repayDeposit, cost, risks, scale){
        //     var val1 = forcePrice && Number(forcePrice)>0 ? Decimal.accDiv(Decimal.accMul(Number(con)*Number(volume), avgPrice), forcePrice) : 0;
        //     var lever = this.depositToLever(deposit, con, volume, avgPrice);
        //     var depositRate = this.leverToDepositRate(lever);
        //     var keepDeposit = this.getKeepDeposit(con, avgPrice, volume, risks);
        //     if (side == CONST.FUT.Side.BUY){
        //         var val2 = Decimal.accMul(Decimal.accSubtr(Decimal.accAdd(1, depositRate), keepDeposit), Number(con)*Number(volume));
        //         if (avgPrice && Number(avgPrice)>0) return String(Decimal.accAdd(Decimal.accSubtr(Decimal.accDiv(Decimal.accSubtr(val1, val2), avgPrice), repayDeposit), cost, scale));
        //     }else{
        //         var val2 = Decimal.accMul(Decimal.accSubtr(Decimal.accAdd(1, keepDeposit), depositRate), Number(con)*Number(volume));
        //         if (avgPrice && Number(avgPrice)>0) return String(Decimal.accAdd(Decimal.accSubtr(Decimal.accDiv(Decimal.accSubtr(val2, val1), avgPrice), repayDeposit), cost, scale));
        //     }
        //     return 0;
        // },
        // 买单 补足保证金=( 合约规模1 * 数量 * 均价/强平价 - (1+保证金比例-维持保证金)*合约规模*数量 )/均价-(追加保证金-费用)
        // 卖单 补足保证金=((1-保证金比例+维持保证金)*合约规模*数量 - (合约规模1 * 数量 * 均价/强平价)/均价-(追加保证金-费用)
        // 强平价换算补足保证金
        // forcePrice2Repay(con, volume, side, avgPrice, forcePrice, deposit, addDeposit, cost, risks, scale){
        //     var val1 = forcePrice && Number(forcePrice)>0 ? Decimal.accDiv(Decimal.accMul(Number(con)*Number(volume), avgPrice), forcePrice) : 0;
        //     var lever = this.depositToLever(deposit, con, volume, avgPrice);
        //     var depositRate = this.leverToDepositRate(lever);
        //     var keepDeposit = this.getKeepDeposit(con, avgPrice, volume, risks);
        //     if (side == CONST.FUT.Side.BUY){
        //         var val2 = Decimal.accMul(Decimal.accSubtr(Decimal.accAdd(1, depositRate), keepDeposit), Number(con)*Number(volume));
        //         if (avgPrice && Number(avgPrice)>0) return String(Decimal.accAdd(Decimal.accSubtr(Decimal.accDiv(Decimal.accSubtr(val1, val2), avgPrice), addDeposit), cost, scale));
        //     }else{
        //         var val2 = Decimal.accMul(Decimal.accSubtr(Decimal.accAdd(1, keepDeposit), depositRate), Number(con)*Number(volume));
        //         if (avgPrice && Number(avgPrice)>0) return String(Decimal.accAdd(Decimal.accSubtr(Decimal.accDiv(Decimal.accSubtr(val2, val1), avgPrice), repayDeposit), cost, scale));
        //     }
        //
        // },
        //盈亏 = (1/均价 - 1/标记价格)* 数量 * 合约规模1
        plVal(direction, avgPrice, markPrice, volume, con, scale=8){
            if (avgPrice && markPrice && Number(avgPrice)>0 && Number(markPrice)>0) return String(Decimal.accMul(Decimal.accSubtr(Decimal.accDiv(1, avgPrice), Decimal.accDiv(1, markPrice)), Number(con)*Number(volume)*(direction==CONST.TRADE.DIRECTION.BID?1:-1), scale));
            return 0;
        },
        //盈亏率 = 盈亏/保证金
        plRate(pl, deposit){
            if (deposit && Number(deposit)>0) return String(Decimal.accDiv(pl, deposit));
            return 0;
        },
        //获取最多可以减少保证金的数目以及各保证金的数
        // 减少保证金的处理逻辑：（直接减保证金或者修改强平价）
        // 减少保证金时，先减追加保证金，然后减补足保证金，这两个减的时候仓位杠杆不变，但这两个减完后的保证金要大于仓位价值的2%（即高于维持保证金1%的一倍）；
        // 最后减初始保证金，初始保证金的减少不能导致杠杆大于20倍。
        // getCanReduceMargin(con, volume, avgPrice, deposit, addDeposit, repayDeposit, risks){
        //     var keepDeposit = this.getKeepDeposit(con, avgPrice, volume, risks);
        //     var k2 = Decimal.accMul(Decimal.accAdd(keepDeposit, 0.01), this.delegateValue(con, avgPrice, volume));
        //     if (Number(deposit)>=Number(k2)){ //初始保证金>=仓位价值*（维持保证金率+0.01)
        //         var lever = this.depositToLever(k2, con, volume, avgPrice, 8);
        //         var leverNum = Number(lever);
        //         if (leverNum<=20 && leverNum>0){
        //             var reduce = Number(Decimal.accAdd(Decimal.accAdd(addDeposit, repayDeposit), Decimal.accSubtr(deposit, k2)));
        //             return {reduce, add:0, repay:0, deposit:String(k2), marginTotal:String(k2)};
        //         }else if(leverNum > 20){
        //             var maxDeposit = this.deposit(con, volume, this.leverToDepositRate(20), avgPrice, 8);
        //             var reduce = Number(Decimal.accAdd(Decimal.accAdd(addDeposit, repayDeposit), Decimal.accSubtr(deposit, maxDeposit)));
        //             return {reduce, add:0, repay:0, deposit:String(maxDeposit), marginTotal:String(maxDeposit)};
        //         }
        //     }else{
        //         var remain = Decimal.accSubtr(k2, deposit);
        //         var sum = Decimal.accAdd(addDeposit, repayDeposit);
        //         if (Number(sum)>Number(remain)){
        //             var reduce = Number(Decimal.accSubtr(sum, remain));
        //             if (reduce>Number(addDeposit)){
        //                 var data = {reduce, add:0, repay:Decimal.accSubtr(repayDeposit, Decimal.accSubtr(reduce, addDeposit)), deposit};
        //                 data.marginTotal = String(Decimal.accAdd(data.repay, data.deposit));
        //                 return data;
        //             }else{
        //                 var data = {reduce, add:Decimal.accSubtr(addDeposit, reduce), repay:repayDeposit, deposit:deposit};
        //                 data.marginTotal = String(Decimal.accAdd(data.add, Decimal.accAdd(data.repay, data.deposit)));
        //                 return data;
        //             }
        //         }else{
        //             return {reduce:0};
        //         }
        //     }
        // },
        // //获取最大可以改变的强平价
        // getForceRange(con, volume, side, avgPrice, deposit, addDeposit, repayDeposit, cost, risks, scale){
        //     var reduceInfo = this.getCanReduceMargin(con, volume, avgPrice, deposit, addDeposit, repayDeposit, risks);
        //     if (reduceInfo.reduce > 0){
        //         var keepDeposit = this.getKeepDeposit(con, avgPrice, volume, risks);
        //         var lever = this.depositToLever(reduceInfo.deposit, con, volume, avgPrice, 6);
        //         return this.getForceClosePrice(con, volume, side, avgPrice, this.leverToDepositRate(lever), keepDeposit, reduceInfo.add, reduceInfo.repay, cost, scale);
        //     }
        // },
        // //减少保证金时，计算强平价
        // reduceMargin2Force(reduce, con, volume, side, avgPrice, deposit, addDeposit, repayDeposit, cost, risks, scale){
        //     var newDeposit = deposit, newAdd = addDeposit, newRepay = repayDeposit;
        //     var keepDeposit = this.getKeepDeposit(con, avgPrice, volume, risks);
        //
        //     var remain1 = Decimal.accSubtr(reduce, addDeposit);
        //     if (Number(remain1)>0){
        //         newAdd = 0;
        //         var remain2 = Decimal.accSubtr(remain1, repayDeposit);
        //         if (Number(remain2)>0){
        //             newRepay = 0;
        //             newDeposit = Decimal.accSubtr(deposit, remain2);
        //         }else{
        //             newRepay = -Number(remain2);
        //         }
        //     }else{
        //         newAdd = -Number(remain1);
        //     }
        //
        //     if (Number(newDeposit)) return this.getForceClosePrice(con, volume, side, avgPrice, this.depositToDepositRate(newDeposit, con, volume, avgPrice, 6), keepDeposit, newAdd, newRepay, cost, scale);
        // },
        // //相当于减少保证金时的反推
        // force2ReduceMargin(force, con, volume, side, avgPrice, deposit, addDeposit, repayDeposit, cost, risks, scale){
        //     var add = Number(this.forcePrice2AddDeposit(con, volume, side, avgPrice, force, deposit, repayDeposit, cost, risks, scale));
        //     if (add<0){
        //         var repay = Number(this.forcePrice2AddDeposit(con, volume, side, avgPrice, force, deposit, 0, cost, risks, scale));
        //         if (repay < 0){
        //             var depositRate = this.forcePrice2DepositRate(con, volume, side, avgPrice, force, 0, 0, cost, risks, scale);
        //             return String(this.deposit(con, volume, depositRate, avgPrice, scale));
        //         }else{
        //             return String(Decimal.accAdd(deposit, repay, scale));
        //         }
        //     }else{
        //         return String(Decimal.accAdd(Decimal.accAdd(add, deposit), repayDeposit, scale));
        //     }
        // },
        takerFee(con, volume, takerFeeRate, price){
            return price ? Decimal.accDiv(Decimal.accMul(takerFeeRate, con*volume), price) : 0;
        },
        //资金费用
        //资金费率*仓位价值
        fundFee(con, avg_price, volume, side, fundRate, scale){
            var delegateValue = this.delegateValue(con, avg_price, volume);
            return Decimal.accMul(Decimal.accMul(delegateValue, side==CONST.FUT.Side.BUY?1:-1), fundRate, scale);
        },
        //预期强平
        //逐仓多仓 强平价 = 合约规模*均价*数量/（合约规模*数量 + 均价*（初始保证金+补足保证金+追加保证金-维持保证金-持仓费用-taker费率*合约规模*数量/均价））
        //逐仓空仓：强平价 = 合约规模*均价*数量/（合约规模*数量 - 均价*（初始保证金+补足保证金+追加保证金-维持保证金-持仓费用-taker费率*合约规模*数量/均价））
        //price:均价(限价单-委托价，市价单-买一卖一价)
        //因为限价买的时候用了最大保证金收取原则，跟其他不一样，在计算限价买的预期补足保证金时需要用max取最大的保证收到的补足保证金是最多的
        expectForce(side, con, delegatePrice, askbid, volume, lever, mark, takerFeeRate, posTotalVolume, risks, scale){
            var val;
            if (side==CONST.FUT.Side.SELL){//舍去
                var price = delegatePrice>0 ? Math.min(delegatePrice, askbid) : askbid;
                //初始保证金
                var baseDeposit = this.leverDeposit(con, volume, lever, price);
                //补足
                var repay = this.getRepay(side, con, volume, price, mark);
                //追加
                var add = 0;
                var depositTotal = Decimal.accAdd(Decimal.accAdd(baseDeposit, repay), add);
                //维持保证金
                var keepDeposit = this.getKeepDeposit(con, price, volume, posTotalVolume, risks);
                //持仓费用
                var fee = 0;
                //taker费率*合约规模*数量/均价
                var takerFee = this.takerFee(con, volume, takerFeeRate, price);

                val = Decimal.round(Decimal.accDiv(Decimal.accMul(con*volume, price), Decimal.accSubtr(con*volume,
                    Decimal.accMul(price, Decimal.accSubtr(Decimal.accSubtr(Decimal.accAdd(depositTotal, delegatePrice>0?takerFee:0), keepDeposit), takerFee)))), scale);
            }else{ //进位
                var price = delegatePrice>0 ? Math.min(delegatePrice, askbid) : askbid;

                var baseDeposit = this.leverDeposit(con, volume, lever, price);
                //补足
                var repay = this.getRepay(side, con, volume, price, mark);
                //追加
                var add = 0;
                var depositTotal = Decimal.accAdd(Decimal.accAdd(baseDeposit, repay), add);
                //维持保证金
                var keepDeposit = this.getKeepDeposit(con, price, volume, posTotalVolume, risks);
                //持仓费用
                var fee = 0;
                //taker费率*合约规模*数量/均价
                var takerFee = this.takerFee(con, volume, takerFeeRate, price);

                val = Decimal.ceil(Decimal.accDiv(Decimal.accMul(con*volume, price), Decimal.accAdd(con*volume,
                    Decimal.accMul(price, Decimal.accSubtr(Decimal.accSubtr(Decimal.accAdd(depositTotal, delegatePrice>0?takerFee:0), keepDeposit), takerFee)))), scale);
            }
            val = Number(val)<0 ? 1000000 : val;
            return val;
        },
        //同方向合并仓位
        //均价=合并后数量/原仓位价值之和
        mergeAvgPrice(volumeTotal, delegateValueTotal, scale){
            return Decimal.accDiv(volumeTotal, delegateValueTotal, scale);
        },
    },
    init(appModel, mgr, initCallback){
        this.appModel = appModel;
        this._mgr = mgr;

        this.initLoadSetting();

        var typeSort = [7]; //7 永续合约
        // //初始化前端产品类型列表配置
        for (var i=0,l=typeSort.length; i<l; i++){
            var t = typeSort[i];
            //"Sort":2,"Code":"BTC","Name":"BTC"
            this.typeList.push({
                "Code": t,
                "LangKey": "fut.type." + t
            });
        }
        //顺序
        var currencySort = {};
        currencySort[CONST.CURRENCY.BTC] = 1;
        currencySort[CONST.CURRENCY.ETH] = 2;
        // this.currencySort = currencySort;

        //登录后加载订单等交易数据
        AuthModel.registerFutTrade(this);
        // if (AuthModel.checkUserAuth()){
        //     this.loadTradeData();
        // }

        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLang.bind(this));

        //加载产品列表
        this.initProductList(initCallback);
    },
    initProductList(initCallback){
        this.adjustProductListData(Product.getFutProductList());

        if (initCallback) initCallback();
        // var self = this;
        // var lastUpdateTime = 0;
        //
        // //加载前端产品列表
        // // this.loadClientProduct();
        //loadTradeData
        // //加载后端
        // var loadProductList =  (now)=>{
        //     if (now - self.reqProductListLastTime>6000){
        //         self.reqProductListLastTime = now;
        //
        //         const handler =  (data)=>{
        //             if (data.Status == 0){
        //                 if (self.reqProductListTimerId){
        //                     clearInterval(self.reqProductListTimerId);
        //                     self.reqProductListTimerId = null;
        //                 }
        //
        //                 // 最后更新产品列表时间
        //                 lastUpdateTime = self.reqProductListLastTime;
        //
        //                 var productList = data.Data.product;
        //                 if (!productList) this.typeList = [];
        //
        //
        //                 if (!self.isInited){
        //                     if (initCallback) initCallback();
        //                     self.isInited = true;
        //                 }
        //             }
        //         };
        //
        //         // 更新最后的时间，获取最新的产品信息
        //         self.reqProductList(handler);
        //
        //         WsMgr.on('futures', self.onUpdateProductList.bind(self));
        //
        //         //产品列表变化
        //         // WsMgr.on('ListUpdate_fut', function () {
        //         //     //防止同一时间多个通知，不断获取
        //         //     var now = new Date().getTime();
        //         //     if (now - self.productlistNotifyLastTime >= 1000)
        //         //     {
        //         //         self.productlistNotifyLastTime = now;
        //         //         self.reqProductList(handler);
        //         //     }
        //         // });
        //     }
        // };
        //
        // this.reqProductListTimerId = setInterval(()=>{
        //     loadProductList(new Date().getTime());
        // }, 6500);
        // loadProductList(new Date().getTime());
    },
    initLoadSetting(){
        if (this.setting) return;

        var setting = AuthModel.loadPreference('fut-setting', {});
        //defaultSetting新增属性时
        this.setting = Object.assign({}, this.defaultSetting, setting);
    },
    onChangeLang(){
        this.buildOrders();
        this.buildPosition();
    },
    loadTradeData(){
        this.loadSchemeByCode(this.currCode);
        this.loadPosition();
        this.loadOrders();
        this.loadMsg();
    },
    addMsg(msg){
        if (IS_TRADE_V2) return;

        this.msgsTotal += msg.length;
        if (this.msgsTotal > this.msgMaxCount){
            this.msgs.shift();
        }

        this.msgId++;
        var item = {ID:this.msgId, t:SysTime.ts2Server(SysTime.getServerTimeStamp()), m:msg};
        this.msgs.push(item);

        Event.dispatch(Event.EventName.TRADE_EVENT_UPDATE, item);

        this.saveMsg();
    },
    saveMsg(){
        if (IS_TRADE_V2) return;

        setStorage("tdex_msg_"+AuthModel.getUid(), this.msgs, true);
    },
    loadMsg(){
        if (IS_TRADE_V2) return;

        this.msgs = getStorage("tdex_msg_"+AuthModel.getUid(), true)||[];
        if (this.msgs){
            var len = this.msgs.length;

            if (len > 0)this.msgId = this.msgs[len-1].ID;

            var count = 0;
            var findIndex = -1;
            for (var i=len-1; i>=0; i--){
                var v = this.msgs[i];
                count += v.m.length;
                if (count >= this.msgMaxCount){
                    findIndex = i;
                    break;
                }
            }
            if (findIndex != -1){
                this.msgs.splice(0, findIndex);
            }
            this.msgsTotal = count;
        }
    },
    onUpdateOrderData(data){
        // if ("development" == process.env.NODE_ENV) console.log(JSON.stringify(data));

        var isPlOrder = false;
        for (var i=0,l=data.length; i<l; i++){
            var item = data[i];
            var order = Object.assign({}, item);
            var event = order.Event;

            // delete order.Event;
            // delete order.Type;
            // delete order.SerialID;

            if (event=='Create'){
                var find = -1;
                for (var a=0,al=this.baseOrders.length; a<al; a++){
                    var bOrder = this.baseOrders[a];
                    if (bOrder.ID==order.ID){
                        find = a;
                        Object.assign(bOrder, order);
                        break;
                    }
                }
                if (find<0){
                    this.baseOrders.unshift(order);
                    var textList = this.parseOrderToText(order);
                    Notification.success(Intl.lang('trade.event.order_create', order.PID, textList.join(" ")));
                }
            }else if(event=='Delete'){
                var key = -1;
                var bOrder;
                for (var a=0,al=this.baseOrders.length; a<al; a++){
                    bOrder = this.baseOrders[a];
                    if (bOrder.ID==order.ID){
                        key = a;
                        var result = this.delPLRelateOrder(bOrder.PID, bOrder.ID);
                        if (result) isPlOrder = true;
                        break;
                    }
                }
                if (key>=0){
                    this.baseOrders.splice(key, 1);
                    if (order.hasOwnProperty("Reason") && [1000,1004,1005,1018,1021,1025,1010,1034,2000,2002,2004,2011,2013].indexOf(order.Reason)!=-1){
                        var reason = Intl.lang("server.status."+order.Reason);
                        Notification.error(Intl.lang("trade.event.order_delete", bOrder.PID, reason));
                    }
                }
            }else if(event=='Update'){
                for (var a=0,al=this.baseOrders.length; a<al; a++){
                    bOrder = this.baseOrders[a];
                    if (bOrder.ID==order.ID){
                        Object.assign(bOrder, order);
                        item.full = Object.assign({}, bOrder);
                        break;
                    }
                }
                if (item.full){
                    var fOrder = item.full;
                    if (fOrder.hasOwnProperty("Reason") && fOrder.hasOwnProperty("XVolume") && fOrder.hasOwnProperty("FinalPrice") && fOrder.Reason==2007 && Number(fOrder.Scale)==0){
                        var textList = this.parsePosOrderToText(fOrder);
                        Notification.success(Intl.lang("trade.event.position_create", fOrder.PID, textList.join(" ")))
                    }
                }
            }
            //被撤销 原因
            // 2000
            // 1025
            // 2004
            // 2011
            // 2013
            // 1010
            // 1034
            // 2002
        }
        this.buildOrders();

        this.addMsg(data);
    },
    onUpdatePositionData(data){
        // if ("development" == process.env.NODE_ENV) console.log(JSON.stringify(data));
        for (var i=0,l=data.length; i<l; i++){
            var item = data[i];
            var order = Object.assign({}, item);
            var event = order.Event;

            // delete order.Event;
            // delete order.Type;
            // delete order.SerialID;

            if (event=='Create'){
                var find = -1;
                for (var a=0,al=this.basePositions.length; a<al; a++){
                    var bOrder = this.basePositions[a];
                    if (bOrder.ID==order.ID){
                        find = a;
                        Object.assign(bOrder, order);
                        break;
                    }
                }
                if (find<0){
                    //仓位通知默认亮灯Index=0
                    if (!order.hasOwnProperty("Index")) order.Index = 0;

                    this.basePositions.unshift(order);
                    //拆分和合并不显示提示
                    if (!order.hasOwnProperty("Reason") || (order.hasOwnProperty("Reason") && [2003,2006].indexOf(order.Reason)==-1)){
                        var textList = this.parsePositionToText(order);
                        Notification.success(Intl.lang('trade.event.position_create', order.ID, textList.join(" ")));
                    }
                }
            }else if(event=='Delete'){
                var find = -1;
                for (var a=0,al=this.basePositions.length; a<al; a++){
                    var bOrder = this.basePositions[a];
                    if (bOrder.ID==order.ID){
                        find = a;
                        break;
                    }
                }
                if (find>=0)this.basePositions.splice(find, 1);
            }else if(event=='Update'){
                for (var a=0,al=this.basePositions.length; a<al; a++){
                    var bOrder = this.basePositions[a];
                    if (bOrder.ID==order.ID){
                        Object.assign(bOrder, order);
                        item.full = Object.assign({}, bOrder);
                        break;
                    }
                }
            }
        }
        this.buildPosition();


        this.addMsg(data);
    },
    onUpdateRank(data){
        var lastRank;

        for (var di=0,dl=data.length;di<dl;di++){
            var dv = data[di];
            dv.Type = 'Rank';

            var id = dv["ID"];
            var item = this.positions[id];
            if (item){
                item.Index = Number(dv.Star);
                var list = this.positionList;

                var oldRank = this.rankInPosition[item.CID];

                this.rankInPosition[item.CID] = -1;
                list.filter((v)=>v.CID==item.CID).forEach((v, i)=>{
                    this.statPositionRank(v);
                });
                var newRank = this.rankInPosition[item.CID];
                //排名不一样，并且是当前选中的code
                if (oldRank!=newRank && item.Product.Code==this.currCode){
                    lastRank = newRank;
                }
            }
        }

        Event.dispatch(Event.EventName.FUT_ORDERRANK_UPDATE, lastRank);

        // this.addMsg(data);
    },
    onUpdateMiningData(type, data){
        if (data && data.Type=='futures'){
            this.addMsg([{Type: 'Mining', Event:type, Msg:data.Msg}]);
            Event.dispatch(Event.EventName.MINING_UPDATE, {Event:type, Msg:data.Msg});
        }
    },
    buildPosition(){
        var list = JSON.parse(JSON.stringify(this.basePositions));
        // var oldPositions = this.positions;
        this.positions = {};
        this.positionList = [];

        this.parsePositionList(list, (item)=>{
            this.findPLRelateOrders(item.ID, (attrs)=>{
                Object.assign(item, attrs);
            }, 'position', item);

            this.positions[item.ID] = item;
            this.positionList.push(item);
        });

        this.updatePositionList();
    },
    //标记价格更新时，或者订单更新时都执行stopPropertion
    updatePositionList(){
        if (this.positionList){
            this.calcPositionStat(this.positionList);

            Event.dispatch(Event.EventName.FUT_ORDER_UPDATE, {positions:this.positionList});
        }
    },
    buildOrders(){
        var list = JSON.parse(JSON.stringify(this.baseOrders));

        this.orders = {};
        this.orderList = [];

        this.parseOrderList(list, (item)=>{
            this.orders[item.ID] = item;
            this.orderList.push(item);
        });

        this.orderList.forEach((item)=>{
            //查找关联的止盈止损单
            if (item.Attempt==CONST.FUT.Action.OPEN){
                this.findPLRelateOrders(item.PID, (attrs)=>{
                    Object.assign(item, attrs);
                }, 'order', item);
            }
        });

        if (this.positionList){
            //查找关联的止盈止损单
            this.positionList.forEach((v)=>this.findPLRelateOrders(v.ID, (attrs)=>{
                Object.assign(v, attrs);
            }, 'position', v));
        }

        this.updateOrderList();
    },
    //最新价或者标记价格更新时
    updateOrderList(){
        if (this.orderList){
            this.calcOrderStat(this.orderList);

            Event.dispatch(Event.EventName.FUT_ORDER_UPDATE, {orders:this.orderList});
        }
    },
    //公共属性添加
    _addCommonAttrToTradeItem(item, type){
        var product = this.getProductByID(item.CID);
        item.Product = product;
        item.Con = this.getCon(item.CID);
        item.CName = product.Name;
        if (!item.ScaleTxt) item.ScaleTxt = Decimal.toFixed(item.Scale, product.ScaleFixed)+'x';
        item.orderType = type;
        if (type=='order' || type=='history'){
            // item.SideTxt = item.Side==CONST.FUT.Side.BUY ? "BUY" : "SELL";
            item.SideTxt = Intl.lang("trade.side."+ (item.Side==CONST.FUT.Side.BUY ? "BUY" : "SELL"));
        }else{
            item.SideTxt = Intl.lang("trade.side."+ (item.Side==CONST.FUT.Side.BUY ? "LONG" : (item.Side==CONST.FUT.Side.SELL ? "SHORT" : "FLAT")));
        }
    },
    //添加统计的属性到仓位 （盈亏等）随价格变化的
    _addStatAttrToPosition(order){
        var con = order.Con;
        var product = order.Product;
        var lastPrice = product.price.LAST;
        var markPrice = product.price.MARK;
        order.Mark = markPrice;
        //console.log("_addStatAttrToPosition: "+ markPrice);

        var sb = getCurrencySymbol(product.Currency);
        //价值
        order.delegateValue = this.formula.delegateValue(con, order.Price, order.Volume);
        order.delegateValueDesc = `${sb.sb}${Decimal.toFixed(order.delegateValue, product.ShowFixed)}`;

        if (lastPrice){
            order.ProfitLoss = this.formula.plVal(order.Side, order.Price, lastPrice, order.Volume, con);
        }else{
            order.ProfitLoss = 0;
        }
        if (order.hasOwnProperty("Index") && order.Index>0 && Number(order.ProfitLoss)<0) order.Index = 0;

        order.PlRate = Number(order.MarginTotal)>0 ? this.formula.plRate(order.ProfitLoss, order.MarginTotal) : 0;
        order.ProfitLossDesc = sb.sb+Decimal.toFixed(order.ProfitLoss, product.ShowFixed)+"("+String(Decimal.toPercent(order.PlRate, 2))+")";

        if (markPrice) { //盈亏
            order.ProfitLossMark = this.formula.plVal(order.Side, order.Price, markPrice, order.Volume, con);
        }else{
            order.ProfitLossMark = 0;
        }
        order.PlRateMark = Number(order.MarginTotal)>0 ? this.formula.plRate(order.ProfitLossMark, order.MarginTotal) : 0;
        order.ProfitLossMarkDesc = sb.sb+Decimal.toFixed(order.ProfitLossMark, product.ShowFixed)+"("+String(Decimal.toPercent(order.PlRateMark, 2))+")";
    },
    parseOrderList(list, itemCallback, isHistory = false){
        if (!list) return [];

        for (var i=0,len=list.length; i<len; i++){
            try{
                var item = list[i];
                // item.ID = item.ID;
                // item.PID = item.PID;
                item.CID = Number(item.CID);
                item.Constant = Number(item.Constant);
                item.Scale = Number(item.Scale);

                this._addCommonAttrToTradeItem(item, !isHistory ? 'order' : 'history');
                var product = item.Product;
                //保证数据是按原来的
                if (product) item.Constant = Number(Decimal.toFixed(item.Constant, product.PriceFixed));

                item.VolumeDesc = item.Filled + '/'+item.Volume;

                item.Visible = item.Visible==4294967295 ? -1 : item.Visible;
                item.VolumeHide = (item.Visible==-1?0:item.Volume-item.Visible) + '/'+(item.Visible==-1?item.Volume:item.Visible);

                item.AttemptName = Intl.lang("trade.order.Action"+item.Attempt);
                //订单类型：限价，市价（正常不出现，因为立即成交），条件(最新)，条件(标记)，止盈，止损，追踪止损
                if (item.Kind==CONST.FUT.Kind.LMT){ //限价
                    // if ((item.Attempt==CONST.FUT.Action.TP || item.Attempt==CONST.FUT.Action.SL) && item.Strategy!=CONST.FUT.Strategy.Trail){
                    //     item.TypeDesc = Intl.lang(item.Passive ? "trade.order.Strategy10_p" : "trade.order.Strategy10");
                    // }else{
                    //     item.TypeDesc = item.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang(item.Passive ? "trade.order.Strategy10_p" : "trade.order.Strategy10"):Intl.lang(item.Strategy==CONST.FUT.Strategy.Line?(item.Passive ? 'trade.order.Strategy11_p':'trade.order.Strategy11'):'trade.order.Strategy12');
                    // }

                    if (item.Strategy==CONST.FUT.Strategy.Immediate){
                        item.TriggerPrice = '';
                    }else if (item.Strategy==CONST.FUT.Strategy.Line){
                        var gl = (item.Side==CONST.FUT.Side.BUY && item.Attempt!=CONST.FUT.Action.TP || item.Side==CONST.FUT.Side.SELL && item.Attempt==CONST.FUT.Action.TP) ?"common.symbol.ge":"common.symbol.le";
                        //历史记录取了相反的方向，因此这里必须相反
                        // if (isHistory) gl = gl=="common.symbol.ge" ? "common.symbol.le" : "common.symbol.ge";
                        item.TriggerPrice = this.VariableTxtMap[item.Variable]+ Intl.lang(gl)+Number(item.Constant)+ (item.Relative?Intl.lang("trade.open.delegateOption2"):'');
                        // if (item.State < CONST.FUT.State.TRIGGERRED) item.PriceDistance = _calcPriceDistance(item);
                    }
                }else{ //市价
                    // if ((item.Attempt==CONST.FUT.Action.TP || item.Attempt==CONST.FUT.Action.SL) && item.Strategy!=CONST.FUT.Strategy.Trail){
                    //     item.TypeDesc = Intl.lang("trade.order.Strategy00");
                    // }else{
                    //     item.TypeDesc = item.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy00'):Intl.lang(item.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy01':'trade.order.Strategy02');
                    // }

                    if (item.Strategy==CONST.FUT.Strategy.Immediate){
                        item.TriggerPrice = '';
                    }else if (item.Strategy==CONST.FUT.Strategy.Line){
                        var gl = (item.Side==CONST.FUT.Side.BUY && item.Attempt!=CONST.FUT.Action.TP || item.Side==CONST.FUT.Side.SELL && item.Attempt==CONST.FUT.Action.TP) ?"common.symbol.ge":"common.symbol.le";
                        // if (isHistory) gl = gl=="common.symbol.ge" ? "common.symbol.le" : "common.symbol.ge";
                        item.TriggerPrice = this.VariableTxtMap[item.Variable]+ Intl.lang(gl)+Number(item.Constant)+ (item.Relative?Intl.lang("trade.open.delegateOption2"):'');
                        // if (item.State < CONST.FUT.State.TRIGGERRED) item.PriceDistance = _calcPriceDistance(item);
                    }
                    // item.DistanceTxt = '';
                }

                if (item.Attempt==CONST.FUT.Action.SL){
                    if (item.Strategy==CONST.FUT.Strategy.Trail) item.TypeDesc = Intl.lang("trade.order.Type6");
                    else item.TypeDesc = Intl.lang("trade.order.Type5");
                }
                else if(item.Attempt==CONST.FUT.Action.TP){
                    item.TypeDesc = Intl.lang("trade.order.Type4");
                    if (item.Passive){
                        item.TypeDesc = Intl.lang("trade.order.Type7", item.TypeDesc);
                    }else if(item.Visible>=0){
                        item.TypeDesc = Intl.lang("trade.order.Type8", item.TypeDesc);
                    }
                }
                else{
                    var actionDesc = Intl.lang("trade.order.Action"+item.Attempt);
                    if (item.Kind==CONST.FUT.Kind.LMT){
                        if (item.Passive){
                            item.TypeDesc = Intl.lang("trade.order.Type7", actionDesc);
                        }else if(item.Visible>=0){
                            item.TypeDesc = Intl.lang("trade.order.Type8", actionDesc);
                        }else{
                            item.TypeDesc = Intl.lang("trade.order.Type1", actionDesc);
                        }
                    }else{
                        if (item.Strategy==CONST.FUT.Strategy.Line){
                            if (item.Variable==CONST.FUT.Variable.MarkPrice){
                                item.TypeDesc = Intl.lang("trade.order.Type3", actionDesc);
                            }else if(item.Variable==CONST.FUT.Variable.LastPrice){
                                item.TypeDesc = Intl.lang("trade.order.Type2", actionDesc);
                            }
                        }else if(item.Strategy==CONST.FUT.Strategy.Immediate){
                            item.TypeDesc = Intl.lang("trade.order.Type0", actionDesc)
                        }
                    }
                }

                if (item.Distance){
                    item.PriceTxt = Number(item.Price) + Intl.lang("trade.open.delegateOption2");
                }else{
                    if (item.Attempt==CONST.FUT.Action.TP && item.Relative){
                        item.PriceTxt = Number(item.Price) + Intl.lang("trade.open.delegateOption2");
                    }else if(item.Attempt==CONST.FUT.Action.SL && item.Strategy==CONST.FUT.Strategy.Trail){
                        item.PriceTxt = Number(item.Constant) + Intl.lang("trade.open.delegateOption2");
                    }
                    else{
                        item.PriceTxt = Number(item.Price);
                    }
                }
                item.OrderPrice = item.TriggerPrice ? item.TriggerPrice : (item.PriceTxt?item.PriceTxt:"");
                //部分成交价
                item.DealPrice = item.Filled > 0 && item.Weight>0 ? Decimal.accDiv(item.Filled, item.Weight, product.AvgPriceFixed) : '';

                item.StateTxt = this.getOrderStateTxt(item);

                item.TimelyDesc = item.Timely==CONST.FUT.Timely.GTC ? 'GTC':(item.Timely==CONST.FUT.Timely.LIFE ? moment.unix(item.Deadline).format("MM-DD HH:mm:ss") : SysTime.ts2Server(item.TimelyParam, "MM-DD HH:mm:ss"));

                if (item.Attempt == CONST.FUT.Action.OPEN){
                    //计算订单的保证金
                    item.Lever = this.formula.leverToDepositRate(item.Scale);
                }

                item.delegateValue = this.formula.delegateValue(product.Scale, item.Price ? item.Price : item.Constant, item.Volume);

                if (itemCallback) itemCallback(item);
            }catch (e){
                console.error(e);
            }
        }

        return list;
    },
    getOrderStateTxt(item){
        var StateTxt;
        if (item.hasOwnProperty("Filled") && item.hasOwnProperty("Volume") && item.Filled>0 && item.Filled<item.Volume && [CONST.FUT.State.TRIGGERRED,CONST.FUT.State.FILLED].indexOf(item.State)!=-1){
            StateTxt = Intl.lang("trade.order.StatePart");
        }else if (item.hasOwnProperty("Filled") && item.hasOwnProperty("Volume") && item.Filled==item.Volume){
            StateTxt = Intl.lang("trade.order.State5");
        }else if(item.State == CONST.FUT.State.FILLED){
            StateTxt = Intl.lang(item.hasOwnProperty("Reason") && (item.Reason==2013 || item.Reason==2011) ? "trade.order.StateExpireCancel" : "trade.order.StateCancel");
        }else if (item.hasOwnProperty("Reason") && item.State==CONST.FUT.State.TRIGGERRED && item.Reason==2010){
            StateTxt = Intl.lang("trade.order.StateModify");
        }else if(item.State == CONST.FUT.State.WAITING && (item.Attempt==CONST.FUT.Action.TP || item.Attempt==CONST.FUT.Action.SL)){
            StateTxt = Intl.lang("trade.order.State1_tp");
        }
        else{
            StateTxt = Intl.lang("trade.order.State"+item.State);
        }
        return StateTxt;
    },

    getOrderReason(item){
        var txt = '';
        if (item.Reason>0){
            txt = Intl.lang("server.status."+item.Reason);
        }
        return txt;
    },
    calcOrderStat(orders){
        const _calcPriceDistance = (item)=>{
            if (item.Relative) return;

            var priceInfo = item.Product.price;
            var nowPrice = priceInfo[this.VariableTxtMap[item.Variable]];
            if (item.Side==CONST.FUT.Side.BUY){
                return String(Decimal.accSubtr(nowPrice, item.Constant));
            }else{
                return String(Decimal.accSubtr(item.Constant, nowPrice));
            }
        }

        var marginTotal = {};
        for (var i=0,l=orders.length; i<l; i++){
            try{
                var item = orders[i];
                item.Price = Number(item.Price);
                item.Constant = Number(item.Constant);

                if (item.Strategy==CONST.FUT.Strategy.Line && item.State < CONST.FUT.State.TRIGGERRED){
                    item.PriceDistance = _calcPriceDistance(item);
                }

                // if (item.Attempt == CONST.FUT.Action.OPEN && item.State==CONST.FUT.State.TRIGGERRED){

                    // var price = product.price;
                var product = item.Product;
                if (!marginTotal.hasOwnProperty(product.Currency)){
                    marginTotal[product.Currency] = 0;
                }
                // var avgPrice = item.Kind==CONST.FUT.Kind.LMT ? item.Locked : price.LAST;
                // //公式中的保证金
                // item.Deposit = avgPrice ? this.formula.deposit(item.Con, (item.Volume-item.Filled), item.Lever, avgPrice, product.CalcFixed) : 0; //保证金
                // //Margin=公式的“保证金”+追加保证金
                // item.Margin = item.Deposit;
                // item.Repay = avgPrice && price.MARK ? Math.max(0, this.formula.getRepay(item.Side, item.Con, (item.Volume-item.Filled), avgPrice, price.MARK)) : 0;
                // //全部保证金 保证金+ 补充保证金
                // item.MarginTotal = String(Decimal.accAdd(item.Margin, item.Repay));
                //直接使用后端的订单的保证金
                item.MarginTotal = item.Margin;
                item.Deposit = item.Margin;

                //委托价值
                var con = this.getCon(item.CID);
                var sb = getCurrencySymbol(product.Currency);
                var priceInfo = item.Product.price;


                if (item.parentDelegateValue){
                    item.delegateValueDesc = sb.sb+ Decimal.toFixed(item.parentDelegateValue, product.ShowFixed);
                }else{
                    item.delegateValueDesc = sb.sb+this.formula.delegateValue(con, item.Price ? item.Price : item.Constant, item.Volume, product.ShowFixed);
                }

                marginTotal[product.Currency] = String(Decimal.accAdd(item.MarginTotal, marginTotal[product.Currency], product.CalcFixed));
                // }
            }catch (e){
                console.error(e);
            }
        }

        this.orderMarginTotal = marginTotal;

        // for (var currency in marginTotal){
        //     if (marginTotal[currency]!=this.orderMarginTotal[currency]){
        //
        //         Event.dispatch(Event.EventName.FUT_ORDERMARGIN_UPDATE, marginTotal);
        //         break;
        //     }
        // }
    },
    parsePositionList(list, itemCallback){
        if (!list) return [];

        for (var i=0,len=list.length; i<len; i++){
            try{
                var item = list[i];
                // item.ID = item.ID;
                item.CID = Number(item.CID);
                // item.Constant = Number(item.Constant);

                this._addCommonAttrToTradeItem(item, 'position');

                var product = item.Product;
                var sb = getCurrencySymbol(product.Currency);

                item.Force = Decimal.toFixed(item.Force, product.AvgPriceFixed);

                // item.ForceDesc = Decimal.toFixed(item.Force, product.PriceFixed);
                item.ForceDesc = item.Force;
                item.Scale = Decimal.toFixed(item.Scale, 2);
                if (IS_TRADE_V2){
                    //原Margin包括开仓费用 PureMargin不包括，全是保证金
                    item.MarginUnit = Decimal.toFixed(Decimal.accDiv(item.PureMargin, item.Volume), product.CalcFixed);
                    item.Margin = Decimal.toFixed(item.PureMargin, product.CalcFixed);
                    // item.RepayUnit = item.toFixed(Decimal.accDiv(item.));
                    // item.Repay = Decimal.toFixed(Decimal.accMul(item.RepayUnit, item.Volume), product.CalcFixed);
                    //包括资金费用
                    item.FeeUnit = Decimal.toFixed(Decimal.accDiv(item.Fee, item.Volume), product.CalcFixed);
                    item.Fee = Decimal.toFixed(item.Fee, product.CalcFixed);
                    //新的保证金是全部的保证金之和
                    item.MarginTotal = String(item.Margin);

                    if (item.hasOwnProperty("FundFee")){
                        //资金费用
                        item.FundFeeDesc = sb.sb + Decimal.toFixed(item.FundFee||0, product.ShowFixed);
                        //手续费
                        if (Number(item.Coin1Fee)==0 && Number(item.Coin2Fee)==0){//BTC
                            item.ChargeFee = item.CoinFee;
                            item.ChargeFeeDesc = Decimal.toFixed(item.ChargeFee, product.ShowFixed);
                            item.ChargeFeeUnit = sb.sn;
                            if (Number(item.ChargeFee)<Number(item.OriginFee)){
                                item.ChargeFeeOriginDesc = Decimal.toFixed(item.OriginFee, product.ShowFixed);
                            }
                        }else{ //TD
                            var tdInfo = Product.getCoinInfo(CONST.CURRENCY.TD);
                            var fixed = tdInfo ? tdInfo.ShowDigits : 0;
                            item.ChargeFee = Decimal.accAdd(Decimal.accAdd(item.Coin1Fee, item.Coin2Fee), item.ValueFee);
                            item.ChargeFeeDesc = Decimal.toFixed(item.ChargeFee, fixed);
                            item.ChargeFeeUnit = tdInfo ? tdInfo.Code : '';
                            // if (Number(item.ChargeFee)<Number(item.ValueOriginFee)){
                            item.ChargeFeeOriginDesc = Decimal.toFixed(item.ValueOriginFee, fixed);
                            // }
                        }
                    }else{
                        item.FundFeeDesc = '';
                        item.ChargeFeeDesc = '';
                        item.ChargeFeeUnit = '';
                    }
                }else{
                    item.MarginUnit = item.Margin;
                    item.Margin = Decimal.toFixed(Decimal.accMul(item.MarginUnit, item.Volume), product.CalcFixed);
                    item.RepayUnit = item.Repay;
                    item.Repay = Decimal.toFixed(Decimal.accMul(item.RepayUnit, item.Volume), product.CalcFixed);
                    item.FeeUnit = item.Fee;
                    item.Fee = Decimal.toFixed(Decimal.accMul(item.FeeUnit, item.Volume), product.CalcFixed);
                    //全部保证金 保证金+ 补充保证金（其中Margin=公式的“保证金”+追加保证金）
                    item.MarginTotal = String(Decimal.accAdd(item.Margin, item.Repay, 6));
                }

                item.FeeDesc = sb.sb + Decimal.toFixed(item.Fee, product.ShowFixed);
                item.PriceDesc = Decimal.toFixed(item.Price, product.AvgPriceFixed);
                item.MarginTotalDesc = sb.sb + Decimal.toFixed(item.MarginTotal, product.ShowFixed);
                item.Lever = this.formula.leverToDepositRate(item.Scale);
                //初始保证金
                item.Deposit = this.formula.deposit(item.Con, item.Volume, item.Lever, item.Price); //保证金

                if (item.hasOwnProperty("Operate")) item.OperateDesc = Intl.lang("trade.history.pOperate"+item.Operate);
                if (item.hasOwnProperty("CloseWeight")){
                    item.DealPrice = "";
                    if (Number(item.CloseWeight)){
                        item.DealPrice = Decimal.accDiv(item.Volume, item.CloseWeight, product.AvgPriceFixed);
                    }else if(item.Operate==6){
                        item.DealPrice = Intl.lang("trade.history.noForcePrice");
                    }
                }

                if (item.hasOwnProperty("RealisedPNL") && Number(item.RealisedPNL)!=0){
                    item.Profit = item.RealisedPNL;
                    item.ProfitCalc = sb.sb + Decimal.toFixed(item.Profit, product.CalcFixed);
                    item.ProfitDesc = sb.sb + Decimal.toFixed(item.Profit, product.ShowFixed);
                }

                if (itemCallback) itemCallback(item);
            }catch (e){
                console.error(e);
            }
        }
        return list;
    },
    //查找关联ID的止盈止损设置订单
    findPLRelateOrders(relateID, callback, parentType, parentItem){
        var attrs = {};
        var orders = this.orderList;

        if (orders){
            for (var i=0,l=orders.length; i<l; i++){
                try{
                    var v = orders[i];
                    //订单的止盈止损才有RID，仓位的止盈止损RID=0
                    var isRidValid = (parentType=='position' && !v.RID) || (parentType=='order' && v.RID);
                    if (v.PID==relateID && isRidValid && [CONST.FUT.Action.TP, CONST.FUT.Action.SL, CONST.FUT.Action.CLOSE].indexOf(v.Attempt)!=-1){
                        if (v.Attempt==CONST.FUT.Action.SL){
                            v.parentType = parentType;
                            v.parentDelegateValue = parentItem.delegateValue;
                            attrs.SL = {
                                Distance: !!v.Relative,
                                Param: Number(v.Constant),
                                Variable: v.Variable
                            }
                            attrs.SLorder = v;
                            if (v.Strategy==CONST.FUT.Strategy.Trail){
                                attrs.SLDesc = Number(v.Constant)+Intl.lang("trade.open.delegateOption2");
                            }else{
                                attrs.SLDesc = this.VariableTxtMap[v.Variable]+ Intl.lang(v.Side==CONST.FUT.Side.BUY?"common.symbol.ge":"common.symbol.le")+ Number(v.Constant)+ (v.Relative?Intl.lang("trade.open.delegateOption2"):'');
                            }
                        }else if(v.Attempt==CONST.FUT.Action.TP){
                            v.parentType = parentType;
                            v.parentDelegateValue = parentItem.delegateValue;
                            attrs.TP = {
                                Distance: !!v.Relative,
                                Param: Number(v.Price)
                            }
                            attrs.TPorder = v;
                            attrs.TPDesc = Number(v.Price) + (v.Relative ? Intl.lang("trade.open.delegateOption2") : '');
                        }
                        // else if(v.Attempt==CONST.FUT.Action.CLOSE){
                        //     v.parentType = parentType;
                        //     attrs.CLOSEorder = v;
                        // }
                        // else if(v.Attempt==CONST.FUT.Action.CLEAR){
                        //     attrs.CLEARorder = v;
                        // }
                    }
                    if (attrs.SL && attrs.TP && attrs.CLOSEorder){
                        break;
                    }
                }catch (e) {
                    console.error(e);
                }
            }
        }
        if (callback) callback(attrs);
    },
    //删除关联ID的止盈或止损单
    delPLRelateOrder(relateID, orderID){
        var posInfo = this.positions[relateID];
        if (posInfo){
            if (posInfo.SLorder && posInfo.SLorder.ID==orderID){
                delete posInfo.SLorder;
                delete posInfo.SL;
                delete posInfo.SLDesc;

                return true;
            }else if(posInfo.TPorder && posInfo.TPorder.ID==orderID){
                delete posInfo.TPorder;
                delete posInfo.TP;
                delete posInfo.TPDesc;

                return true;
            }else if(posInfo.CLOSEorder && posInfo.CLOSEorder.ID==orderID){
                delete posInfo.CLOSEorder;
            }
        }

        return false;
    },
    //同方向合并：
    // 只用这一栏的保证金加起来反算合并后的杠杆：
    // IM% = IM*P均/（c*n），其中IM为各仓位保证金之和，P均为合并后的均价，c为合约乘数，n为合并后持仓数量
    // 不同方向的仓位合并，先同方向的合并，然后看净持仓方向，合并后的杠杆为净持仓方向的杠杆
    //仓位合并为仓位概要
    //合并后杠杆 = （数量*乘数/均价）/合并后保证金；
    // 先做多的方向加权算均价，（1000*10000+2000*9000+2000*10500）/（1000+2000+2000） = 9800；
    // 做空的方向计算加权均价，（1000*8000+1000*8500）/（1000+1000）= 8250；
    // 合并：净多3000手，均价9800
    //Deposit 公式计算的保证金
    //MarginTotal:实际保证金
    calcPositionStat(positionOrders){
        //同方向的先加权 算净的，均价等于净持仓方向的均价
        var productsMap = {};

        var stat = {};
        var defStat = {Vols: 0, Sum:0, MarginTotal:0, delegateValue:0, Deposit:0, Price:0, Scale:0, Fee:0, ProfitLoss:0, ProfitLossMark:0, FundFee:0, OriginFee:0, ValueOriginFee:0, CoinFee:0, Coin1Fee:0, Coin2Fee:0, ValueFee:0}
        //List不能放defStat，否则会指向同一引用
        stat[CONST.TRADE.DIRECTION.BID] = Object.assign({List:[]}, defStat);
        stat[CONST.TRADE.DIRECTION.ASK] = Object.assign({List:[]}, defStat);

        this.rankInPosition = {};
        for (var i=0,len=positionOrders.length; i<len; i++){
            try{
                var order = positionOrders[i];
                if (!Number(order.Price)) continue;
                // var con = this.getCon(order.CID);
                // var product = this.getProductByID(order.CID);
                // var con = order.Con;
                // var product = order.Product;
                // var markPrice = product.price.MARK;
                // order.Mark = markPrice;
                // order.Lever = this.formula.leverToDepositRate(order.Scale);
                // order.Deposit = this.formula.deposit(con, order.Volume, order.Lever, order.Price); //保证金
                // if (markPrice) order.ProfitLoss = this.formula.plVal(order.Side, order.Price, markPrice, order.Volume, con); //盈亏
                // order.PlRate = this.formula.plRate(order.ProfitLoss, order.Deposit); //盈亏率
                this._addStatAttrToPosition(order);
                this.statPositionRank(order);

                var pd;
                if (!productsMap[order.CID]){
                    pd = Object.assign({}, stat);
                    productsMap[order.CID] = pd;
                }else{
                    pd = productsMap[order.CID];
                }

                var dStat = pd[order.Side];
                dStat.Vols += Number(order.Volume);
                if (order.Price>0 && String(order.Price).indexOf(".")==-1){
                    dStat.Sum += Number(order.Volume)*Number(order.Price);
                }else{
                    var amount = Decimal.accMul(order.Price, order.Volume);
                    dStat.Sum = Number(Decimal.accAdd(amount, dStat.Sum));
                }
                dStat.MarginTotal = Decimal.accAdd(order.MarginTotal, dStat.MarginTotal);
                dStat.Deposit = Decimal.accAdd(order.Deposit, dStat.Deposit);
                dStat.Fee = Decimal.accAdd(order.Fee, dStat.Fee);
                // dStat.IDS.push(order.ID);
                dStat.ProfitLoss = Decimal.accAdd(order.ProfitLoss||0, dStat.ProfitLoss);
                dStat.ProfitLossMark = Decimal.accAdd(order.ProfitLossMark||0, dStat.ProfitLossMark);
                dStat.delegateValue = Decimal.accAdd(order.delegateValue||0, dStat.delegateValue);
                //同方向均价
                dStat.Price = this.formula.mergeAvgPrice(dStat.Vols, dStat.delegateValue);
                //杠杆
                dStat.Scale = this.formula.depositToLever(dStat.Deposit, order.Product.Scale, dStat.Vols, dStat.Price, order.Product.ScaleFixed);


                dStat.FundFee = Decimal.accAdd(order.FundFee||0, dStat.FundFee);
                dStat.OriginFee = Decimal.accAdd(order.OriginFee||0, dStat.OriginFee);
                dStat.ValueOriginFee = Decimal.accAdd(order.ValueOriginFee||0, dStat.ValueOriginFee);
                dStat.CoinFee = Decimal.accAdd(order.CoinFee||0, dStat.CoinFee);
                dStat.Coin1Fee = Decimal.accAdd(order.Coin1Fee||0, dStat.Coin1Fee);
                dStat.Coin2Fee = Decimal.accAdd(order.Coin2Fee||0, dStat.Coin2Fee);
                dStat.ValueFee = Decimal.accAdd(order.ValueFee||0, dStat.ValueFee);

                dStat.Con = order.Con;
                dStat.Mark = order.Mark;
                dStat.List.push(order);
            }catch (e){
                console.error(e);
            }
        }

        var plTotal = {};
        var orders = [];
        // var newOrder = {ID:0, CID:0, Mark:0, Side:0, Volume:0, Scale:0, MarginTotal:0, Price:0, ProfitLoss:0, ProfitLossMark:0, Fee:0, BVOL_AVOL:"", BC_AC:""};
        //按不同合约进行合并
        for (var CID in productsMap){
            try{
                var pd = productsMap[CID];
                if (pd){
                    var ask = pd[CONST.TRADE.DIRECTION.ASK];
                    var bid = pd[CONST.TRADE.DIRECTION.BID];

                    var product = this.productIdMap[CID];
                    var sb = getCurrencySymbol(product.Currency);

                    // var order = Object.assign({}, newOrder);
                    var order = {};
                    order.Mark = ask.Mark || bid.Mark;
                    order.BVOL_AVOL = bid.Vols + '/'+ ask.Vols; //仓位数
                    order.BC_AC = bid.List.length + '_'+ ask.List.length; //订单数
                    order.List = [].concat(ask.List).concat(bid.List);
                    order.ID = order.List.map((v)=>v.ID).join("|");
                    order.CID = CID;

                    var volume = bid.Vols - ask.Vols;
                    order.Volume = Math.abs(volume);
                    order.Side = volume > 0 ? CONST.TRADE.DIRECTION.BID : (volume < 0 ? CONST.TRADE.DIRECTION.ASK : -1);

                    if (bid.Vols && ask.Vols){
                        //不同方向的合仓
                        var sideInfo = bid.Vols > ask.Vols ? bid : (ask.Vols > bid.Vols ? ask : null);
                        if (sideInfo){
                            order.Price = Decimal.toFixed(sideInfo.Price, product.PriceFixed);
                            order.Scale = Decimal.toFixed(sideInfo.Scale, product.ScaleFixed);
                            order.delegateValueDesc = sb.sb + this.formula.delegateValue(product.Scale, order.Price, order.Volume, product.ShowFixed);
                            //按比例
                            //保证金
                            order.MarginTotal = Decimal.accDiv(Decimal.accMul(sideInfo.MarginTotal, order.Volume), sideInfo.Vols);
                            order.MarginTotalDesc = sb.sb + Decimal.accDiv(Decimal.accMul(sideInfo.MarginTotal, order.Volume), sideInfo.Vols, product.ShowFixed);
                            //资金费用
                            order.FundFeeDesc = sb.sb + Decimal.accDiv(Decimal.accMul(sideInfo.FundFee, order.Volume), sideInfo.Vols, product.ShowFixed);
                            //手续费
                            order.OriginFee = Decimal.accDiv(Decimal.accMul(sideInfo.OriginFee, order.Volume), sideInfo.Vols);
                            order.ValueOriginFee = Decimal.accDiv(Decimal.accMul(sideInfo.ValueOriginFee, order.Volume), sideInfo.Vols);
                            order.CoinFee = Decimal.accDiv(Decimal.accMul(sideInfo.CoinFee, order.Volume), sideInfo.Vols);
                            order.Coin1Fee = Decimal.accDiv(Decimal.accMul(sideInfo.Coin1Fee, order.Volume), sideInfo.Vols);
                            order.Coin2Fee = Decimal.accDiv(Decimal.accMul(sideInfo.Coin2Fee, order.Volume), sideInfo.Vols);
                            order.ValueFee = Decimal.accDiv(Decimal.accMul(sideInfo.ValueFee, order.Volume), sideInfo.Vols);

                            if (Number(order.Coin1Fee)==0 && Number(order.Coin2Fee)==0){//BTC
                                order.ChargeFee = order.CoinFee;
                                order.ChargeFeeDesc = Decimal.toFixed(order.ChargeFee, product.ShowFixed);
                                order.ChargeFeeUnit = sb.sn;
                                if (Number(order.ChargeFee)<Number(order.OriginFee)){
                                    order.ChargeFeeOriginDesc = Decimal.toFixed(order.OriginFee, product.ShowFixed);
                                }
                            }else{ //TD
                                var tdInfo = Product.getCoinInfo(CONST.CURRENCY.TD);
                                var fixed = tdInfo ? tdInfo.ShowDigits : 0;
                                order.ChargeFee = Decimal.accAdd(Decimal.accAdd(order.Coin1Fee, order.Coin2Fee), order.ValueFee);
                                order.ChargeFeeDesc = Decimal.toFixed(order.ChargeFee, fixed);
                                order.ChargeFeeUnit = tdInfo ? tdInfo.Code : '';
                                if (Number(order.ChargeFee)<Number(order.ValueOriginFee)){
                                    order.ChargeFeeOriginDesc = Decimal.toFixed(order.ValueOriginFee, fixed);
                                }
                            }
                            //盈亏
                            order.ProfitLoss = String(this.formula.plVal(order.Side, order.Price, product.price.LAST, order.Volume, product.Scale));
                            order.PlRate = Number(order.MarginTotal)>0 ? this.formula.plRate(order.ProfitLoss, order.MarginTotal) : 0;
                            order.ProfitLossDesc = sb.sb+Decimal.toFixed(order.ProfitLoss, product.ShowFixed)+"("+String(Decimal.toPercent(order.PlRate, 2))+")";

                            order.ProfitLossMark = String(this.formula.plVal(order.Side, order.Price, product.price.MARK, order.Volume, product.Scale));
                            order.PlRateMark = Number(order.MarginTotal)>0 ? this.formula.plRate(order.ProfitLossMark, order.MarginTotal) : 0;
                            order.ProfitLossMarkDesc = sb.sb+Decimal.toFixed(order.ProfitLossMark, product.ShowFixed)+"("+String(Decimal.toPercent(order.PlRateMark, 2))+")";
                        }else{ //相等时， 全部没有
                            order.Price = '0';
                            order.ScaleTxt = '0';
                            order.delegateValueDesc = '0'
                            order.MarginTotalDesc = '0';
                            order.FundFeeDesc = '0';
                            order.ChargeFeeUnit = '';
                            order.ChargeFeeDesc = '0';
                            order.ProfitLossDesc = '0';
                            order.ProfitLossMarkDesc = '0';
                        }
                    }else {
                        //只有单边 bid 或者 ask 有仓位
                        var sideInfo = bid.Vols ? bid : ask;
                        for (var key in sideInfo){
                            if (!order.hasOwnProperty(key)){
                                order[key] = sideInfo[key];
                            }
                        }
                        order.Price = Decimal.toFixed(order.Price, product.AvgPriceFixed);
                        order.delegateValueDesc = sb.sb + Decimal.toFixed(order.delegateValue, product.ShowFixed);
                        order.MarginTotalDesc = sb.sb + Decimal.toFixed(order.MarginTotal, product.ShowFixed);
                        order.FundFeeDesc = sb.sb + Decimal.toFixed(order.FundFee, product.ShowFixed);

                        if (Number(order.Coin1Fee)==0 && Number(order.Coin2Fee)==0){//BTC
                            order.ChargeFee = order.CoinFee;
                            order.ChargeFeeDesc = Decimal.toFixed(order.ChargeFee, product.ShowFixed);
                            order.ChargeFeeUnit = sb.sn;
                            if (Number(order.ChargeFee)<Number(order.OriginFee)){
                                order.ChargeFeeOriginDesc = Decimal.toFixed(order.OriginFee, product.ShowFixed);
                            }
                        }else{ //TD
                            var tdInfo = Product.getCoinInfo(CONST.CURRENCY.TD);
                            order.ChargeFee = Decimal.accAdd(Decimal.accAdd(order.Coin1Fee, order.Coin2Fee), order.ValueFee);
                            order.ChargeFeeDesc = Decimal.toFixed(order.ChargeFee, tdInfo.ShowDigits);
                            order.ChargeFeeUnit = tdInfo.Code;
                            if (Number(order.ChargeFee)<Number(order.ValueOriginFee)){
                                order.ChargeFeeOriginDesc = Decimal.toFixed(order.ValueOriginFee, tdInfo.ShowDigits);
                            }
                        }

                        order.PlRate = Number(order.MarginTotal)>0 ? this.formula.plRate(order.ProfitLoss, order.MarginTotal) : 0;
                        order.ProfitLossDesc = sb.sb+Decimal.toFixed(order.ProfitLoss, product.ShowFixed)+"("+String(Decimal.toPercent(order.PlRate, 2))+")";

                        order.PlRateMark = Number(order.MarginTotal)>0 ? this.formula.plRate(order.ProfitLossMark, order.MarginTotal) : 0;
                        order.ProfitLossMarkDesc = sb.sb+Decimal.toFixed(order.ProfitLossMark, product.ShowFixed)+"("+String(Decimal.toPercent(order.PlRateMark, 2))+")";
                    }

                    this._addCommonAttrToTradeItem(order, 'position');
                    orders.push(order);

                    // order.MarginTotal = String(Decimal.accAdd(bid.MarginTotal, ask.MarginTotal));
                    //
                    //
                    // order.MarginTotalDesc = sb.sb+Decimal.toFixed(order.MarginTotal, product.ShowFixed);
                    // order.Price = String(volume > 0 ? Decimal.accDiv(bid.Sum, bid.Vols, product.PriceFixed) : (volume < 0 ? Decimal.accDiv(ask.Sum, ask.Vols, product.PriceFixed) : Decimal.accDiv(Decimal.accAdd(Decimal.accDiv(bid.Sum, bid.Vols), Decimal.accDiv(ask.Sum, ask.Vols)), 2, product.PriceFixed)));
                    // order.delegateValueDesc = sb.sb+Decimal.toFixed(Decimal.accAdd(ask.delegateValue, bid.delegateValue), product.ShowFixed);
                    //
                    //
                    //
                    // order.Fee = Decimal.accAdd(bid.Fee, ask.Fee);
                    // order.FeeDesc = sb.sb+Decimal.toFixed(order.Fee, product.ShowFixed);
                    //
                    // order.FundFee = Decimal.accAdd(bid.FundFee, ask.FundFee);
                    // order.OriginFee = Decimal.accAdd(bid.OriginFee, ask.OriginFee);
                    // order.ValueOriginFee = Decimal.accAdd(bid.ValueOriginFee, ask.ValueOriginFee);
                    // order.CoinFee = Decimal.accAdd(bid.CoinFee, ask.CoinFee);
                    // order.Coin1Fee = Decimal.accAdd(bid.Coin1Fee, ask.Coin1Fee);
                    // order.Coin2Fee = Decimal.accAdd(bid.Coin2Fee, ask.Coin2Fee);
                    // order.ValueFee = Decimal.accAdd(bid.ValueFee, ask.ValueFee);
                    // //资金费用
                    // order.FundFeeDesc = sb.sb + Decimal.toFixed(order.FundFee, product.ShowFixed);
                    // //手续费
                    // if (Number(order.Coin1Fee)==0 && Number(order.Coin2Fee)==0){//BTC
                    //     order.ChargeFee = order.CoinFee;
                    //     order.ChargeFeeDesc = Decimal.toFixed(order.ChargeFee, product.ShowFixed);
                    //     order.ChargeFeeUnit = sb.sn;
                    //     if (Number(order.ChargeFee)<Number(order.OriginFee)){
                    //         order.ChargeFeeOriginDesc = Decimal.toFixed(order.OriginFee, product.ShowFixed);
                    //     }
                    // }else{ //TD
                    //     var tdInfo = Product.getCoinInfo(CONST.CURRENCY.TD);
                    //     order.ChargeFee = Decimal.accAdd(Decimal.accAdd(order.Coin1Fee, order.Coin2Fee), order.ValueFee);
                    //     order.ChargeFeeDesc = Decimal.toFixed(order.ChargeFee, tdInfo.ShowDigits);
                    //     order.ChargeFeeUnit = tdInfo.Code;
                    //     if (Number(order.ChargeFee)<Number(order.ValueOriginFee)){
                    //         order.ChargeFeeOriginDesc = Decimal.toFixed(order.ValueOriginFee, tdInfo.ShowDigits);
                    //     }
                    // }

                    var fee = Decimal.accAdd(bid.Fee, ask.Fee);
                    // var marginTotal = Decimal.accAdd(bid.MarginTotal, ask.MarginTotal);
                    var profitLoss = String(Decimal.accAdd(bid.ProfitLoss, ask.ProfitLoss));
                    var profitLossMark = String(Decimal.accAdd(bid.ProfitLossMark, ask.ProfitLossMark));

                    var plInfo = {pl:0, plm:0, volume:0};
                    //总盈亏 价格的盈亏-费用
                    plInfo.pl = Decimal.accSubtr(profitLoss, fee);
                    plInfo.plm = Decimal.accSubtr(profitLossMark, fee);
                    // plInfo.margin = String(marginTotal);
                    //计算维持保证金需用到
                    plInfo.volume = ask.Vols + bid.Vols;
                    plTotal[product.ID] = plInfo;


                    // var deposit = Decimal.accAdd(bid.Deposit, ask.Deposit);
                    // if (volume>0){
                    //     if (bid.Con) order.Scale = this.formula.depositToLever(bid.Deposit, bid.Con, bid.Vols, Decimal.accDiv(bid.Sum, bid.Vols), product.ScaleFixed);
                    // }else{
                    //     if (ask.Con) order.Scale = this.formula.depositToLever(ask.Deposit, ask.Con, ask.Vols, Decimal.accDiv(ask.Sum, ask.Vols), product.ScaleFixed);
                    // }
                    // if (ask.Con) order.Scale = this.formula.depositToLever(deposit, ask.Con, bid.Vols + ask.Vols, order.Price, product.ScaleFixed);


                    // order.PlRate = this.formula.plRate(order.ProfitLoss, order.MarginTotal);

                }
            }catch (e){
                console.error(e);
            }
        }
        this.posSummaryList = orders;

        this.plTotal = plTotal;
    },
    statPositionRank(order){
        var oldIndex = -1;
        if (!this.rankInPosition.hasOwnProperty(order.CID)){
            this.rankInPosition[order.CID] = -1;
        }else{
            oldIndex = this.rankInPosition[order.CID];
        }
        if (order.hasOwnProperty("Index")){
            if (!this.rankInPosition.hasOwnProperty(order.CID)) this.rankInPosition[order.CID] = order.Index;
            else this.rankInPosition[order.CID] = Math.max(oldIndex, order.Index);
        }
    },
    saveSetting(key, value){
        this.initLoadSetting();

        if (this.setting[key]!=value){
            this.setting[key] = value;

            AuthModel.savePreference('fut-setting', this.setting);

            var data = {};
            data[key] = value;

            if (key=='sellMDepth' || key=='buyMDepth') this.updateMergeDepth(key);

            Event.dispatch(Event.EventName.SETTING_UPDATE, data);
        }
    },
    loadSetting(key){
        this.initLoadSetting();

        return this.setting[key] || this.defaultSetting[key];
    },
    getSkin(){
        return AuthModel.loadPreference('klineTheme') || this.skinMore[0];
    },
    getRankInPosition(CID){
        return this.rankInPosition.hasOwnProperty(CID) ? this.rankInPosition[CID]:-1;
    },
    //调整产品列表数据
    adjustProductListData(data){
        var self = this;

        var oldProductIdMap = this.productIdMap;
        var oldProductMap = this.productMap;

        this.codeList = [];
        this.productIdMap = {};
        this.productMap = {};
        this.productList = [];

        for (var i=0,len=data.length; i<len; i++){
            try{
                var pitem = data[i];

                // var newCode = this.getNewCode(pitem.Code, pitem.Month);
                var npitem = oldProductIdMap[pitem.ID];
                if (npitem){
                    npitem.update(pitem);
                    //npitem = Object.assign(npitem, pitem);
                }else{
                    npitem = new FutProduct(pitem);
                }
                var code = pitem.Code;
                npitem.Name = code;
                npitem.Type = 7; //默认7
                var fromCode = code.substr(0, 3);
                var cs = getCurrencySymbol(pitem.Coin);
                if (cs){
                    npitem.fromCode = cs.sn; //兼容现货的
                    npitem.toCode = code.replace(cs.sn, ''); //兼容现货的
                }
                npitem.Currency = pitem.Coin;
                // npitem.QueryCode = `${CONST.CODE.FUT}-${code}`;

                var UnitPriceStr = String(pitem.UnitPrice);
                npitem.PriceFixed = UnitPriceStr.lastIndexOf(".") < 0?0:UnitPriceStr.substring(UnitPriceStr.lastIndexOf(".")+1).length;
                var MinVolume = String(pitem.MinVolume);
                npitem.VolFixed = MinVolume.lastIndexOf(".") < 0?0:MinVolume.substring(MinVolume.lastIndexOf(".")+1).length;; //

                var supplyAttrs = this.supplyAttrs[code];
                if (supplyAttrs){
                    for (var key in supplyAttrs){
                        npitem[key] = supplyAttrs[key];
                    }
                }

                if (!this.depthMap[code]){
                    var priceFixed = npitem.PriceFixed;
                    var list = [];
                    var count = 3;
                    while (count > 0 && priceFixed>=0){
                        list.push(priceFixed);
                        priceFixed--;
                        count--;
                    }
                    this.depthMap[code] = list;
                }

                npitem.RealCode = pitem.Code; //没有月份的code
                npitem.Code = pitem.Code;        //有月份的code
                npitem.RealCurrency = pitem.Currency;
                npitem.DisplayName = npitem.RealCode;
                //强平价最大的阈值
                npitem.LimitSecurity = pitem.LimitSecurity || "0.1";

                var risks = pitem.Risks;
                if (typeof(pitem.Risks)=='string'){
                    risks = JSON.parse(pitem.Risks);
                }
                if (risks.hasOwnProperty("length")){
                    var newRisks = {}
                    risks.forEach((v)=>{
                        newRisks[v.Level] = v.Value;
                    });
                    npitem.Risks = newRisks;
                }else{
                    npitem.Risks = risks;
                }


                // npitem.Lever = JSON.parse(pitem.Lever);

                // this.updateMaxAmount(npitem, cinfo);

                // var cps = pitem.CommissionPoints.split(',');
                // //console.log(item.Code, pitem.CommissionPoints);
                // npitem.BIDComm = parseFloat(cps[0]);
                // npitem.ASKComm = parseFloat(cps[1]);
                //
                // npitem.BIDCps = Decimal.accDiv(parseFloat(cps[0]), parseFloat(npitem.UnitPrice));
                // npitem.ASKCps = Decimal.accDiv(parseFloat(cps[1]), parseFloat(npitem.UnitPrice));

                this.productIdMap[pitem.ID] = npitem;

                if (!this.productMap[code]){
                    var price = Object.assign({}, this.defaultPrices);
                    npitem.price = price;

                    //保证引用也随着改变
                    var oldProducts = oldProductMap[code];
                    if (oldProducts){
                        oldProducts.length = 0;
                    }else{
                        oldProducts = [];
                    }
                    oldProducts.push(npitem);

                    this.productMap[code] = oldProducts;
                    this.codeList.push(code);
                    this._priceMap[code] = price;

                    this.productList.push(oldProducts);
                }else{
                    npitem.price = this._priceMap[code];
                    this.productMap[code].push(npitem);
                }
            }catch(e){
                console.log(pitem);
                console.error(e);
            }
        }

        //初始化监听
        this.initSocketListener();
        //当前code  当前深度
        if (!this.currCode){
            this.currCode = this.codeList[0];
        }
        if (!this.currDepth){
            var depthList = this.getDepthList(this.currCode);
            if (depthList) this.currDepth = depthList[0];
        }

        // Event.dispatch(Event.EventName.PRODUCT_UPDATE, this.productMap);
    },
    //检测订单或仓位属性是否能修改
    // 杠杆：只有开仓单才可以
    // 数量：只有开仓单才可以 并且 数量不能低于以成交量
    // 价距：没有触发的订单才可以
    // 价格：没有触发的订单才可以
    // 以买一卖一价进入订单薄：没有触发的订单才可以
    // 时效性、时效参数：无限制
    // 策略：没有触发的订单才可以
    // 变量：没有触发的订单才可以
    // 常量：没有触发的订单才可以
    // 常量为相对值：未激活才可以（目前只有开仓单关联的止损止盈单）(开仓单设置的止损止盈，因为没有对应仓位存在，所有订单没有激活执行。)
    // 被动性：没有触发的订单才可以
    // 可见性：无限制
    checkCanModify(row, attr){
        if (row.PID){ //订单
            if (["Scale", "Volume"].indexOf(attr)!=-1 && row.Attempt!=CONST.FUT.Action.OPEN){
                return false;
            }
            // "TriggerPrice", "PriceDistance"
            if (["Distance", "Price", "Better", "Strategy", "Variable", "Constant", "Relative", "Passive"].indexOf(attr)!=-1 && row.State >= CONST.FUT.State.TRIGGERRED){
                return false;
            }
        }else{ //仓位
            // "Volume", "ScaleTxt", "MarginTotal", "Force", "SLDesc", "TPDesc"
        }

        return true;
    },
    // 杠杆调节，只能在0-20倍；
    // 仓位保证金可以增加或减少，但减少后的杠杆不能高于20倍；
    // 同理，强平价格可以上下调整，但调整后的杠杆不能高于20倍。

    // 减少保证金的处理逻辑：（直接减保证金或者修改强平价）
    // 减少保证金时，先减追加保证金，然后减补足保证金，这两个减的时候仓位杠杆不变，但这两个减完后的保证金要大于仓位价值的2%（即高于维持保证金1%的一倍）；
    // 最后减初始保证金，初始保证金的减少不能导致杠杆大于20倍。

    //检查仓位修改的数值范围是否正确
    checkPosAttrRange(order, attr){
        var err = [];
        if (attr.hasOwnProperty("Scale")){
            var scale = attr.Scale;
            if (scale<=0 || scale>20){
                err.push(Intl.lang("trade.editRange.scale", 0, 20));
            }
        }
        //修改强平价
        if (attr.hasOwnProperty("Force")){
            var force = attr.Force;
            //相当于减少保证金
            if (order.Side==CONST.FUT.Side.BUY && Number(force)>order.Force || order.Side==CONST.FUT.Side.SELL && Number(force)<order.Force){
                var newForce = this.formula.getForceRange(this.getCon(order.CID), order.Volume, order.Side, order.Price, order.Deposit, Decimal.accSubtr(order.Margin, order.Deposit), order.Repay, order.Fee, this.getRisks(order.CID), 8);
                if (order.Side==CONST.FUT.Side.BUY && force>newForce){
                    err.push(Intl.lang("trade.editRange.maxForce", newForce));
                }else if(order.Side==CONST.FUT.Side.SELL && force<newForce){
                    err.push(Intl.lang("trade.editRange.minForce", newForce));
                }
            }
        }

        return err;
    },
    //产品列表改变
    // onUpdateProductList(data){
    //     if (data){
    //
    //     }
    // },
    initSocketListener(){
        var self = this;

        if (!this.isInitedListener){
            console.log("initSocketListener");

            WsMgr.on('tick_fut', this.onUpdatePrice.bind(this));
            WsMgr.on('depth_fut', this.onUpdateDepth.bind(this));
            WsMgr.on('trade_fut', this.onUpdateTrade.bind(this));
            // WsMgr.on('forward', this.onUpdateForward.bind(this));
            WsMgr.on('contract', this.onUpdateContract.bind(this));

            //订单变化
            WsMgr.on('futures_order', this.onUpdateOrderData.bind(this));
            WsMgr.on('futures_position', this.onUpdatePositionData.bind(this));
            WsMgr.on('futures_index', this.onUpdateRank.bind(this));

            //挖矿精灵
            WsMgr.on('mining_open', this.onUpdateMiningData.bind(this, 'open'));
            WsMgr.on('mining_close', this.onUpdateMiningData.bind(this, 'close'));
            WsMgr.on('mining_autoclose', this.onUpdateMiningData.bind(this, 'autoclose'));
            //监听产品佣金变化
            // WsMgr.on('Product_fut', function (obj) {
            //
            // });

            //产品最大手数变化
            // WsMgr.on('MaxAmount_fut', function (obj) {
            //
            // });

            //
            // WsMgr.on('Interests_fut', function (obj) {
            //
            // });

            WsMgr.setFutSpotTradeModel(this);

            this.isInitedListener = true;
        }
    },
    onUpdatePrice(data){
        if (this.testNoPrice) return;
        //self.isLoadingPrice = false;
        if (typeof data == "string") data = JSON.parse(data);

        var lastPriceUpdated = false;
        var priceUpdateMap = {};
        for (var key in data){
            var name = key;

            var info = this._priceMap[name];
            if (!info) continue;

            var oldLast = info.LAST;
            Object.assign(info, data[key]);

            info.ASK = Number(info.ASK)<=0 ? 0 : Decimal.toFixed(info.ASK, info.PriceFixed);
            info.BID = Number(info.BID)<=0 ? 0 : Decimal.toFixed(info.BID, info.PriceFixed);
            if (this.setting["sellMDepth"]==1){
                info.ASK_M = info.ASK;
            }
            if (this.setting["buyMDepth"]==1){
                info.BID_M = info.BID;
            }

            if (info.LAST && Number(info.LAST)>0){
                if(info.OPEN && Number(info.OPEN)>0){
                    info.CLOSE = info.OPEN;
                }
                else if (info.CLOSE && Number(info.CLOSE)>0){
                    if (!info.OPEN || Number(info.OPEN)<=0){
                        info.OPEN = info.CLOSE;
                    }
                }

                //涨跌额
                info.change = Decimal.accSubtr(info.LAST, info.CLOSE, (info.LAST).toString().indexOf('.')>0?(info.LAST).toString().length-(info.LAST).toString().indexOf('.')-1:0);
                //涨跌幅
                info.chg = Number(info.CLOSE)>0 ? Decimal.accMul(Decimal.accDiv(info.change, info.CLOSE), '100', 2) : 0;
            }

            var products = this.getProduct(name);
            var minPrice = products[0].UnitPrice;
            //生成一个中间价
            info.MID = Number(Decimal.accMul(Decimal.accDiv(Decimal.accDiv(Decimal.accAdd(info.ASK, info.BID), 2), minPrice, 0), minPrice));
            //限价的价格
            info.LMT = Number(Decimal.accAdd(info.MID, minPrice));
            // //标记价格
            // info.MARK = info.MID;
            // //指数价格
            // info.INDEX = info.MARK;
            //最新价有改变
            var isLastChange = Number(Decimal.accSubtr(info.LAST, oldLast));
            info.LAST_CHANGED = isLastChange;

            if (isLastChange){
                lastPriceUpdated = true;
            }

            priceUpdateMap[name] = info;
            // console.log(JSON.stringify(info));
            // Event.dispatch(Event.EventName.FUT_PRODUCT_PRICE_UPDATE, info);
        }

        Event.dispatch(Event.EventName.PRICE_UPDATE, priceUpdateMap);

        //最新价更新，部分订单要重新计算
        if (lastPriceUpdated){
            this.updateOrderList();
            this.updatePositionList();
        }
    },
    onUpdateDepth(data){
        if (this.testNoPrice) return;

        if (typeof data == "string") data = JSON.parse(data);

        var priceUpdateMap = {};
        for (var key in data){
            var name = key;

            var info = this._priceMap[name];
            if (!info) continue;

            Object.assign(info, data[key]);

            var max = 0;
            for (var k in info){
                if (k.indexOf("_")==-1 && (k.indexOf("AVOL")!=-1 || k.indexOf("BVOL")!=-1)){
                    max = Math.max(max, Number(info[k]));
                }
            }
            info.VOL_MAX = max;

            if (this.setting["sellMDepth"]){
                this.calcMergeDepth(name, 'ASK', info, this.setting["sellMDepth"]);
            }
            if (this.setting["buyMDepth"]){
                this.calcMergeDepth(name, 'BID', info, this.setting["buyMDepth"]);
            }

            priceUpdateMap[name] = info;
        }

        Event.dispatch(Event.EventName.DEPTH_UPDATE, priceUpdateMap);
    },
    updateMergeDepth(type){
        for (var name in this._priceMap){
            var info = this._priceMap[name];

            if (type=='sellMDepth'){
                this.calcMergeDepth(name, 'ASK', info, this.setting["sellMDepth"]);
            }else if(type=='buyMDepth'){
                this.calcMergeDepth(name, 'BID', info, this.setting["buyMDepth"]);
            }
        }
    },
    onUpdateContract(data){
        if (this.testNoPrice) return;

        var code = data.symbol;
        var priceUpdateMap = {};
        var contract = data.data;

        if (this._priceMap[code]){
            var info = this._priceMap[code];
            var oldMark = info["MARK"];

            for (var key in contract){
                var val = contract[key];
                if (val=='<nil>') continue;

                if (key=='FundingTimestamp'){
                    info[this.contractKeyMap[key]] = moment(val).valueOf();
                }
                else if(key=='OpenInterest' || key=='Turnover24h'){
                    var product = this.productMap[code];
                    if (product && product[0])info[this.contractKeyMap[key]] = Decimal.toFixed(val||"0", product[0].VolFixed);
                }
                // else if(key=='FundingRate'){
                //     info[this.contractKeyMap[key]] = String(new Decimal(contract[key]));
                // }
                else if(this.contractKeyMap[key]){
                    info[this.contractKeyMap[key]] = val;
                }
            }

            priceUpdateMap[code] = info;

            if (info["MARK"] && oldMark!=info["MARK"]){
                //console.log(info["MARK"]);
                //var startTime = new Date().getTime();
                this.updateOrderList();
                //var t1 = new Date().getTime();
                //console.log("call fut updateOrderList "+(t1-startTime)+"ms");
                this.updatePositionList();
            }

            Event.dispatch(Event.EventName.PRICE_UPDATE, priceUpdateMap);
        }
    },
    //加权均价和累积数量
    calcMergeDepth(name, type, info, depth){
        var volType = type=='ASK' ? 'AVOL' : 'BVOL';

        if (depth == 1){
            info[type+'_M'] = info[type];
            info[volType+'_M'] = info[volType+'1'];
        }else{
            var cur = 1;
            var max = Number(depth);

            var volTotal = 0;
            var sum = 0;

            while (cur <= max){
                sum = Decimal.accAdd(Decimal.accMul(info[type+cur], info[volType+cur]), sum);
                volTotal = Decimal.accAdd(info[volType+cur], volTotal);

                cur++;
            }
            info[volType+'_M'] = String(volTotal);

            if (Number(volTotal)){
                var products = this.getProduct(name);
                var minPrice = products[0].UnitPrice;

                info[type+'_M'] = String(Decimal.accMul(Decimal.accDiv(Decimal.accDiv(sum, volTotal), minPrice, 0), minPrice));
            }else{
                info[type+'_M'] = 0;
            }
        }
    },
    // onUpdateOrders(){
    //     Event.dispatch(Event.EventName.FUT_ORDER_UPDATE);
    // },
    onUpdateTrade(data){
        if (this.testNoPrice) return;

        var code = data.symbol;
        var map = {};
        //时间递减
        var list = data.data.map((v)=>Object.assign({LastPrice:0, Volume:0, Side:"0", Time:"0"},v));
        map[code] = list;
        // var len = list.length;
        // console.log(JSON.stringify(list.map((v)=>{
        //     v.Time = moment(Number(v.Time)).format("HH:mm:ss");
        //     return v;
        // })));

        //this.tradeMap[code] = data.data;

        var tList = this.tradeMap[code];
        if(tList){
            var newList = list.concat(tList);
            newList.splice(WsMgr.maxVolume);
            map[code] = newList;
            this.tradeMap[code] = newList;
        }else{
            this.tradeMap[code] = list;
        }

        Event.dispatch(Event.EventName.TRADE_UPDATE, map);
    },
    selectCode(code, updateMgr){
        if (updateMgr){
            var products = this.getProduct(code);
            if (products)this._mgr.setCurrProduct(products[0]);
        }

        // if (this.currCode!=code){
        this.currCode = code;
        var depthList = this.getDepthList(code);
        if (depthList && depthList.indexOf(this.currDepth)==-1){
            this.currDepth = depthList[0];
        }

        if (AuthModel.checkUserAuth())this.loadSchemeByCode(code);

        this.subscribeWs();

        Event.dispatch(Event.EventName.PRODUCT_SELECT, code);
        // }
    },
    unselectCode(){
        WsMgr.unsubDepth(this.currCode);
        WsMgr.unsubTrade(this.currCode);
        WsMgr.unsubContract(this.currCode);
    },
    subscribeWs(){
        WsMgr.subscribeDepth(this.currCode, !this.currDepth ? undefined : this.currDepth);
        WsMgr.subscribeTrade(this.currCode);
        WsMgr.subscribeContract(this.currCode);
    },
    // updateMaxAmount: function(npitem, cinfo){
    //     if (!cinfo) cinfo = this.getClientProductInfo(npitem.Currency, npitem.RealCode);
    //
    //     if (npitem.MaxAmount){
    //         var malist = npitem.MaxAmount.split('|');
    //         npitem.OpenMinMaxAmountList = [cinfo.OpenMinMaxAmount?cinfo.OpenMinMaxAmountList[0]:"1", malist[0]];
    //
    //         if (malist[1]){
    //             npitem.CloseMinMaxAmountList = [cinfo.CloseMinMaxAmount && cinfo.CloseMinMaxAmountList[0]?cinfo.CloseMinMaxAmountList[0]:"1", malist[1]];
    //         }else{
    //             npitem.CloseMinMaxAmountList = [];
    //         }
    //
    //         if (!cinfo.OpenMinMaxAmountList){
    //             cinfo.OpenMinMaxAmountList = npitem.OpenMinMaxAmountList;
    //             cinfo.CloseMinMaxAmountList = npitem.CloseMinMaxAmountList;
    //         }
    //     }else{
    //         //兼容旧方式
    //         if (!npitem.OpenMinMaxAmountList) npitem.OpenMinMaxAmountList = cinfo.OpenMinMaxAmountList;
    //         if (!npitem.CloseMinMaxAmountList) npitem.CloseMinMaxAmountList = cinfo.CloseMinMaxAmountList;
    //     }
    // },
    // onUpdateForward(data){
    //     var symbol = data.symbol;
    //     var last = data.last;
    //     this.forwardMap[symbol] = last;
    //
    //     if (this.forwardMap["USDCNH"]>0){
    //         this.exchangeRateMap["USD"] = this.forwardMap["USDCNH"];
    //
    //         // if (this.forwardMap["BTCUSD"]>0){
    //         //     this.exchangeRateMap["BTC"] = Decimal.accMul(this.forwardMap["BTCUSD"], this.forwardMap["USDCNH"]);
    //         // }
    //         // if(this.forwardMap["ETHUSD"]>0){
    //         //     this.exchangeRateMap["ETH"] = Decimal.accMul(this.forwardMap["ETHUSD"], this.forwardMap["USDCNH"]);
    //         // }
    //     }
    // },
    parseOrderToText(data, isOpenNew){
        if (data.hasOwnProperty("Scale")) data.Scale = Number(data.Scale);
        if (data.hasOwnProperty("Constant")) data.Constant = Number(data.Constant);

        var product = this.getProductByID(data.CID);
        var list = [];
        list.push(Intl.lang(data.Scale>0?"trade.order.preview_main":"trade.order.preview_main2", Number(data.Scale), Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "trade.open.buy" : "trade.open.sell"), Number(data.Volume), product.Code));
        //下单时没有Kind属性
        var isLimit = false;
        if (data.hasOwnProperty("Kind")){
            isLimit = data.Kind==CONST.FUT.Kind.LMT;
        }else{
            isLimit = data.Price != 0;
        }

        if (isLimit){
            list.push(Intl.lang("trade.order.preview_limit_detail", Number(data.Price), data.Distance ? Intl.lang("trade.open.delegateOption2"):''));
            if (!data.Passive){
                if (data.Visible>=0){
                    list.push(Intl.lang(data.Visible==0?"trade.order.preview_hideDelegate":"trade.order.preview_showDelegate", Number(data.Visible)))
                }
            }else{
                list.push(Intl.lang("trade.open.beidong"));
            }
            list.push(Intl.lang("trade.order.preview_expire"+data.Timely, (data.Timely==CONST.FUT.Timely.DEADLINE ? SysTime.ts2Server(data.TimelyParam, "MM-DD HH:mm:ss") : Number(Decimal.accDiv(data.TimelyParam, 60, 2)))));
            if ((data.Attempt==CONST.FUT.Action.TP || data.Attempt==CONST.FUT.Action.SL) && data.Strategy!=CONST.FUT.Strategy.Trail){
                list.push(Intl.lang("trade.order.Strategy10"));
            }else{
                list.push(data.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy10'):Intl.lang(data.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy11':'trade.order.Strategy12'));
            }
        }else{
            // list.push(Intl.lang("trade.open.condition1"));
            if ((data.Attempt==CONST.FUT.Action.TP || data.Attempt==CONST.FUT.Action.SL) && data.Strategy!=CONST.FUT.Strategy.Trail){
                list.push(Intl.lang("trade.order.Strategy00"));
            }else{
                list.push(data.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy00'):Intl.lang(data.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy01':'trade.order.Strategy02'));
            }
        }

        //触发价
        if (data.Strategy!=CONST.FUT.Strategy.Immediate){
            if(data.Attempt==CONST.FUT.Action.SL && data.Strategy==CONST.FUT.Strategy.Trail){
                list.push(Intl.lang("trade.order.preview_trigger", Number(data.Constant) + Intl.lang("trade.open.delegateOption2")));
            }else{
                list.push(Intl.lang("trade.order.preview_trigger", this.VariableTxtMap[data.Variable]+ Intl.lang((data.Side==CONST.FUT.Side.BUY && data.Attempt!=CONST.FUT.Action.TP || data.Side==CONST.FUT.Side.SELL && data.Attempt==CONST.FUT.Action.TP) ?"common.symbol.ge":"common.symbol.le")+Number(data.Constant)));
            }
        }

        if (isOpenNew){
            //保证金
            var con = this.getCon(data.CID);
            const sb = getCurrencySymbol(product.Currency);
            const {deposit, repay} = this.formula.unitOrderFee(isLimit, data.Side, con, data.Scale, product.price, data.Price, product.TakerFee, false);
            var depositTotal = Decimal.accMul(Decimal.accAdd(deposit, repay), data.Volume, product.ShowFixed);
            list.push(Intl.lang("trade.order.preview_margin", `${depositTotal} ${sb.sn}`));

            //预期强平
            var price = data.Side==CONST.FUT.Side.BUY ? product.price.ASK : product.price.BID;
            var stat = this.getProductPosStat(data.CID);
            if (stat){
                var posTotalVolume = stat.volume + data.Volume;
                //side, con, delegatePrice, askbid, volume, lever, mark, takerFeeRate, posTotalVolume, risks, scale
                var expectForce = this.formula.expectForce(data.Side, this.getCon(data.CID), data.Price, price, data.Volume, data.Scale, product.price.MARK, product.TakerFee, posTotalVolume, product.Risks, product.AvgPriceFixed);
                list.push(Intl.lang("trade.order.preview_expectForce", expectForce));
            }
        }

        if (data.SL){
            var info = data.SL;
            list.push(Intl.lang("trade.order.preview_loss",
                Intl.lang(info.Distance ? "trade.open.lossProfitOption1" : "trade.open.lossProfitOption2"),
                Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "common.symbol.le" : "common.symbol.ge"),
                Number(info.Param)));
        }
        if (data.TP){
            var info = data.TP;
            list.push(Intl.lang("trade.order.preview_profit",
                Intl.lang(info.Distance ? "trade.open.lossProfitOption1" : "trade.open.lossProfitOption2"),
                Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "common.symbol.ge" : "common.symbol.le"),
                Number(info.Param)));
        }

        return list;
    },
    //解析仓位数据
    parsePositionToText(data){
        var product = this.getProductByID(data.CID);
        var list = [];
        list.push(Intl.lang("trade.order.preview_position", product.Code, Number(data.Scale), Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "trade.open.buy" : "trade.open.sell"), Number(data.Volume), Decimal.toFixed(Number(data.Price))));

        return list;
    },
    //解析仓位的成交通知数据
    parsePosOrderToText(data){
        var product = this.getProductByID(data.CID);
        var list = [];
        list.push(Intl.lang("trade.order.preview_position2", product.Code, Number(data.Scale), Intl.lang(data.Side==CONST.TRADE.DIRECTION.BID ? "trade.open.buy" : "trade.open.sell"), Number(data.XVolume), Decimal.toFixed(Number(data.FinalPrice))));

        return list;
    },
    getTypeList(){
        return this.typeList
    },
    getCodeList(){
        return this.codeList;
    },
    getDepthList(code){
        return this.depthMap[code];
    },
    getTradeInfo(code){
        return this.tradeMap[code];
    },
    getTradeMap(){
        return this.tradeMap;
    },
    getCurrDepth(){
        return this.currDepth;
    },
    // getClientProductInfo: function(currency, code){
    //     if (this._clientProduct){
    //         var map = this._clientProduct[currency];
    //         if (map) return map[this.getOldCode(code)];
    //     }
    // },
    getProductList: function () {
        return this.productList;
    },
    getProduct(code){
        return this.productMap[code];
    },
    getProductByID(productId){
        return this.productIdMap[productId];
    },
    getPrices(){
        return this._priceMap;
    },
    //获取合约规模
    getCon(productId){
        var info = this.getProductByID(productId);
        if (info)return info.Scale;
    },
    getRisks(productId){
        var info = this.getProductByID(productId);
        if (info)return info.Risks;
    },
    getPosition(PID){
        return this.positions[PID];
    },
    //查出开仓单
    getOpenOrder(PID){
        var row = this.orderList.filter((v)=>v.PID==PID && v.Attempt==CONST.FUT.Action.OPEN);
        return row[0];
    },
    //获取止盈止损允许的值范围（开仓单）
    getPLInputValueRange(type, priceType, direction, price, isQuick){
        if (isQuick) return [-this.priceMax, this.priceMax];

        if (type=='SL'){ //止损
            var range = direction==CONST.TRADE.DIRECTION.BID ? [-this.priceMax, -1] : [1, this.priceMax];
            if (priceType==1){
                return range;
            }else{
                return direction==CONST.TRADE.DIRECTION.BID ? [1, Number(Decimal.accAdd(price, range[1]))] : [Number(Decimal.accAdd(price, range[0])), Number(Decimal.accAdd(price, range[1]))];
            }
        }else{
            var range = direction==CONST.TRADE.DIRECTION.ASK ? [-this.priceMax, -1] : [1, this.priceMax];
            if (priceType==1){
                return range;
            }else{
                return direction==CONST.TRADE.DIRECTION.ASK ? [1, Number(Decimal.accAdd(price, range[1]))] : [Number(Decimal.accAdd(price, range[0])), Number(Decimal.accAdd(price, range[1]))];
            }
        }
    },
    // getPrice(code){
    //     return this._priceMap[code];
    // },
    //包含有月份的code
    getNewCode: function(oldcode, month){
        if (oldcode.indexOf('_')==-1) return oldcode + (!month ? "" : '_' + month);
        else return oldcode;
    },
    getOrder(ID){
        return this.orders[ID];
    },
    getPosition(ID){
        return this.positions[ID];
    },
    //没有月份的code
    getOldCode: function(newcode){
        return newcode.split('_')[0];
    },
    //获取价格一点的值
    getPriceOnePointValue(minUnitPoint){
        var findex = String(minUnitPoint).indexOf('.');
        return  findex==-1 ? 1 : 1/Math.pow(10, String(minUnitPoint).length - (findex+1));
    },
    getMaxVolProg(){
        return this._maxVolProg;
    },
    // calcPriceToCny(code, price){
    //     if (!price && price<=0) return;
    //
    //     var products = this.getProduct(code);
    //     var info = products[0];
    //     if (info){
    //         var toCode = info.toCode;
    //         if (toCode=="BTC" && this.exchangeRateMap["BTC"]){
    //             return Decimal.accMul(price, this.exchangeRateMap["BTC"], 2);
    //         }else if (toCode=="ETH" && this.exchangeRateMap["ETH"]){
    //             return Decimal.accMul(price, this.exchangeRateMap["ETH"], 2);
    //         }else if(toCode =='USD' && this.exchangeRateMap["USD"]){
    //             return Decimal.accMul(price, this.exchangeRateMap["USD"], 2);
    //         }
    //     }
    // },
    //比如多单的平仓委托(=空单)，触发价是10000，如果委托价是9000，那就是市价卖出的效果；而如果委托价时11000，那就是挂在上面等着卖，这种才可以勾选‘被动’‘隐藏’
    isShowDQETPart(direction, triggerPriceType, triggerPrice, delegatePriceType, delegatePrice){
        //多单 触发价 > 委托价 显示
        //空单 触发价 < 委托价 显示
        if (triggerPriceType==1){ //价格
            if (delegatePriceType==1){
                if (direction==CONST.FUT.Side.BUY){
                    return Number(triggerPrice) > Number(delegatePrice);
                }else{
                    return Number(triggerPrice) < Number(delegatePrice);
                }
            }else if(delegatePriceType==2){
                if (direction==CONST.FUT.Side.BUY){
                    return Number(delegatePrice) < 0;
                }else{
                    return Number(delegatePrice) > 0;
                }
            }
            return false;
        }else if (triggerPriceType==2){ //价距
            if (delegatePriceType==2){
                if (direction==CONST.FUT.Side.BUY){
                    return Number(delegatePrice) < 0;
                }else{
                    return Number(delegatePrice) > 0;
                }
            }
        }
        return true;
    },
    // reqProductList(listener){
    //     Net.httpRequest(PRODUCT_LIST_URL, {Device:"WEB"}, listener, this, 'get');
    // },
    //仓位
    loadPosition(){
        Net.httpRequest("futures/position", "", (data)=>{
            if (data.Status == 0){
                this.basePositions = data.Data && data.Data.List ? data.Data.List : []
                this.buildPosition();
            }
        }, this);
    },
    //订单
    loadOrders(){
        Net.httpRequest("futures/orders", "", (data)=>{
            // data = this.makeOrderTestData();
            if (data.Status == 0){
                this.baseOrders = data.Data && data.Data.List ? data.Data.List : []
                this.buildOrders();
            }
        }, this);
    },
    loadScheme(cid, callback, force){
        if (!this.schemeSetting[cid] || force){
            Net.httpRequest("futures/scheme", {CID:cid}, (data)=>{
                if (data.Status==0){
                    this.schemeSetting[cid] = data.Data;
                    Event.dispatch(Event.EventName.SET_SHARED, data.Data.Shared);
                    Event.dispatch(Event.EventName.SET_MERGED, data.Data.Merged);
                    if (callback) callback(data.Data);
                }
            }, this);
        }else{
            if (callback) callback(this.schemeSetting[cid]);
        }
    },
    saveScheme(cid, option){
        var opt = this.schemeSetting[cid];
        if (opt){
            Object.assign(opt, option);
        }
    },
    loadSchemeByCode(code, callback, force){
        var product = this.getProduct(code);
        if (product && product[0]) this.loadScheme(product[0].ID, callback, force);
    },
    isShared(){
        var product = this.getProduct(this.currCode);
        if (product && product[0]){
            var option = this.schemeSetting[product[0].ID];
            if (option)return option.Shared;
        }
    },
    isSharedByCid(cid){
        var option = this.schemeSetting[cid];
        if (option)return option.Shared;
    },
    //当前是否全仓并且开启杠杆限制(全仓模式只能用20倍杠杆)
    isSharedLimit(){
        return this.isSharedMax && this.isShared();
    },
    isMergedByCid(cid){
        var option = this.schemeSetting[cid];
        if (option)return option.Merged;
    },
    getProductPosStat(cid){
        var info = this.plTotal[cid];
        return info||{volume:0};
    },
    //构造测试用数据
    // makeOrderTestData(){
    //     var data = {Status:0, Data:{List:[]}};
    //     for (var i=0; i<200; i++){
    //         data.Data.List.push({"ID":106434723841+i,"PID":106434723841+i,"CID":1,"RID":0,"Side":0,"Kind":0,"Attempt":3,"Scale":"1.000000","Volume":3111,"Visible":4294967295,"Filled":0,"Distance":0,"Price":"0.0000000000","Shared":0,"Timely":0,"TimelyParam":0,"Deadline":0,"Passive":0,"Better":0,"Strategy":0,"Variable":0,"Constant":"0.0000000000","Relative":0,"Vertex":0,"Activated":1528778313533,"Triggered":1528778313533,"State":6,"SerialID":0,"Notes":"","CreatedAt":"2018-06-12 12:38:33","UpdatedAt":"2018-06-12 12:38:33","Locked":0});
    //     }
    //     return data;
    // },
    loadHistory(page, PageSize, winObj, callback){
        Net.httpRequest("futures/history", {PageSize:PageSize, Page:page}, (data)=>{
            if (data.Status==0){
                var list = data.Data.List||[];
                list.forEach((v)=>{
                    try{
                        var product = this.getProductByID(v.CID);
                        v.CostPrice = Number(v.CostPrice);
                        v.FinalPrice = Number(v.FinalPrice);
                        // v.VolumeDesc = v.XVolume + '/' + (v.Volume - v.Filled + v.XVolume);

                        // v.FeeDesc = IS_TRADE_V2 ? Decimal.toFixed(v.Fee, product.ShowFixed) : Decimal.toFixed(Decimal.accMul(v.Fee, v.XVolume), product.ShowFixed);
                        // v.ProfitLoss = '';
                        // v.ProfitLossDesc = '';
                        // v.Side = v.Attempt!=CONST.FUT.Action.OPEN ? (v.Side==CONST.FUT.Side.BUY ? CONST.FUT.Side.SELL : CONST.FUT.Side.BUY) : v.Side;
                        //因为自己成交而发生的变化记录

                        if (v.Attempt==CONST.FUT.Action.CLEAR){
                            v.TypeDesc = '';
                        }

                        // if (v.CostPrice>0 && v.XVolume>0){
                        //     //平仓记录是相反方向的单
                        //     v.ProfitLoss = this.formula.plVal(v.Side, v.CostPrice, v.FinalPrice, v.XVolume, this.getCon(v.CID));
                        //     v.ProfitLossDesc = Decimal.toFixed(v.ProfitLoss, product.ShowFixed)
                        // }
                    }catch (e){
                        console.error(e);
                    }
                });
                this.parseOrderList(list, null, true);

                if (callback) callback(data.Data);
            }
        }, winObj);
    },
    loadPositionHistory(page, PageSize, timeRange, winObj, callback){
        var params = {PageSize:PageSize, Page:page};
        if (timeRange){
            params.BeginTime = timeRange[0];
            params.EndTime = timeRange[1];
            params.ScreeningType = timeRange[2];
        }
        Net.httpRequest("futures/positionHistory", params, (data)=>{
            if (data.Status==0){
                var list = data.Data.List||[];
                this.parsePositionList(list);

                if (callback) callback(data.Data);
            }
        }, winObj);
    },
    replace(data, callback, winObj){
        var formData = {};
        for (var key in data){
            var val = data[key];
            if (["ID", "CID", "Side", "Scale", "Volume", "Price", "Timely", "TimelyParam",
                  "Visible", "Strategy", "Variable", "Constant", "SL", "TP"].indexOf(key)!=-1){
                if (key=='SL'){
                    var newVal = Object.assign({}, val);
                    delete newVal["Variable"];
                    val = newVal;
                }
                formData[key] = val;
            }else if(["Distance", "Passive", "Better"].indexOf(key)!=-1){
                formData[key] = !!val;
            }
        }

        Net.httpRequest("futures/replace", formData, (data)=>{
            if (callback) callback(data);
        }, winObj);
    },
    checkFormDataSL(formData, result){
        result = result || {ok:true, error:[]};
        if (isNaN(formData.SL.Param) || !formData.SL.Param){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.SLParam"));
            return result;
        }
        if (formData.Side==CONST.FUT.Side.BUY){
            if (formData.SL.Distance && formData.SL.Param>=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slbuy1"));
            }else if(!formData.SL.Distance && formData.SL.Param >= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slbuy0"));
            }
        }else{
            if (formData.SL.Distance && formData.SL.Param<=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slsell1"));
            }else if(!formData.SL.Distance && formData.SL.Param <= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.slsell0"));
            }
        }
        return result;
    },
    checkFormDataTP(formData, result){
        result = result || {ok:true, error:[]};
        if (isNaN(formData.TP.Param) || !formData.TP.Param){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.TPParam"));
            return result;
        }
        if (formData.Side==CONST.FUT.Side.BUY){
            if (formData.TP.Distance && formData.TP.Param<=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpbuy1"));
            }else if(!formData.TP.Distance && formData.TP.Param <= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpbuy0"));
            }
        }else{
            if (formData.TP.Distance && formData.TP.Param>=0){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpsell1"));
            }else if(!formData.TP.Distance && formData.TP.Param >= formData.Price){
                result.ok = false;
                result.error.push(Intl.lang("trade.open.tpsell0"));
            }
        }
        return result
    },
    checkFormDataEntry(formData, result){
        result = result || {ok:true, error:[]};
        if (formData.Price===null){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Price"));
            return result;
        }
        if (formData.Constant===null){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Constant"));
            return result;
        }
        if (formData.TimelyParam===null){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.TimelyParam"));
            return result;
        }
        if (formData.Visible===null){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Visible"));
            return result;
        }
    },
    checkFormData(formData, canUse){
        var result = {ok:true, error:[]};
        if (formData.Volume<=0){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Volume"));
            return result;
        }
        if (canUse<=0){
            result.ok = false;
            result.error.push(Intl.lang("server.status.1010"));
            return result;
        }

        if (formData.Price){
            var con = this.getCon(formData.CID);
            var product = this.getProductByID(formData.CID);
            if (con && product){
                const sb = getCurrencySymbol(product.Currency);
                var unitFee = this.formula.unitOrderFee(formData.Price>0, formData.Side, con, formData.Scale, product.price, formData.Price, product.TakerFee);
                if (unitFee && Number(unitFee)>0){
                    var total = Number(Decimal.accMul(unitFee, formData.Volume));
                    if (canUse < total){
                        result.ok = false;
                        result.error.push(Intl.lang("trade.openError.feeNotEnough", Decimal.format(total, product.ShowFixed)+ ' '+sb.sn, Decimal.format(canUse, product.ShowFixed)+ ' '+sb.sn));
                        return result;
                    }
                }
            }
        }

        if (!formData.Scale){
            result.ok = false;
            result.error.push(Intl.lang("trade.openError.Scale"));
            return result;
        }

        if (formData.SL){
            this.checkFormDataSL(formData, result);
            if (!result.ok) return result;
        }
        if (formData.TP){
            this.checkFormDataTP(formData, result);
            if (!result.ok) return result;
        }

        //入市的
        if (!formData.Better){
            this.checkFormDataEntry(formData, result);
            if (!result.ok) return result;
        }

        return result;
    },
    cancelOrders(data, callback){
        var List = data.map((v,i)=>{
            return {CID:Number(v.CID),ID:v.ID};
        });

        Net.httpRequest("futures/cancel", {List}, (data)=>{
            if (data.Status==0){
                if (callback)callback();
            }
        }, this);
    },
    //以最近一小时的分钟均价的均价为基准，限价±10%。
    //您委托的价格已超出最新均价10%/-10%以上
    checkDelegateAvgPrice(delegatePrice, priceInfo){
        var mean = priceInfo.MEAN;
        if (mean){
            var offset = Decimal.accMul(mean, 0.1);
            var max = Number(Decimal.accAdd(mean, offset));
            var min = Number(Decimal.accSubtr(mean, offset));
            if (delegatePrice<=max && delegatePrice>=min){
                return true;
            }
        }
        if (priceInfo.LAST && Number(priceInfo.LAST)>0) return false;
        return true;
    },
    clearUserData(){
        this.baseOrders = [];
        this.basePositions = [];
        this.msgs = [];
        this.msgId = 0;
        this.orders = {};
        this.orderList = [];
        this.positions = {};
        this.positionList = [];
        this.posSummaryList = [];
        this.orderMarginTotal = {};
        this.plTotal = {};
    }
}
