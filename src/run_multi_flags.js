"use strict";


const genDeviceInfo = require('./get_device_info.js');
const runTest = require('./run.js');
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
  } catch (err) {
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
    ["--ui-disable-partial-swap"],
    ["--disable-javascript-harmony-shipping"],
    ["--javascript-harmony"],
    ["--data-reduction-proxy-experiment=alt1"],
    ["--data-reduction-proxy-experiment=alt3"],
    ["--data-reduction-proxy-experiment=alt10"],
    ["--enable-features=ResourceLoadingHints"],
    ["--blink-settings=disallowFetchForDocWrittenScriptsInMainFrame=true"],
    ["--blink-settings=disallowFetchForDocWrittenScriptsInMainFrame=false"],
    ["--enable-features=MidiManagerWinrt"],
    ["--enable-features=HeavyAdIntervention"],
    ["--enable-features=HeavyAdPrivacyMitigations"],
    ["--enable-experimental-cookie-features"],
    ["--enable-features=TranslateSubFrames"]
  ];
  let workloadFiles = [];

  // Loop testing flags
  for (let i = 0; i < flagList.length; i++) {
    const deviceInfo = await genDeviceInfo();
    // if (i > 0)
      await updateConfig(flagList[i]);
    let workloadFile = await runWithFlag(deviceInfo);
    workloadFiles.push(workloadFile);
    // if ( i%5 == 0 ) {
    //   await genMultiFlagsResultsToExcel(workloadFiles, deviceInfo);
    //   workloadFiles = [];
    // }
  }
  // if (workloadFiles.length !== 0) {
  //   await genMultiFlagsResultsToExcel(workloadFiles, deviceInfo);
  // }
  return Promise.resolve();

})();