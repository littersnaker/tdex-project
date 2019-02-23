//简体中文转成繁体中文
const fs = require("fs");
const path = require("path");

const Chinese = require('chinese-s2t');

//获取当前目录绝对路径，这里resolve()不传入参数
var filePath = path.resolve();
var srcPath = path.join(filePath, '../src');

var cnNewFile = fs.readFileSync(path.join(srcPath, 'intl', 'zh-cn.json'), 'utf-8');
// cnNewFile = cnNewFile.substring(cnNewFile.indexOf('{'), cnNewFile.lastIndexOf('}')+1);
var newCnLang = JSON.parse(cnNewFile);

var twFilePath = path.join(srcPath, 'intl', 'zh-tw.json');
var twNewFile = fs.readFileSync(twFilePath, 'utf-8');
// twNewFile = twNewFile.substring(twNewFile.indexOf('{'), twNewFile.lastIndexOf('}')+1);
var newTwLang = JSON.parse(twNewFile);

for (var key in newCnLang){
    newTwLang[key] = Chinese.s2t(newCnLang[key]);
}

fs.writeFileSync(twFilePath, JSON.stringify(newTwLang), 'utf-8');
