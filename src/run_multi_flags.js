"use strict";


const genDeviceInfo = require('./get_device_info.js');
const runTest = require('./run.js');
const genTestReport = require('./gen_test_report.js');
const sendMail = require('./send_mail.js');
const settings = require('../config.json');
const os = require('os');
const fs = require('fs');
const path = require('path');
const genMultiFlagsResultsToExcel = require('./gen_flags_result_to_excel.js');


const cpuModel = os.cpus()[0].model;
const platform = runTest.getPlatformName();

/**
 * Run one round testing with specific flag
 * Note: Before running, make sure results folder is cleaned up
 */
async function runWithFlag(deviceInfo) {
  let workloadResults = {};
  try {

    workloadResults = await runTest.genWorkloadsResults(deviceInfo);
    console.log(JSON.stringify(workloadResults, null, 4));

    // let mailType = 'test_report';
    // const testReports = await genTestReport(workloadResults);

    // let subject = 'Flags testing report - ' + platform + ' - ' + deviceInfo.Browser;
    // await sendMail(subject, testReports, mailType);
  } catch (err) {
    // console.log(err);
    // let subject = 'Web PnP weekly automation test failed on ' + platform + '-' + cpuModel;


    // console.log(subject);
    // await sendMail(subject, err, 'failure_notice');
  }
  return Promise.resolve(workloadResults);
}

/*
* Update config.json to set chrome flag, and dev_mode to true
*/
async function updateConfig(flag) {
  settings.chrome_flags = flag;
  settings.dev_mode = true;
  await fs.promises.writeFile(
    path.join(process.cwd(), 'config.json'),
    JSON.stringify(settings, null, 4));
  return Promise.resolve();
}


(async function main() {

  const flagList = [
    ['--new-canvas-2d-api'],
    ['--enable-features=UseSkiaRenderer']
  ];
  let workloadFiles = [];
  const deviceInfo = await genDeviceInfo();
  for (let flag of flagList) {
    await updateConfig(flag);
    const workloadFile = await runWithFlag(deviceInfo);
    workloadFiles.push(workloadFile);
  }
  await genMultiFlagsResultsToExcel(workloadFiles, deviceInfo);
  return Promise.resolve();

})();