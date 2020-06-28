const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const xl = require('excel4node');
const run = require('./run.js');
const settings = require('../config.json');


/*
* Get excel filename base on JSON file path
*/
function getExcelFilename(deviceInfo) {

  let date = new Date();
  let isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  let dateText = isoDate.toISOString().split('.')[0].replace(/T|-|:/g, '');

  let cpu = deviceInfo["CPU"]["info"];
  cpu = cpu.replace(/\s/g, "-");
  let brand = deviceInfo["CPU"]["mfr"];
  let platform = deviceInfo["OS"];
  platform = platform.replace(/\s/g, "");
  let browser = deviceInfo["Browser"];

  let excelFileName = [dateText, brand, cpu, platform, browser, "flags"].join('_') + '.xlsx';
  return excelFileName;
}

/*
* Write the test results stored in JSON files to excel
* 
*/
async function genMultiFlagsResultsToExcel(fileInfos, deviceInfo) {
  let excelFileName = getExcelFilename(deviceInfo);
  console.log(`Excel file name: ${excelFileName}`);

  let excelDir = path.join(process.cwd(), 'flagsExcel');
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, {recursive: true});
  }
  let excelPathName = path.join(excelDir, excelFileName);

  await writeDataToExcel(excelPathName, fileInfos);

  return Promise.resolve();
}

/*
* Write JSON object to an excel file
*/
async function writeDataToExcel(pathname, fileInfos) {
  let wb = new xl.Workbook();

  let ws = wb.addWorksheet('Index');
  let deviceInfo = '';
  // Add first two headers
  ws.cell(1, 1).string('Workloads');
  ws.cell(1, 2).string('CaseId');
  let resultList = [];
  for (const fileInfo of fileInfos) {
    let results = {};
    for (let workload in fileInfo) {
      let resultFilePath = fileInfo[workload];
  
      if (!fs.existsSync(resultFilePath)) {
        return Promise.reject(`${resultFilePath} does not exist, failed to write to Excel!`);
      }
      let rawData = await fsPromises.readFile(resultFilePath, 'utf-8');
      results[workload] = JSON.parse(rawData);
    }
    resultList.push(results);
  }

  let workloadCol = [];
  let caseIdCol = [];
  let scoreCols = [];
  let once = true;
  // Loop through all results of chrome flags
  for (let i=0; i < resultList.length; i++) {
    let secondOnce = true;
    let scoreCol = [];
    // Loop through results of workloads in one round
    for (let workload in resultList[i]) {
      let workloadResult = resultList[i][workload];
      // Since we combined one round of test result with multiple workloads into one column,
      // so only need to add header name once here.
      if (secondOnce) {
        let flagName = workloadResult['chrome_flags'];
        // Add header name for each chrome flag
        ws.cell(1, 3 + i).string(flagName.join(","));
      }
      for (let key in workloadResult['test_result']) {
      // for (let subCase in workloadResult['test_result']) {
        if (once) {
          workloadCol.push(workload);
          caseIdCol.push(key);
        }
        scoreCol.push(workloadResult['test_result'][key]);
      }
      secondOnce = false;
    }
    scoreCols.push(scoreCol);
    once = false;
  }

  // Insert workload name column and case id column
  for (let i=0; i<workloadCol.length; i++) {
    ws.cell(2+i, 1).string(workloadCol[i]);
    ws.cell(2+i, 2).string(caseIdCol[i]);
  }

  // Insert score columns
  for (let i=0; i<scoreCols.length; i++) {
    for(let j=0; j<scoreCols[i].length; j++) {
      ws.cell(2+j, 3+i).string(scoreCols[i][j]);
    }
  }
  await wb.write(pathname);
  console.log(`************Excel generation at: ${pathname}*****************`);

  return Promise.resolve();
}

// const workloadFiles = [
//   {
//     "Speedometer2": "C:\\honry\\webpnp-test-automation\\results\\Windows\\Speedometer2\\20200624104432_Intel-WHL-i5-8350U_Chrome-Canary-85.0.4178.0.json",
//     "WebXPRT3": "C:\\honry\\webpnp-test-automation\\results\\Windows\\WebXPRT3\\20200624110115_Intel-WHL-i5-8350U_Chrome-Canary-85.0.4178.0.json"
//   },
//   {
//     "Speedometer2": "C:\\honry\\webpnp-test-automation\\results\\Windows\\Speedometer2\\20200624110525_Intel-WHL-i5-8350U_Chrome-Canary-85.0.4178.0.json",
//     "WebXPRT3": "C:\\honry\\webpnp-test-automation\\results\\Windows\\WebXPRT3\\20200624112208_Intel-WHL-i5-8350U_Chrome-Canary-85.0.4178.0.json"
//   }
// ];

// const deviceInfo = {
//   CPU: {
//     mfr: 'Intel',
//     info: 'WHL i5-8350U',
//     codename: 'WHL',
//     brand: 'i5-8350U'
//   },
//   GPU: 'UHD Graphics 620',
//   'GPU Driver Version': '26.20.100.7584',
//   Memory: '16G',
//   Hardware: 'LENOVO ThinkPad T480',
//   OS: 'Windows 10',
//   'OS Version': '10.0.17763',
//   Browser: 'Chrome-Canary-85.0.4178.0'
// }

// genMultiFlagsResultsToExcel(workloadFiles, deviceInfo);
module.exports = {
  genMultiFlagsResultsToExcel: genMultiFlagsResultsToExcel
};
