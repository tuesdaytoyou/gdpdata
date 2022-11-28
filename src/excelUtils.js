const xlsx = require('node-xlsx')
const fs = require('fs')
const path = require("path");
const json2xls = require('json2xls')
const XLSX = require("xlsx");

module.exports ={
  handleDistrict: () => {
    const excelFilePath = `${__dirname}/data.xlsx`
    //解析excel, 获取到所有sheets
    const sheets = xlsx.parse(excelFilePath);
    const sheet = sheets[1];
    let array = []
    sheet.data.forEach((rowData, rowindex) => {
      rowData.forEach((data,colindex) => {
        if(!array[colindex]){array[colindex] = []}
        array[colindex].push(data)
      })
    })
    let res = array[2]
    res.shift()
    return res
  },
  saveToXlsx: (jsonData, type) => {
    const buffer = json2xls(jsonData)
    const excelFilePath = `${__dirname}/save_${type}_data.xlsx`
    fs.writeFileSync(excelFilePath, buffer, 'binary')
    console.log("保存xlsx汇总数据成功")
  },
  newSaveToXlsx: (statisticsList1,statisticsList2,statisticsList3,statisticsList4) => {
    const jsonWorkSheet1 = XLSX.utils.json_to_sheet(statisticsList1)
    const jsonWorkSheet2 = XLSX.utils.json_to_sheet(statisticsList2)
    const jsonWorkSheet3 = XLSX.utils.json_to_sheet(statisticsList3)
    const jsonWorkSheet4 = XLSX.utils.json_to_sheet(statisticsList4)
    const workBook = {
      SheetNames: ['红黑库单条数据','红黑库多条数据','必应单条数据','必应多条数据'],
      Sheets: {
        '红黑库单条数据': jsonWorkSheet1,
        '红黑库多条数据': jsonWorkSheet2,
        '必应单条数据': jsonWorkSheet3,
        '必应多条数据': jsonWorkSheet4,
      }
    };
    const filepath = path.join(__dirname, "savedata.xlsx")
    XLSX.writeFile(workBook, filepath);
  }
}