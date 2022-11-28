const fs = require('fs')
const path = require("path")
const XLSX = require("xlsx");

const file = path.join(__dirname, "savelist1.json")
const dataList = fs.readFileSync(file,'utf-8')
let jsonList = JSON.parse(dataList)
const jsonWorkSheet = XLSX.utils.json_to_sheet(jsonList)
const workBook = {
  SheetNames: ['jsonWorkSheet1','jsonWorkSheet2'],
  Sheets: {
    'jsonWorkSheet1': jsonWorkSheet,
    'jsonWorkSheet2': jsonWorkSheet,
  }
};
const filepath = path.join(__dirname, "test.xlsx")
XLSX.writeFile(workBook, filepath);