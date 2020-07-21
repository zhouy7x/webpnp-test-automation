const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-chromium');
const settings = require('../config.json');
const platformBrowser = require('./browser.js');
const cpuList = require('../cpu_list.json');


/*
* Download screenshots trend charts from Web PnP Report page.
*/
async function dlCharts(deviceInfo) {

  let date = new Date();
  let isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  let prefixDate = isoDate.toISOString().substring(0,10).replace(/-/g, '');

  let chartsDir = path.join(process.cwd(), 'charts');
  if (!fs.existsSync(chartsDir)) {
    fs.mkdirSync(chartsDir);
  }

  platformBrowser.configChromePath(settings);
  const browser = await chromium.launch({
    headless: false,
    executablePath: settings.chrome_path,
    args: ['--start-maximized']
  });
  const context = await browser.newContext({viewport: null});
  const page = await context.newPage();
  const chart_page_host = "http://webpnp.sh.intel.com/pnp/chart/";
  // Intel CPU
  const cpu1 = deviceInfo['CPU']['info'];
  const cpu1_brand = deviceInfo['CPU']['brand'];

  // Competitor's CPU info
  const cpu2 = cpuList["Intel"][cpu1_brand]["competitor"];
  let os = "Windows";
  if (!deviceInfo['OS'].includes('Windows'))
    os = "Ubuntu";
  const browserName = "Chrome";

  const browserChannel = deviceInfo['Browser'].split('-')[1];
  const idSuffix = `_${os}_${browserName}_${browserChannel}`;
  let selectors = {
    'Speedometer2': {name: "Speedometer 2.0", id: '#Speedometer_2_0'},
    'WebXPRT3': {name: 'WebXPRT 3', id: '#WebXPRT_3' },
    'Unity3D': {name: 'Unity3D2018', id: '#Unity3D2018' },
    'JetStream2': {name: 'JetStream2', id: '#JetStream2' }
  };

  let i = 1;
  for (let workload of settings.workloads) {
    const workloadName = workload.name;
    let chart_page_param = `?workload=${selectors[workloadName]['name']}&channel=${browserChannel}&os=${os}&browser=${browserName}&cpu=${cpu1}&cpu=${cpu2}`;
    let chart_page_url = chart_page_host + chart_page_param;
    console.log("chart page url: ", chart_page_url);
    await page.goto(chart_page_url, { waitUntil: 'load', timeout: 60000 });
    // Leaves some time to wait for chart fully rendered
    await page.waitForTimeout(10*1000);
    await page.waitForSelector(selectors[workloadName]['id'] + idSuffix, {timeout: 10*1000});
    let element = await page.$(selectors[workloadName]['id'] + idSuffix);
    console.log(`Downloading trends image for ${workloadName}`);
    await element.screenshot({
        path: path.join(process.cwd(), 'charts', `${i++}-${prefixDate}-${workloadName}-trends.png`)
    });     
  }

  await browser.close();
}

/*
* Get all the chart files for insert into the email
*/
async function getChartFiles() {

  let chartsDir = path.join(process.cwd(), 'charts');

  if (!fs.existsSync(chartsDir))
    fs.mkdirSync(chartsDir);
  let chartFiles = await fs.promises.readdir(chartsDir);

  if (chartFiles.length === 0) {
    return Promise.resolve([]);
  } else {
    return Promise.resolve(chartFiles);
  }
}

/*
* Remove the chart image files after sending the email report.
*/
async function cleanUpChartFiles() {
  let chartFiles = await getChartFiles();
  if ( chartFiles.length !== 0 ) {
    for (let file of chartFiles) {
      let absChartFile = path.join(process.cwd(), 'charts', file);
      console.log(`Remove chart file: ${absChartFile}`);
      await fs.promises.unlink(absChartFile);
    }
  }

  return Promise.resolve();
}


module.exports = {
  dlCharts: dlCharts,
  getChartFiles: getChartFiles,
  cleanUpChartFiles: cleanUpChartFiles
};
