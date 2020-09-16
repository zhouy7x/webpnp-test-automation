"use strict";

const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const chart = require('./chart.js');
const settings = require('../../config.json');
const { report } = require('process');
/*
* Draw table header
* @param {String}, type, one of ["summary", "details"]
*/
function drawTableHeader(type, basedResult, preBasedResult, competitorResult, preComResult) {
  let preCpu = "", preOs = "", preBrowser = "", basedVsPre = "";
  let comCpu = "", comOs = "", comBrowser = "", basedVsCom = "</tr>";
  let preComCpu = "", preComOs = "", preComBrowser = "", ComVsPre = "";
  let firstCol = "Workloads";
  if (type !== "summary")
    firstCol = basedResult.workload;
  if (preBasedResult !== "") {
    preCpu = `<th>${preBasedResult.device_info.CPU.info}</th>`;
    preOs = `<th>${preBasedResult.device_info.OS}</th>`;
    preBrowser = `<th>${preBasedResult.device_info.Browser}</th>`;
    basedVsPre = `<th rowspan='3' >Chrome vs. previous<br>(${basedResult.device_info.CPU.codename})</th>`;
  }
  if (competitorResult !== "") {
    comCpu = `<th>${competitorResult.device_info.CPU.info}</th>`;
    comOs = `<th>${competitorResult.device_info.OS}</th>`;
    comBrowser = `<th>${competitorResult.device_info.Browser}</th>`;
    basedVsCom = `<th rowspan='3'>${basedResult.device_info.CPU.codename} vs. ${competitorResult.device_info.CPU.codename}</th></tr>`;
    if (preComResult !== "") {
      preComCpu = `<th>${preComResult.device_info.CPU.info}</th>`;
      preComOs = `<th>${preComResult.device_info.OS}</th>`;
      preComBrowser = `<th>${preComResult.device_info.Browser}</th>`;
      ComVsPre = `<th rowspan='3'>Chrome vs. previous<br>(${preComResult.device_info.CPU.codename})</th>`;
    }
  }
  const tableHeader = `<tr><th rowspan="3">${firstCol}</th>\
      ${preComCpu + preCpu + comCpu}<th>${basedResult.device_info.CPU.info}</th>${ComVsPre + basedVsPre + basedVsCom}\
      <tr>${preComOs + preOs + comOs}<th>${basedResult.device_info.OS}</th></tr>\
      <tr>${preComBrowser + preBrowser + comBrowser}<th>${basedResult.device_info.Browser}</th></tr>`;
  return tableHeader;
}

function drawRoundsHeader(basedResult, competitorResult) {
  let comCol = "</tr>";
  let basedRoundCol = "<tr>", comRoundCol = "";
  const basedResultLength = basedResult.test_rounds.length;
  for (let i = 0; i < basedResultLength; i++) {
    basedRoundCol += `<th>Round ${i + 1}</th>`;
  }

  let header = `<tr><th rowspan='2'>Workloads</th><th colspan='${basedResultLength}'>\
    ${basedResult.device_info.CPU.info + " " + basedResult.device_info.Browser}</th>`;
  if (competitorResult !== "") {
    const comResultLength = competitorResult.test_rounds.length;
    for (let i = 0; i < comResultLength; i++) {
      comRoundCol += `<th>Round ${i + 1}</th>`;
    }
    comCol = `<th colspan='${comResultLength}'>\
      ${competitorResult.device_info.CPU.info + " " + competitorResult.device_info.Browser}</th></tr>`;
  }
  header = header + comCol + basedRoundCol + comRoundCol + "</tr>";
  return header;
}

