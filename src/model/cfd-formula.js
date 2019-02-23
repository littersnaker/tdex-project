import Decimal from "../utils/decimal";
import {CONST} from "../public/const";

export default {
    _liquidation: "0.8",
    _offset: 25,
    _decimal:10,
    limitSecurity:"0.1",

    liq(){
        return this._liquidation;
    },
    contractValue(realMultiplier, price){
        // var usdVal = 1;//合约美元价值
        if (price && Number(price)>0) return String(Decimal.accMul(realMultiplier, price));
        return 0;
    },
    delegateValue(realMultiplier, price, volume, scale){
        return Decimal.accMul(this.contractValue(realMultiplier, price), volume, scale) ;
    },
    //翻倍点数
    //pip初始点
    //翻倍点数=ceiling(均价/初始点/杠杆, 50)
    marginPips(avgPrice, lever, pip){
        return Decimal.ceiling(Decimal.accDiv(Decimal.accDiv(avgPrice, pip), lever), this._offset);
    },
    //初始保证金
    //合约乘数*翻倍点数*数量
    deposit(multiplier, marginPips, volume, scale){
        return Decimal.accMul(Decimal.accMul(multiplier, marginPips), volume, scale);
    },
    //均价 - （追加保证金/数量/合约乘数 + liq*翻倍点数 - 手续费/数量/合约乘数 - 隔夜费/数量/合约乘数）* 初始点=强平价
    getForceClosePrice(side, avgPrice, addDeposit=0, volume, multiplier, marginPip, fee, swap, pip, scale){
        var val1 = Decimal.accDiv(Decimal.accDiv(addDeposit, volume), multiplier);
        var val2 = Decimal.accMul(this._liquidation, marginPip);
        var feePip = Decimal.accDiv(Decimal.accDiv(fee, volume), multiplier);
        var swapPips = Decimal.accDiv(Decimal.accDiv(swap, volume), multiplier);
        var val3 = Decimal.accSubtr(Decimal.accSubtr(Decimal.accAdd(val1, val2), feePip), swapPips);
        var val4 = Decimal.accMul(val3, pip);
        if (side==CONST.FUT.Side.BUY){
            return Decimal.accSubtr(avgPrice, val4, scale);
        }else{
            return Decimal.accAdd(avgPrice, val4, scale);
        }
    },
    //保证金=合约乘数*翻倍点数*数量
    //翻倍点数=ceiling(均价/初始点/杠杆, 50)
    leverDeposit(multiplier, volume, avgPrice, lever, pip, scale){
        return this.deposit(multiplier, this.marginPips(avgPrice, lever, pip), volume, scale);
    },
    fee(multiplier, volume, feePoint, scale){
        return Decimal.accMul(Decimal.accMul(multiplier, volume), feePoint, scale);
    },
    //杠杆=ROUNDUP(multi*(均价/初始点)*数量/初始保证金, 10)
    depositLever(multiplier, avgPrice, pip, volume, initMargin){
        return Decimal.accDiv(Decimal.accMul(Decimal.accMul(multiplier, Decimal.accDiv(avgPrice, pip)), volume), initMargin);
    },
    //调整强平价后保证金
    //每手保证金=(均价-强平价+（手续费点数+隔夜点数）*初始点)/初始点*合约乘数
    unitDeposit(side, avgPrice, forcePrice, volume, fee, swap, pip, multiplier){
        var feePoint = Decimal.accDiv(fee, Decimal.accMul(volume, multiplier));
        var swapPoint = Decimal.accDiv(swap, Decimal.accMul(volume, multiplier));

        var val1 = Decimal.accSubtr(avgPrice, forcePrice)*(side==CONST.FUT.Side.BUY?1:-1);
        var val2 = Decimal.accMul(Decimal.accAdd(feePoint, swapPoint), pip)*(side==CONST.FUT.Side.BUY?1:-1);
        return Decimal.accMul(Decimal.accDiv(Decimal.accAdd(val1, val2), pip), multiplier);
    },
    //调整强平价后中总的初始保证金
    // initMargin(unitDeposit, volume, initMarginOld){
    //     return Math.min(Number(Decimal.accDiv(Decimal.accMul(unitDeposit, volume), this._liquidation)), initMarginOld)
    // },
    //盈亏 = 数量 * 合约规模1*(买卖价 - 均价)/初始点
    plVal(side, avgPrice, price, volume, multiplier, pip, scale=8){
        if (pip && Number(pip)>0 && price) return String(Decimal.accDiv(Decimal.accMul(Decimal.accMul(volume, multiplier), side==CONST.FUT.Side.BUY ? Decimal.accSubtr(price, avgPrice) : Decimal.accSubtr(avgPrice, price)), pip, scale));
        return 0;
    },
    //盈亏率 = 盈亏/保证金
    plRate(pl, deposit){
        if (deposit && Number(deposit)>0) return String(Decimal.accDiv(pl, deposit));
        return 0;
    },
    orderFee(isLmt, side, volume, lever, multiplier, pip, feePoint, priceInfo, delegatePrice, scale){
        var marginPip;

        const {ASK, BID} = priceInfo;

        if (side==CONST.FUT.Side.BUY){
            marginPip = this.marginPips(isLmt?Math.min(delegatePrice, ASK):ASK, lever, pip);
        }else{
            marginPip = this.marginPips(isLmt?delegatePrice:BID, lever, pip);
        }
        var deposit = this.deposit(multiplier, marginPip, volume);
        var fee = this.fee(multiplier, volume, feePoint);

        return Decimal.accAdd(deposit, fee, scale);
    }
};
