import Big from 'big.js';

export default {
    //除法函数
    accDiv(arg1, arg2, scale, round) {
        try{
            var b1 = new Big(arg1);
            var b2 = new Big(arg2);
            if(round){
                return scale===0 || scale ? this.round(b1.div(b2), scale) : b1.div(b2).toPrecision();
            }
            return scale===0 || scale ? b1.div(b2).toFixed(scale) : b1.div(b2).toFixed();
        }catch(e){
            console.error(e);
            return '';
        }
    },

    //乘法函数
    accMul(arg1, arg2, scale, round) {
        try {
            var b1 = new Big(arg1);
            var b2 = new Big(arg2);
            if (round) {
                return scale === 0 || scale ? this.round(b1.times(b2), scale) : b1.mul(b2).toPrecision();
            }
            return scale === 0 || scale ? b1.times(b2).toFixed(scale) : b1.mul(b2).toFixed();
        }catch(e){
            console.error(e);
            return '';
        }
    },

    //加法函数
    accAdd(arg1, arg2, scale, round){
        try {
            var b1 = new Big(arg1);
            var b2 = new Big(arg2);
            if(round){
                return scale===0 || scale ? this.round(b1.plus(b2), scale) : b1.add(b2).toPrecision();
            }
            return scale===0 || scale ? b1.plus(b2).toFixed(scale) : b1.add(b2).toFixed();
        }catch(e){
            console.error(e);
            return '';
        }
    },
    //减法函数
    accSubtr(arg1, arg2, scale, round) {
        try{
            var b1 = new Big(arg1);
            var b2 = new Big(arg2);
            if(round){
                return scale===0 || scale ? this.round(b1.minus(b2), scale) : b1.sub(b2).toPrecision();
            }
            return scale===0 || scale ? b1.minus(b2).toFixed(scale) : b1.sub(b2).toFixed();
        }catch(e){
            console.error(e);
            return '';
        }
    },
    mod: function(arg1, arg2){
        try{
            var a1 = new Big(arg1);
            return a1.mod(arg2);
        }catch(e){
            console.error(e);
            return '';
        }
    },
    //金额加逗号
    addCommas(nStr){
        try{
            nStr += '';
            var x = nStr.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        }catch(e){
            console.error(e);
            return nStr;
        }
    },
    //格式化金额
    //@str 金额
    //@scale 小数点保留位数
    formatAmount(str, scale){
        return this.addCommas(this.toFixed(str, scale));
    },
    //四舍五入
    toFixed(num, scale){
        try{
            var n = new Big(num);
            return n.toFixed(scale);
        }catch(e){
            console.error(e);
            return num;
        }
    },
    //非四舍五入
    format(num, scale){
        return this.round(num, scale);
    },
    //向上进位Math.ceil
    ceil(num, scale){
        if (String(num)!=="0") {
            var n = new Big(num);
            num = n.round(scale, 3);
        }
        return this.toFixed(num, scale);
    },
    //向下  类似Math.floor
    round(num, scale){
        try{
            if (String(num)!=="0") {
                var n = new Big(num);
                num = n.round(scale, 0);
            }
            return this.toFixed(num, scale);
        }catch(e){
            console.error(e);
            return num;
        }
    },
    //获取小数点后的位数
    getDotDigit(num){
        var sVal = String(num);
        var findex = sVal.indexOf('.');
        return findex==-1?0:sVal.length - (findex+1);
    },
    //位数转为小数
    digit2Decimal(fixed){
        return fixed==0 ? "1" : this.toFixed(1/Math.pow(10, fixed), fixed);
    },
    toPercent(num, scale){
        if (scale) return new Big(num).mul(100).toFixed(scale).toString()+'%';
        else return new Big(num).mul(100).toString()+'%';
    },
    //转成K或M的值
    toKorM(num){
        if (num > 100000){
            return String(this.accDiv(num, Math.pow(10, 6), 2))+'M';
        }else if(num >= 10){
            return String(this.accDiv(num, Math.pow(10, 3), 2))+'K';
        }
        return parseInt(num);
    },
    //类似excel中的ceiling函数
    ceiling(number, significance) {
        return Math.ceil(number/significance)*significance;
    }
};
