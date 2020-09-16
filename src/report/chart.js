const fs = require('fs');
const path = require('path');
const settings = require('../../config.json');
const { chromium } = require('playwright-chromium');

/*
* Download screenshots trend charts from Web PnP Report page.
*/
async function dlCharts(deviceInfos, platform, browserInfo, workloads) {
  let date = new Date();
  let isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  let prefixDate = isoDate.toISOString().substring(0, 10).replace(/-/g, '');

  let chartsDir = path.join(process.cwd(), 'charts');
  if (!fs.existsSync(chartsDir)) {
    fs.mkdirSync(chartsDir);
  }

  let cpu = "", gpu = "";
  const browserName = browserInfo.split('-')[0];
  const browserChannel = browserInfo.split('-')[1];

  for (let deviceInfo of deviceInfos) {
    cpu += `&cpu=${deviceInfo['CPU']['info']}`;
    gpu += `&gpu=${deviceInfo['GPU']}`;
  }

  const idSuffix = `_${platform}_${browserName}_${browserChannel}`;
  let selectors = {
    'Speedometer2': { name: "Speedometer 2.0", id: '#Speedometer_2_0' },
    'WebXPRT3': { name: 'WebXPRT 3', id: '#WebXPRT_3' },
    'Unity3D': { name: 'Unity3D2018', id: '#Unity3D2018' },
    'JetStream2': { name: 'JetStream2', id: '#JetStream2' }
  };

  const browser = await chromium.launch({
    headless: true,
    // executablePath: "C:\\Users\\wlin19\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe",
    args: ['--window-size=1920,1080']
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  const chart_page_host = "http://webpnp.sh.intel.com/pnp/chart/";

  let i = 1;
  for (let workload of workloads) {
    let chart_page_param = `?workload=${selectors[workload]['name']}&channel=${browserChannel}&os=${platform}&browser=${browserName}${cpu + gpu}`;
    let chart_page_url = chart_page_host + chart_page_param;
    console.log("chart page url: ", chart_page_url);
    await page.goto(chart_page_url, { waitUntil: 'load', timeout: 60000 });
    // Leaves some time to wait for chart fully rendered
    await page.waitForTimeout(5 * 1000);
    await page.waitForSelector(selectors[workload]['id'] + idSuffix, { timeout: 10 * 1000 });
    let element = await page.$(selectors[workload]['id'] + idSuffix);
    console.log(`Downloading trends image for ${workload}`);
    await element.screenshot({
      path: path.join(process.cwd(), 'charts', `${prefixDate}-${i++}-${workload}-${platform}-${browserInfo}-trends.png`)
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
* Move chart image files to /report/html/charts/
*/
async function moveChartFiles(charts) {
  const oldChartsDir = path.join(settings.result_server.reportDir, 'html', 'charts');
  if (charts.length > 0) {
    for (let chart of charts) {
      const oldPath = path.join(process.cwd(), 'charts', chart);
      const newPath = path.join(oldChartsDir, chart);
      await fs.promises.rename(oldPath, newPath);
    }
  }
  return Promise.resolve();
}

/*
* Remove the chart image files after sending the email report.
*/
async function cleanUpChartFiles() {
  let chartFiles = await getChartFiles();
  if (chartFiles.length !== 0) {
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
  cleanUpChartFiles: cleanUpChartFiles,
  moveChartFiles: moveChartFiles
};