function drawRoundsResult(basedResult, competitorResult) {
  let basedResultCol = `<tr><td>${basedResult.workload}</td>`;
  let comResultCol = "";
  const selectedStyle = "style='background-color: #4CAF50;'";
  for (let i = 0; i < basedResult.test_rounds.length; i++) {
    if (basedResult.test_rounds[i] !== undefined) {
      if (i === basedResult.selected_round)
        basedResultCol += `<td ${selectedStyle}>${basedResult.test_rounds[i].scores["Total Score"]}</td>`;
      else
        basedResultCol += `<td>${basedResult.test_rounds[i].scores["Total Score"]}</td>`;
    } else {
      basedResultCol += "<td> - </td>";
    }
  }
  if (competitorResult !== "") {
    for (let i = 0; i < competitorResult.test_rounds.length; i++) {
      if (competitorResult.test_rounds[i] !== undefined) {
        if (i === competitorResult.selected_round)
          comResultCol += `<td ${selectedStyle}>${competitorResult.test_rounds[i].scores["Total Score"]}</td>`;
        else
          comResultCol += `<td>${competitorResult.test_rounds[i].scores["Total Score"]}</td>`;
      } else {
        comResultCol += "<td> - </td>";
      }
    }
  }
  const resultCol = basedResultCol + comResultCol + "</tr>";
  return resultCol;
}

function drawResultTable(basedResult, preBasedResult, competitorResult, preComResult, hasPreResult) {
  let summaryCol = "";
  let resultTable = "<table>" + drawTableHeader("details", basedResult, preBasedResult, competitorResult, preComResult);

  for (const key of Object.keys(basedResult.test_result)) {
    const basedValue = basedResult.test_result[key];
    // Get info from preBasedResult
    let preValue = "", preCol = "", basedVsPreCol = "";
    if (preBasedResult !== "") {
      preValue = preBasedResult.test_result[key];
      preCol = `<td>${preValue}</td>`;
      basedVsPreCol = drawCompareResult(basedValue, preValue);
      if (basedResult.workload === "WebXPRT3" && key !== "Total Score") {
        basedVsPreCol = drawCompareResult(preValue, basedValue);
      }
    }
    // Get info from competitorResult
    let competitorCol = "", basedVsComCol = "", competitorValue = "";
    let preComValue = "", preComCol = "", comVsPreComCol = "";
    if (competitorResult !== "") {
      competitorValue = competitorResult.test_result[key];
      basedVsComCol = drawCompareResult(basedValue, competitorValue);
      if (basedResult.workload === "WebXPRT3" && key !== "Total Score") {
        basedVsComCol = drawCompareResult(competitorValue, basedValue);
      }
      competitorCol = `<td>${competitorValue}</td>`;
      // Get info from preComResult
      if (preComResult !== "") {
        preComValue = preComResult.test_result[key];
        preComCol = `<td>${preComValue}</td>`;
        comVsPreComCol = drawCompareResult(competitorValue, preComValue);
        if (basedResult.workload === "WebXPRT3" && key !== "Total Score") {
          comVsPreComCol = drawCompareResult(preComValue, competitorValue);
        }
      }
    }
    // Draw resultTable
    let otherCols = `${preComCol + preCol + competitorCol}<td>${basedValue}</td>${comVsPreComCol + basedVsPreCol + basedVsComCol}</tr>`;
    resultTable += `<tr><td>${key}</td>${otherCols}`;
    // Draw summaryCol
    if (key == "Total Score") {
      if (preBasedResult === "" && hasPreResult) {
        preComCol = "<td>-</td>";
        preCol = "<td>-</td>";
        basedVsPreCol = "<td>-</td>";
      }
      summaryCol = `<tr><td>${basedResult.workload}</td>${otherCols}`;
    }
  }

  return { "all": `${resultTable}</table>`, "summaryCol": summaryCol };
}

