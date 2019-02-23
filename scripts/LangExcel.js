const fs = require("fs");
const Excel = require('exceljs');

const path = require("path");

const exportExcelPath = "./data/client_tdex.xlsx";
const sheetName = "Sheet";

//获取当前目录绝对路径，这里resolve()不传入参数
var filePath = path.resolve();
const srcPath = path.join(filePath, '../src');
const jsFilePaths = {
    "zh-cn": path.join(srcPath, 'intl', 'zh-cn.json'),
    "ja-jp": path.join(srcPath, 'intl', 'ja-jp.json'),
    "en-us": path.join(srcPath, 'intl', 'en-us.json')
};

var columns = [{ header: 'code', key: 'code', width: 30 }];
for (var lang in jsFilePaths){
    columns.push({ header:lang, key:lang, width: 60 });
}

// const action = "import";
// const action = "import";

var langMap = {};
function excel2Json(isCreateCn=false) {
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(exportExcelPath)
        .then(function() {
            var worksheet = workbook.getWorksheet(sheetName);
            var columnMap = {};
            var rowCount = worksheet.rowCount;
            worksheet.eachRow(function(row, rowNumber) {
                if (rowNumber==1){
                    row.values.forEach((val, columnNum)=>{
                        val = val.trim();
                        if (val && val!="code"){
                            langMap[val] = {};
                            columnMap[columnNum] = val;
                        }
                    });
                    console.log(langMap);
                }else{
                    var vals = row.values;
                    var key = vals[1];
                    var len = vals.length;
                    if (len > 2){
                        for (var i=2,l=vals.length;i<l; i++){
                            if (columnMap[i]){
                                var lang = columnMap[i];
                                var text = vals[i];
                                if (typeof(text)!=="undefined"){
                                    if (typeof text == "string"){
                                        langMap[lang][key] = text;
                                    }else{
                                        if (['zh-tw'].indexOf(lang)==-1){
                                            var rt = text.richText;
                                            var nText = "";
                                            if (rt){
                                                rt.forEach((v)=>{
                                                    if (v.text){
                                                        nText += v.text;
                                                    }
                                                })
                                                langMap[lang][key] = nText;
                                            }
                                            if (!nText)console.warn(lang+"|"+key+":"+nText);
                                        }
                                    }
                                }
                            }
                        }
                    }else{
                        for (var k in columnMap){
                            var lang = columnMap[k];
                            langMap[lang][key] = "";
                        }
                    }
                }

                if (rowNumber==rowCount){
                    for (var lang in langMap){
                        if (lang=='zh-cn'){
                            if (isCreateCn) saveLangFile(jsFilePaths[lang], langMap[lang]);
                        }
                        else {
                            saveLangFile(jsFilePaths[lang], langMap[lang]);
                        }
                    }
                    console.log("import to json ok");
                }
            });
        });
}

function json2Excel() {
    for (var lang in jsFilePaths){
        var filepath = jsFilePaths[lang];
        var fileContent = fs.readFileSync(filepath, 'utf-8');
        fileContent = fileContent.substring(fileContent.indexOf('{'), fileContent.lastIndexOf('}')+1);
        langMap[lang] = JSON.parse(fileContent);
    }

    function exportLang(oldLangMap) {
        var workbook = new Excel.Workbook();
        workbook.creator = 'will.lan';
        workbook.created = new Date();
        workbook.modified = new Date();

        var worksheet = workbook.addWorksheet(sheetName);
        if (oldLangMap['en-us']) columns.push({ header:"en-us-o", key:"en-us-o", width: 60 });
        worksheet.columns = columns;
        worksheet.getRow(1).font = { size: 14, bold: true };

        var langInfo = langMap["zh-cn"];
        for (var key in langInfo){
            var item = {"code":key};
            var isDiffer = false;
            for (var lang in langMap) {
                item[lang] = langMap[lang][key];
                if (lang=='zh-cn' && oldLangMap[lang] && (oldLangMap[lang][key] && item[lang]!=oldLangMap[lang][key] || !oldLangMap[lang][key])){
                    console.log(key);
                    isDiffer = true;
                }else if (lang=='en-us' && oldLangMap[lang]  && (oldLangMap[lang][key] && item[lang]!=oldLangMap[lang][key] || !oldLangMap[lang][key])){
                    isDiffer = true;
                    if (oldLangMap[lang][key])item["en-us-o"] = oldLangMap[lang][key];
                }else if (lang=='ja-jp' && oldLangMap[lang]  && (oldLangMap[lang][key] && item[lang]!=oldLangMap[lang][key] || !oldLangMap[lang][key])){
                    isDiffer = true;
                    if (oldLangMap[lang][key])item["ja-jp-o"] = oldLangMap[lang][key];
                }
            }
            if (!isDiffer){
                worksheet.addRow(item).commit();
            }else{
                var row = worksheet.addRow(item);
                row.font =  { color:{ argb: 'FFFF0000' } };
                row.commit();
            }
        }

        workbook.xlsx.writeFile(exportExcelPath).then(function() {
            console.log("export to xlsx file is ok!");
        });
    }

    function readOldExcel(excelPath, lang, oldLangMap, callback) {
        var workbook = new Excel.Workbook();
        workbook.xlsx.readFile(excelPath)
            .then(function() {
                var worksheet = workbook.getWorksheet(sheetName);
                var columnMap = {};
                var rowCount = worksheet.rowCount;
                var zhcnColumn = 0;
                worksheet.eachRow(function(row, rowNumber) {
                    if (rowNumber==1){
                        row.values.forEach((val, columnNum)=>{
                            if (val && val!="code" && val==lang){
                                oldLangMap[val] = {};
                                zhcnColumn = columnNum;
                            }
                        });
                        console.log(oldLangMap);
                    }else{
                        var vals = row.values;
                        var key = vals[1];
                        oldLangMap[lang][key] = vals[zhcnColumn];
                    }

                    if (rowNumber==rowCount){
                        if (callback) callback();
                    }
                });
            });
    }

    //读取原来的简体作比较
    var oldLangMap = {};
    if (fs.existsSync(exportExcelPath)){
        const oldExportExcelPath = "./data/client_tdex_old.xlsx";
        if (fs.existsSync(oldExportExcelPath)){
            readOldExcel(oldExportExcelPath, 'en-us', oldLangMap, function () {
                readOldExcel(exportExcelPath, 'zh-cn', oldLangMap, function () {
                    exportLang(oldLangMap);
                });
            });
        }else{
            readOldExcel(exportExcelPath, 'zh-cn', oldLangMap, function () {
                exportLang(oldLangMap);
            });
        }
    }else{
        exportLang(oldLangMap);
    }
}

function saveLangFile(filepath, map) {
    var text = JSON.stringify(map);
    // text = "export default "+text+";"
    fs.writeFileSync(filepath, text, 'utf-8');
}

module.exports = {
    json2Excel,
    excel2Json
}
