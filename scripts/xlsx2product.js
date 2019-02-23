const fs = require("fs");
const Excel = require('exceljs');

const path = require("path");

//获取当前目录绝对路径，这里resolve()不传入参数
var filePath = path.resolve();
const exportExcelPath = path.join(filePath, '../config', path.sep, "2800webclient.xlsx");
const jsonFilePath = path.join(filePath, '../config', path.sep, "2800webclient.json");
// const exportExcelPath = "D:\\work\\webclient2800\\web_okk\\config\\2800webclient.xlsx";
// const jsonFilePath = "D:\\work\\webclient2800\\web_okk\\config\\2800webclient.json";
const sheetNames = ["产品", "货币"];

const sheet2Map = {
    "产品": "product",
    "货币": "currency"
}


var workbook = new Excel.Workbook();
workbook.xlsx.readFile(exportExcelPath)
    .then(function() {
        var jsonObj = {};
        sheetNames.forEach((sheetName, i)=>{
            var worksheet = workbook.getWorksheet(sheetName);
            var rowList = [];
            var columnMap = {};
            var rowCount = worksheet.rowCount;
            worksheet.eachRow(function(row, rowNumber) {
                if (rowNumber == 1){
                    row.values.forEach((val, columnNum)=>{
                        if (val){
                            var name = val.split('-')[0];
                            columnMap[columnNum] = name;
                        }
                    });
                }else{
                    var info = {};
                    var vals = row.values;
                    for (var i=1,l=vals.length; i<l; i++){
                        info[columnMap[i]] = vals[i];
                    }
                    rowList.push(info);
                }
                if (rowNumber==rowCount){
                    jsonObj[sheet2Map[sheetName]] = rowList;
                }
            });

            if (i+1==sheetNames.length){
                saveJson(jsonFilePath, jsonObj);
                console.log("ok");
                process.exit();
            }
        });

    });

function saveJson(filepath, map) {
    var text = JSON.stringify(map);
    fs.writeFileSync(filepath, text, 'utf-8');
}