async function findPreTestResult(resultPath) {
  // Find previous test results under old-results folder
  resultPath = resultPath.replace('new-results', 'old-results');
  let dir = await fs.promises.readdir(path.dirname(resultPath));
  // Gets cpu info from the test report file, e.g. Intel-KBL-i5-8350U
  const currentCPU = path.basename(resultPath).split('_')[1];
  const currentBrowser = path.basename(resultPath).split('_')[2];
  const currentBrowserChannel = currentBrowser.split('-')[1];
  if (dir.length == 0)
    return Promise.reject("Error: no test result found!");
  else if (dir.length == 1)
    return Promise.resolve("");
  else {
    let dirents = [];
    for (const dirent of dir) {
      // We only compare same CPU versions and previous browser version
      const prevBrowser = dirent.split('_')[2];
      const prevBrowserChannel = prevBrowser.split('-')[1];
      if (currentCPU === dirent.split('_')[1] && currentBrowserChannel === prevBrowserChannel &&
        compareVersion(currentBrowser, prevBrowser))
        dirents.push(dirent);
    }
    if (dirents.length > 0) {
      const comparedPath = path.join(path.dirname(resultPath), dirents.sort().pop());
      console.log("Found the previous test result: ", comparedPath);
      const rawComparedData = await fsPromises.readFile(comparedPath, 'utf-8');
      const preBasedResult = JSON.parse(rawComparedData);
      return Promise.resolve(preBasedResult);
    } else {
      return Promise.resolve("");
    }
  }
}

function compareVersion(currentVersion, prevVersion) {
  if (currentVersion === prevVersion)
    return false;
  const currentVersionArr = currentVersion.split('.');
  const prevVersionArr = prevVersion.split('.');
  let compareResult = false;
  for (let i = 0; i < currentVersionArr.length; i++) {
    if (parseInt(currentVersionArr[i]) > parseInt(prevVersionArr[i])) {
      compareResult = true;
      break;
    }
  }
  return compareResult;
}

// Draw comparison result with style
// green for result >= 100%, yellow for 99.99% < result < 95%, red for result <= 95%
function drawCompareResult(basedValue, comparedValue) {
  const result = Math.round(((basedValue / comparedValue) * 100) * 100) / 100;
  let resultStyle = "";
  if (result >= 100)
    resultStyle = "#4CAF50";
  else if (result < 100 && result > 95)
    resultStyle = "#D1B100";
  else
    resultStyle = "red";
  return `<td style="color:${resultStyle}">${result}%</td>`;
}

function drawDeviceInfoTable(deviceInfos) {
  let deviceInfoTable = "<table>";
  let header = `<tr><th>Category</th>`;
  let body = '';
  for (const key in deviceInfos[0]) {
    body += `<tr><td>${key}</td>`;
    for (let deviceInfo of deviceInfos) {
      if (key === "CPU") {
        header += `<th>${deviceInfo[key].info}</th>`;
        body += `<td>${deviceInfo[key]['info']}</td>`;
      } else {
        body += `<td>${deviceInfo[key]}</td>`;
      }
    }
    body += `</tr>`;
  }
  deviceInfoTable += header + "</tr>" + body + "</table>";
  return deviceInfoTable;
}

async function hasPreResults(basedResults) {
  for (const key in basedResults) {
    const resultPath = basedResults[key];
    // Find previous test result
    const preBasedResult = await findPreTestResult(resultPath);
    if (preBasedResult !== "")
      return Promise.resolve(true);
  }
  return Promise.resolve(false);

}

