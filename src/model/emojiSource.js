/**
 * Desc: 表情包数据源
 *
 * Created by WangGanxin on 2018/1/31
 * Email: mail@wangganxin.me
 */

//符号->中文
const EMOTIONS_DATA = {
    'weixiao':'[微笑]',
    'piezui': '[撇嘴]',
    'se': '[色]',
    'fadai': '[发呆]',
    'deyi': '[得意]',
    'liulei': '[流泪]',
    'haixiu': '[害羞]',
    'bizui': '[闭嘴]',
    'shui': '[睡]',
    'daku': '[大哭]',
    'ganga': '[尴尬]',
    'fanu': '[发怒]',
    'tiaopi': '[调皮]',
    'ziya': '[龇牙]',
    'jinya': '[惊讶]',
    'nanguo': '[难过]',
    'jiong': '[囧]',
    'zhuakuang': '[抓狂]',
    'tu': '[吐]',
    'faxiao': '[发笑]',

    'yukuai': '[愉快]',
    'baiyan': '[白眼]',
    'aoman': '[傲慢]',
    'kun': '[困]',
    'jinkong': '[惊恐]',
    'liuhan': '[流汗]',
    'hanxiao': '[憨笑]',
    'youxian': '[悠闲]',
    'fendou': '[奋斗]',
    'zhouma': '[咒骂]',
    'yiwen': '[疑问]',
    'xu': '[嘘]',
    'yun': '[晕]',
    'shuai': '[衰]',
    'kulu': '[骷髅]',
    'qiaoda': '[敲打]',
    'zaijian': '[再见]',
    'cahan': '[擦汗]',
    'koubi': '[抠鼻]',
    'guzhang': '[鼓掌]',

    'huaixiao': '[坏笑]',
    'zuohengheng': '[左哼哼]',
    'youhengheng': '[右哼哼]',
    'haqian': '[哈欠]',
    'bishi': '[鄙视]',
    'weiqu': '[委屈]',
    'kuaikule': '[快哭了]',
    'yinxian': '[阴险]',
    'qinqin': '[亲亲]',
    'kelian': '[可怜]',
    'caidao': '[菜刀]',
    'xigua':'[西瓜]',
    'pijiu': '[啤酒]',
    'kafei': '[咖啡]',
    'zhutou': '[猪头]',
    'meigui': '[玫瑰]',
    'diaoxie': '[凋谢]',
    'zuichun': '[嘴唇]',
    'aixin': '[爱心]',
    'xinsui': '[心碎]',

    'dangao': '[蛋糕]',
    'zhadan': '[炸弹]',
    'bianbian': '[便便]',
    'yueliang': '[月亮]',
    'taiyang': '[太阳]',
    'yongbao': '[拥抱]',
    'qiang': '[强]',
    'ruo': '[弱]',
    'woshou': '[握手]',
    'shengli':'[胜利]',
    'baoquan': '[抱拳]',
    'gouying': '[勾引]',
    'quantou': '[拳头]',
    'ok': '[OK]',
    'tiaotiao': '[跳跳]',
    'fadou': '[发抖]',
    'aohuo': '[怄火]',
    'zhuanquan': '[转圈]',
    'gaoxing': '[高兴]',
    'kouzhao': '[口罩]',

    'xiaoku':  '[笑哭]',
    'tushetou':  '[吐舌头]',
    'shadai':  '[傻呆]',
    'kongju':  '[恐惧]',
    'beishang':  '[悲伤]',
    'buxie': '[不屑]',
    'heiha':  '[嘿哈]',
    'wulian':  '[捂脸]',
    'jianxiao':  '[奸笑]',
    'jizhi':  '[机智]',
    'zhoumei':  '[皱眉]',
    'ye':  '[耶]',
    'guilian':  '[鬼脸]',
    'heshi':  '[合十]',
    'jiayou':  '[加油 ]',
    'qingzhu':  '[庆祝]',
    'liwu':  '[礼物]',
    'hongbao':  '[红包]',
    'fa':  '[发]',
    'ji':  '[鸡]',

};

//反转对象的键值
export function getEmojiData(){
    let newData = {};
    for(var i in EMOTIONS_DATA){
        let item = EMOTIONS_DATA[i];
        newData[item] = i;
    }
    return newData;
}

