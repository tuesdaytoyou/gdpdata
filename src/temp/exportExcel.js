const puppeteer = require("puppeteer");
const fs = require('fs')
const path = require("path")
const XLSX = require("xlsx");
const getPdfContent = async (url) => {
  let content = ''
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.goto(url, {waitUntil: "networkidle2"});
    await page.waitForTimeout(1000);
    content = await page.evaluate(async () => {
      let dom = '', index = 1
      function delay(n){
        return new Promise(function(resolve){
          setTimeout(resolve,n*1000);
        });
      }
      const button = document.querySelector('.pageDown')
      let isDisable = button.getAttribute('disabled')
      dom = document.querySelectorAll(`[data-page-number="${index}"]`)[1].outerHTML
      while(isDisable === null) {
        index ++
        await delay(1)
        button.click()
        dom += document.querySelectorAll(`[data-page-number="${index}"]`)[1].outerHTML
        isDisable = button.getAttribute('disabled')
      }
      return dom
    });
    // content = await page.$eval('#viewerContainer',e => e.outerHTML);
    // content = await page.content()
    // console.log('content',content)
    await browser.close();
  }catch(e) {
    console.log(e)
  }
  return content
}
const handleSearchByUrl = async (item) => {
  const getStatisticsData = async function(urlData) {
    let content = ''
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(60000);
      await page.goto(urlData.url, {waitUntil: "networkidle2"});
      content = await page.content()
      if(/pdfjs-viewer-shortcode/.test(content)) {
        let pdfurl = content.match(/https.*?pdfjs.*?(?=">View Fullscreen)/)
        const pdfContent = await getPdfContent(pdfurl[0])
        content = pdfContent.replace(/<span.*?>|<\/span>/g,'') 
      }
      await browser.close();
    }catch(e) {
      console.log(e)
    }
    console.log('content',content)
    let singleRes = null, totalRes = null
    {
      const matchGdp = content.match(/(?<=生产总值).*?元/)
      const totalGdp = (matchGdp && matchGdp.length > 0) ? (matchGdp[0]).match(/\d.*/) : null
      const totalPopulation = (content.match(/(?<=(总人口|常住人口|户籍人口)).*?人/))
      const ruralPopulation = (content.match(/(?<=(乡村人口|农业人口)).*?人/))
      const townPopulation = (content.match(/(?<=(城镇人口|非农业人口|城镇常住人口)).*?人/))
      const healthInstitution = (content.match(/(?<=(卫生机构|卫生医疗机构)).*?(所|个|家)/))
      const totalHospital = (content.match(/(?<=医院).*?(所|个|家)/))
      const skillWorker = (content.match(/(?<=卫生技术人员).*?(人)/))
      const totalDoctor = (content.match(/(?<=((医师|师生|医生)))(\d.*?)(人)/))
      const totalDisposableIncome  = (content.match(/(?<=(全体居民人均可支配收入|常住居民人均可支配收入)).*?(元)/))
      const townDisposableIncome  = (content.match(/(?<=(城镇居民人均可支配收入|城镇常住居民人均可支配收入|城镇居民家庭年人均可支配收入)).*?(元)/))
      const ruralDisposableIncome  = (content.match(/(?<=(农村居民人均可支配收入|农村常住居民人均可支配收入|农村居民家庭年人均纯收入|乡村常住居民人均可支配收入|乡村居民家庭年人均纯收入|乡村居民人均可支配收入)).*?(元)/))
      const totalMedicalInsurance  = (content.match(/(?<=(基本医疗参保人数|基本医疗保险参保人数|基本医疗保险参保人数完成|参加基本医疗保险人数|城乡居民基本医疗保险参保人数|城乡居民基本医疗参保人数)).*?(人)/))
      // 获取的单个数据
      singleRes = {
        totalGdp:totalGdp && totalGdp[0],
        totalPopulation:totalPopulation && totalPopulation[0],
        ruralPopulation:ruralPopulation && ruralPopulation[0],
        townPopulation:townPopulation && townPopulation[0],
        healthInstitution:healthInstitution && healthInstitution[0],
        totalHospital:totalHospital && totalHospital[0],
        skillWorker:skillWorker && skillWorker[0],
        totalDoctor:totalDoctor && totalDoctor[0],
        totalDisposableIncome:totalDisposableIncome && totalDisposableIncome[0],
        townDisposableIncome:townDisposableIncome && townDisposableIncome[0],
        ruralDisposableIncome:ruralDisposableIncome && ruralDisposableIncome[0],
        totalMedicalInsurance:totalMedicalInsurance && totalMedicalInsurance[0],
      }
    }
    {
      // 获取的所有匹配数据，便于后期查找
      const matchGdp = content.match(/(生产总值).*?元/)
      const totalPopulation = (content.match(/(总人口|常住人口|户籍人口).*?人/))
      const ruralPopulation = (content.match(/(乡村人口|农业人口).*?人/))
      const townPopulation = (content.match(/(城镇人口|非农业人口|城镇常住人口).*?人/))
      const healthInstitution = (content.match(/(卫生机构).*?(所|个|家)/))
      const totalHospital = (content.match(/(医院).*?(所|个|家)/))
      const skillWorker = (content.match(/(卫生技术人员).*?(人)/))
      const totalDoctor = (content.match(/(((医师|师生|医生)))(\d.*?)(人)/))
      const totalDisposableIncome  = (content.match(/((全体居民人均可支配收入|常住居民人均可支配收入)).*?(元)/))
      const townDisposableIncome  = (content.match(/((城镇居民人均可支配收入|城镇常住居民人均可支配收入|城镇居民家庭年人均可支配收入)).*?(元)/))
      const ruralDisposableIncome  = (content.match(/((农村居民人均可支配收入|农村常住居民人均可支配收入|农村居民家庭年人均纯收入|乡村常住居民人均可支配收入|乡村居民家庭年人均纯收入|乡村居民人均可支配收入)).*?(元)/))
      const totalMedicalInsurance  = (content.match(/((基本医疗参保人数|基本医疗保险参保人数|基本医疗保险参保人数完成|参加基本医疗保险人数|城乡居民基本医疗保险参保人数|城乡居民基本医疗参保人数)).*?(人)/))
      totalRes = {
        totalGdp:matchGdp,
        totalPopulation:totalPopulation,
        ruralPopulation:ruralPopulation,
        townPopulation:townPopulation,
        healthInstitution:healthInstitution,
        totalHospital:totalHospital,
        skillWorker:skillWorker,
        totalDoctor:totalDoctor,
        totalDisposableIncome:totalDisposableIncome,
        townDisposableIncome:townDisposableIncome,
        ruralDisposableIncome:ruralDisposableIncome,
        totalMedicalInsurance:totalMedicalInsurance,
      }
    }
    return {singleRes,totalRes}
  }
  let singleRes = {} , totalRes = {}
  const correctUrlData = item
  res = await getStatisticsData(correctUrlData)
  singleRes = res.singleRes
  totalRes = res.totalRes
  singleRes.title = correctUrlData.title
  singleRes.url = correctUrlData.url
  totalRes.title = correctUrlData.title
  totalRes.url = correctUrlData.url
  singleRes.districtname = correctUrlData.districtname
  totalRes.districtname = correctUrlData.districtname
  return {singleRes,totalRes}
}
const handleImgAndPdf = async (dataList) => {
  let statisticsList = []
  // dataList = [{
  //   title: '2021年<span style="color:#FF5E52;">宝清县</span>国民经济和社会发展统计公报 2021',
  //   url: 'https://tjgb.hongheiku.com/xjtjgb/xj2020/33065.html',
  //   districtname: '宝清县',
  // }]
  for(let i = 0; i < dataList.length; i++){
    const {singleRes, totalRes} = await handleSearchByUrl(dataList[i])
    console.log(`获取${dataList[i].districtname}pdf数据成功`,singleRes)
    const file1 = path.join(__dirname, `save_pdf_list1.json`);
    fs.writeFile(file1, JSON.stringify(singleRes), { flag: 'a+' }, (err) => {})
    const file2 = path.join(__dirname, `save_pdf_list2.json`);
    fs.writeFile(file2, JSON.stringify(totalRes), { flag: 'a+' }, (err) => {})
    statisticsList.push(singleRes)
  }
  return statisticsList
}
const getJsonList = async () => {
  const file1 = path.join(__dirname, "save_hong_list1.json")
  const file2 = path.join(__dirname, "save_hong_list2.json")
  const file3 = path.join(__dirname, "save_bing_list1.json")
  const file4 = path.join(__dirname, "save_bing_list2.json")
  const pdffile = path.join(__dirname, "save_pdf_list.json")
  const statisticsList1 = fs.readFileSync(file1,'utf-8')
  const statisticsList2 = fs.readFileSync(file2,'utf-8')
  const statisticsList3 = fs.readFileSync(file3,'utf-8')
  const statisticsList4 = fs.readFileSync(file4,'utf-8')
  const statisticsListPdf = fs.readFileSync(pdffile,'utf-8')
  let jsonList1 = JSON.parse(statisticsList1)
  let jsonList2 = JSON.parse(statisticsList2)
  let jsonList3 = JSON.parse(statisticsList3)
  let jsonList4 = JSON.parse(statisticsList4)
  let jsonListPdf = JSON.parse(statisticsListPdf)
  // 去除过长数据
  jsonList1.forEach(item => {
    for(let key in item) {
      if(item[key] && item[key].length > 30000){
        item[key] = item[key].substring(0, 30000)
      }
    }
  })
  jsonList2.forEach(item => {
    for(let key in item) {
      if(item[key] && item[key].length > 30000){
        item[key] = item[key].substring(0, 30000)
      }
    }
  })
  jsonList3.forEach(item => {
    for(let key in item) {
      if(item[key] && item[key].length > 3000){
        item[key] = item[key].substring(0, 3000)
      }
    }
  })
  jsonList4.forEach(item => {
    for(let key in item) {
      if(item[key] && item[key].length > 30000){
        item[key] = item[key].substring(0, 30000)
      }
    }
  })
  // 合并数据
  let jsonList5 = JSON.parse(JSON.stringify(jsonList1))
  {
    let gdpCount = 0
    let urlConunt = 0
    for(let i = 0; i < jsonList5.length; i++) {
      if(!jsonList5[i].url) {
        if(jsonList3[i].url) {
          jsonList5[i] = jsonList3[i]
        }
      }
    }
    jsonList5.forEach((item, index) => {
      if(item.url) urlConunt ++
      if(item.totalGdp) gdpCount ++
    })
    console.log('urlConunt',urlConunt)
    console.log('gdpCount',gdpCount)
  }
  jsonList6 = jsonListPdf
  let finalList = JSON.parse(JSON.stringify(jsonList5))
  {
    let gdpCount = 0
    let urlConunt = 0
    for(let i = 0; i < finalList.length; i++) {
      if(finalList[i].url && !finalList[i].totalGdp) {
        jsonList6.forEach(element => {
          if(finalList[i].districtname == element.districtname){
            finalList[i] = element
          }
        })
      }
    }
    finalList.forEach((item, index) => {
      if(item.url) urlConunt ++
      if(item.totalGdp) gdpCount ++
    })
    console.log('urlConunt',urlConunt)
    console.log('gdpCount',gdpCount)
  }
  // 数据处理
  {
    
  }
  return {jsonList1, jsonList2, jsonList3, jsonList4, jsonList5, jsonList6, finalList}
}
const jsonToXlsx = (jsonList1, jsonList2,jsonList3, jsonList4, jsonList5, jsonList6, finalList) => {
  const jsonWorkSheet1 = XLSX.utils.json_to_sheet(jsonList1)
  const jsonWorkSheet2 = XLSX.utils.json_to_sheet(jsonList2)
  const jsonWorkSheet3 = XLSX.utils.json_to_sheet(jsonList3)
  const jsonWorkSheet4 = XLSX.utils.json_to_sheet(jsonList4)
  const jsonWorkSheet5 = XLSX.utils.json_to_sheet(jsonList5)
  const jsonWorkSheet6 = XLSX.utils.json_to_sheet(jsonList6)
  const jsonWorkSheet7 = XLSX.utils.json_to_sheet(finalList)
  const workBook = {
    SheetNames: ['红黑库单条数据','红黑库多条数据','必应单条数据','必应多条数据','合并单条数据','PDF数据', '最终数据'],
    Sheets: {
      '红黑库单条数据': jsonWorkSheet1,
      '红黑库多条数据': jsonWorkSheet2,
      '必应单条数据': jsonWorkSheet3,
      '必应多条数据': jsonWorkSheet4,
      '合并单条数据': jsonWorkSheet5,
      'PDF数据': jsonWorkSheet6,
      '最终数据': jsonWorkSheet7,
    }
  };
  const filepath = path.join(__dirname, "savedata.xlsx")
  XLSX.writeFile(workBook, filepath);
}

(async () => {
  let {jsonList1, jsonList2, jsonList3, jsonList4, jsonList5, jsonList6, finalList} = await getJsonList()
  jsonToXlsx(jsonList1, jsonList2, jsonList3, jsonList4, jsonList5, jsonList6, finalList)
})()
