const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const excelUtils = require("./excelUtils");

const handleSearch = async (districtname,type) => {
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
      await browser.close();
    }catch(e) {
      console.log(e)
    }
    return content
  }
  const hongheikuSearch = async function(name) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    let url = ""
    if(type == 'hong') {
      url = `https://tjgb.hongheiku.com/?s=${name}`
    }else if(type == 'bing') {
      url = `https://www.bing.com/search?q=${name} 统计公报 2021`
    }
    await page.goto(url);
    // await page.waitForTimeout(1000);
    let content = await page.content()
    await browser.close();
    return content;
  }
  const getUrlAndTitle = function(str) {
    const pattern = new RegExp("<h2><a.*?</a></h2>",'g')
    const list = str.match(pattern)
    let dataList = []
    if(list && list.length > 0) {
      for(let i = 0; i < list.length; i++) {
        const titlePattern = new RegExp("(?<=(\">)).*?(?=(</a></h2>))")
        const title = list[i].match(titlePattern)[0]
        const urlPattern = new RegExp("(?<=(href=\")).*?(?=(\"))")
        const url = list[i].match(urlPattern)[0]
        dataList.push({title, url})
      }
    }
    return dataList
  }
  const getCorrectUrl = function(list) {
    let res = []
    if(list && list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        const titlePattern1 = new RegExp(districtname)
        const titlePattern2 = new RegExp("2020")
        const titlePattern3 = new RegExp("统计公报")
        if(titlePattern1.test(list[i].title) && titlePattern2.test(list[i].title) && titlePattern3.test(list[i].title)) {
          res = list[i]
          break
        }
      }
    }
    return res
  }
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
  // 红黑库网站搜索DOM
  const hongheikuContent = await hongheikuSearch(districtname)
  // DOM匹配所有链接和标题
  const urlAndTitleList = getUrlAndTitle(hongheikuContent)
  // DOM匹配正确的链接和标题
  let correctUrlData = {}
  if(urlAndTitleList && urlAndTitleList.length > 0) {
    correctUrlData = getCorrectUrl(urlAndTitleList)
  }
  console.log(correctUrlData)
  let singleRes = {} , totalRes = {}
  if(correctUrlData && correctUrlData.url) {
    res = await getStatisticsData(correctUrlData)
    singleRes = res.singleRes
    totalRes = res.totalRes
    singleRes.title = correctUrlData.title
    singleRes.url = correctUrlData.url
    totalRes.title = correctUrlData.title
    totalRes.url = correctUrlData.url
  }
  singleRes.districtname = districtname
  totalRes.districtname = districtname
  return {singleRes,totalRes}
}
const saveData = async (districtList,type) => {
  let statisticsList1 = [],statisticsList2 = [],statisticsList3 = [],statisticsList4 = []
  for(let i = 0; i < districtList.length; i++){
    const name = districtList[i]
    const {singleRes,totalRes} = await handleSearch(name,type)
    for(let key in totalRes){
      totalRes[key] = totalRes[key] && JSON.stringify(totalRes[key])
    }
    if(type == 'hong') {
      statisticsList1.push(singleRes)
      statisticsList2.push(totalRes)
    }else if(type == 'bing') {
      statisticsList3.push(singleRes)
      statisticsList4.push(totalRes)
    }
    const saveRes1 = JSON.stringify(singleRes)+',';
    const file1 = path.join(__dirname, `save_${type}_list1.json`);
    fs.writeFile(file1, saveRes1, { flag: 'a+' }, (err) => {})
    const saveRes2 = JSON.stringify(totalRes)+',';
    const file2 = path.join(__dirname, `save_${type}_list2.json`);
    fs.writeFile(file2, saveRes2, { flag: 'a+' }, (err) => {})
    console.log(`获取${type}第${i+1}条${name}数据成功`)
  }
  return {statisticsList1, statisticsList2, statisticsList3, statisticsList4}
}
(async () => {
  // let districtList = excelUtils.handleDistrict()
  const districtList = ['海林市','虎林市','巴彦县']
  // districtList = districtList.splice(1262)
  // console.log(districtList)
  const {statisticsList1, statisticsList2} = await saveData(districtList,'hong')
  // const {statisticsList3, statisticsList4} = await saveData(districtList,'bing')
  // excelUtils.newSaveToXlsx(statisticsList1,statisticsList2,statisticsList3,statisticsList4)
  console.log(`保存xlsx汇总数据成功`)
})()