/*
* Generate one pair of test report
* @param: {String}, basedResults, an object reprensents for test result path
* @param: {Object}, competitorResults, an object reprensents for test result path to compare with
* @param: {Object}, object with one pair of test report's summary, details and etc.
*/
async function genOnePairReport(basedResults, competitorResults) {
  // Get test result table
  let resultTables = "";
  let summaryTable = "<table>";
  let roundsTable = "<table>";
  let basedResult, competitorResult;
  let flag = false;
  const hasPreResult = await hasPreResults(basedResults);
  for (const key in basedResults) {
    const resultPath = basedResults[key];
    const competitorPath = competitorResults[key];

    // Get basedResult
    if (!fs.existsSync(resultPath)) {
      return Promise.reject(`Error: file: ${resultPath} does not exist!`);
    } else {
      const rawData = await fsPromises.readFile(resultPath, 'utf-8');
      basedResult = JSON.parse(rawData);
    }
    // Get competitorResult
    if (!fs.existsSync(competitorPath)) {
      return Promise.reject(`Error: file: ${competitorPath} does not exist!`);
    } else {
      const rawData = await fsPromises.readFile(competitorPath, 'utf-8');
      competitorResult = JSON.parse(rawData);
    }

    // Draw result table
    // Find previous test result
    const preBasedResult = await findPreTestResult(resultPath);
    let preComResult = "";
    // Find competitor test result
    if (competitorPath !== "")
      preComResult = await findPreTestResult(competitorPath);
    if (!flag) {
      summaryTable += drawTableHeader("summary", basedResult, preBasedResult, competitorResult, preComResult);
      roundsTable += drawRoundsHeader(basedResult, competitorResult);
    }
    const resultTable = drawResultTable(basedResult, preBasedResult, competitorResult, preComResult, hasPreResult);
    resultTables += `${resultTable.all}<br>`;
    summaryTable += resultTable.summaryCol;
    roundsTable += drawRoundsResult(basedResult, competitorResult);
    flag = true;
  }
  summaryTable += "</table><br>";
  roundsTable += "</table><br><br>";

  let html = {};
  html['summaryTables'] = summaryTable + roundsTable;
  html['resultTables'] = resultTables;

  return Promise.resolve(html);
}

/*
* Generate test report as html
* @param: {Object}, workloadResults, object list of base and competitor workload results
* @param: {Object}, deviceInfos, object list of device infos
* @param: {String}, platform
* @param: {String}, browser
*/
async function genTestReport(workloadResults, deviceInfos, platform, browser) {
  console.log("********** Generate test report as html **********");

  let summaryTables = "", resultTables = "";
  for (let workloadResult of workloadResults) {
    const basedResults = workloadResult.basedResults;
    const competitorResults = workloadResult.comparedResults;
    const onePairHtml = await genOnePairReport(basedResults, competitorResults);
    summaryTables += onePairHtml.summaryTables;
    resultTables += onePairHtml.resultTables + '<hr><br/>';
  }
  // Get device info table
  const deviceInfoTable = drawDeviceInfoTable(deviceInfos);
  // Define html style
  const htmlStyle = "<style> \
		* {font-family: Calibri (Body);} \
	  table {border-collapse: collapse;} \
    table, td, th {border: 1px solid black;} \
    td {padding-left: 3px;} \
    th {background-color: #0071c5; color: #ffffff; font-weight: normal; padding: 5px;} \
		</style>";
  // Composite html body
  let charts = await chart.getChartFiles();
  let chartImagesMail = '<br/>', chartImages = '<br/>';
  const reportUrl = 'http://powerbuilder.sh.intel.com/project/webpnp/html/';
  if (charts.length > 0) {
    for (let chart of charts) {
      chartImages += `<img src="${reportUrl + 'charts/' + ${chart} }"><br/><br/>`;
      chartImagesMail += '<img src="cid:' + chart.replace('.png', '') + '" style="width:480px;height:360px;"><br/>';
    }
  }
  const html = htmlStyle + chartImages + "<br/><b>Summary:</b><br><br>" + summaryTables + "<hr><br><b>Details:</b>"
    + resultTables + "" + "<b>Device Info:</b><br><br>" + deviceInfoTable;
  console.log(`******Generate detailed results as html to ${settings.result_server.reportDir}/html/******`);
  await fsPromises.writeFile(`${settings.result_server.reportDir}/html/${platform}_${browser}.html`, html);
  const htmlLink = `${reportUrl + platform}_${browser}.html`;
  const mailHtml = htmlStyle + chartImagesMail + "<br/><b>Summary:</b><br><br>" + summaryTables + "<br><b>Details:</b> " + htmlLink
    + "<br><br><b>Device Info:</b><br><br>" + deviceInfoTable;
  return Promise.resolve(mailHtml);
}

module.exports = genTestReport;