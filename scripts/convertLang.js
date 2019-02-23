//提取语言包
const fs = require("fs");
const path = require("path");

const Chinese = require('chinese-s2t');

//获取当前目录绝对路径，这里resolve()不传入参数
var filePath = path.resolve();
var srcPath = path.join(filePath, '../src');

var cnFileContent = fs.readFileSync(path.join(srcPath, 'intl', 'zh-cn_old.js'), 'utf-8');
cnFileContent = cnFileContent.substring(cnFileContent.indexOf('{'), cnFileContent.lastIndexOf('}')+1);
const cnLang = JSON.parse(cnFileContent);
var cnText2Key = {};
for (var key in cnLang){
    cnText2Key[cnLang[key]] = key;
}

var enFileContent = fs.readFileSync(path.join(srcPath, 'intl', 'en-us_old.js'), 'utf-8');
enFileContent = enFileContent.substring(enFileContent.indexOf('{'), enFileContent.lastIndexOf('}')+1);
const enLang = JSON.parse(enFileContent);

var cnNewFile = fs.readFileSync(path.join(srcPath, 'intl', 'zh-cn.js'), 'utf-8');
cnNewFile = cnNewFile.substring(cnNewFile.indexOf('{'), cnNewFile.lastIndexOf('}')+1);
var newCnLang = JSON.parse(cnNewFile);

var enNewFile = fs.readFileSync(path.join(srcPath, 'intl', 'en-us.js'), 'utf-8');
enNewFile = enNewFile.substring(enNewFile.indexOf('{'), enNewFile.lastIndexOf('}')+1);
var newEnLang = JSON.parse(enNewFile);

var twNewFile = fs.readFileSync(path.join(srcPath, 'intl', 'zh-tw.js'), 'utf-8');
twNewFile = twNewFile.substring(twNewFile.indexOf('{'), twNewFile.lastIndexOf('}')+1);
var newTwLang = JSON.parse(twNewFile);

var keyCountMap = {};
var keyFilePath = path.join(filePath, 'keyMap.json');
if (fs.existsSync(keyFilePath)){
    keyCountMap = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));
}

//读取文件目录
fs.readdir(srcPath,function(err,files){
    if(err){
        console.log(err);
        return;
    }
    files.forEach(function(filename){
        if (['components', 'containers'].indexOf(filename)!=-1){
            var jsDirPath = path.join(srcPath, filename);
            var jsFiles = fs.readdirSync(jsDirPath);
            jsFiles.forEach((jsf)=>{
                var jsFilePath = path.join(jsDirPath, jsf);
                var data = fs.readFileSync(jsFilePath, 'utf-8');
                var newData = replaceChineseText(data, jsf);
                if (data != newData){
                    if (newData.indexOf("import Intl from")==-1){
                        newData = insertImport(newData);
                    }
                }
                fs.writeFileSync(jsFilePath, newData, 'utf-8');
            });
        }
    });

    saveLangFile(path.join(srcPath, 'intl', 'zh-cn.js'), newCnLang);
    saveLangFile(path.join(srcPath, 'intl', 'en-us.js'), newEnLang);
    saveLangFile(path.join(srcPath, 'intl', 'zh-tw.js'), newTwLang);

    var text = JSON.stringify(keyCountMap);
    fs.writeFileSync(keyFilePath, text, 'utf-8');

    console.log("ok!");
});

function replaceChineseText(data, jsf){
    if (!keyCountMap[jsf]){
        keyCountMap[jsf] = 100;
    }

    return data.replace(/([>]+)([^><{/]*[^\x00-\xff]+[^><}]*)([<]+)/g, function(word1, word2, word3, word4){
        var key = cnText2Key[word3];
        if (!key){
            var fname = jsf.substr(0, jsf.length-3);
            key = fname + '.'+ keyCountMap[jsf];
            keyCountMap[jsf]++;

            cnText2Key[word3] = key;
        }
        newCnLang[key] = word3;
        newEnLang[key] = enLang[key]||word3;
        newTwLang[key] = Chinese.s2t(word3);

        return '>{Intl.lang("'+key+'")}<';
    })
        .replace(/placeholder=(['"]+)([^'"><{/]*[^\x00-\xff]+[^'"><{]*)(['"]+)/g, function(word1, word2, word3, word4){
        var key = cnText2Key[word3];
        if (!key){
            var fname = jsf.substr(0, jsf.length-3);
            key = fname + '.'+ keyCountMap[jsf];
            keyCountMap[jsf]++;

            cnText2Key[word3] = key;
        }
        newCnLang[key] = word3;
        newEnLang[key] = enLang[key]||word3;
        newTwLang[key] = Chinese.s2t(word3);

        return 'placeholder={Intl.lang(\"'+key+'\")}';
    })
        .replace(/(['"]+)([^'"><{/]*[^\x00-\xff]+[^'"><{]*)(['"]+)/g, function(word1, word2, word3, word4){
        var key = cnText2Key[word3];
        if (!key){
            var fname = jsf.substr(0, jsf.length-3);
            key = fname + '.'+ keyCountMap[jsf];
            keyCountMap[jsf]++;

            cnText2Key[word3] = key;
        }
        newCnLang[key] = word3;
        newEnLang[key] = enLang[key]||word3;
        newTwLang[key] = Chinese.s2t(word3);

        return 'Intl.lang(\"'+key+'\")';
    }).replace(/Intl\.lang\(['"]+([\w\.]+)['"]+\)/g, function(word1, word2){
            var val = cnLang[word2];
            if (val && !newCnLang[word2]){
                newCnLang[word2] = val;
                newEnLang[word2] = enLang[word2]||val;
                newTwLang[word2] = Chinese.s2t(val);
            }

            return word1;
        });
}

function saveLangFile(filepath, map) {
    var text = JSON.stringify(map);
    text = "export default "+text+";"
    fs.writeFileSync(filepath, text, 'utf-8');
}

function insertImport(data) {
    return "import Intl from '../intl';\r\n"+data;
}

