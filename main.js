"use strict";


const genDeviceInfo = require('./src/get_device_info.js');
const runTest = require('./src/run.js');
const browser = require('./src/browser.js');
const genSingleReport = require('./src/gen_single_report.js');
const sendMail = require('./src/send_mail.js');
const settings = require('./config.json');
const excel = require('./src/excel.js');
const cron = require('node-cron');
const moment = require('moment');
const os = require('os');
const GetChromiumBuild = require('./src/get_chromium_build.js');

const cpuModel = os.cpus()[0].model;
const platform = runTest.getPlatformName();

async function main() {

  let now = moment();
  const weekAndDay = now.week() + '.' + now.day();

  let deviceInfo = {};
  let subject = "";
  try {
    // Use private chroimum build if chromium build is enabled
    if (settings["chromium_builder"]["enable_chromium_build"]) {
      const commitId = settings["chromium_builder"]["commit_id"];
      if (commitId !== "") {
        subject = `Web PnP auto test report on ${platform} with commit id: ${commitId}`;
        await GetChromiumBuild(commitId);
      } else {
        throw Error("Commit id should be specific in config.json if you run with chromium build");
      }
    }

    deviceInfo = await genDeviceInfo();
    if (subject === "")
      subject = '[W' + weekAndDay + '] Web PnP auto test report - ' + platform + ' - ' + deviceInfo["CPU"]["info"] + ' - ' + deviceInfo.Browser;
    console.log("Subject: ", subject);

    const workloadResults = await runTest.genWorkloadsResults(deviceInfo);
    console.log(JSON.stringify(workloadResults, null, 4));
    if (!settings.dev_mode) {
      // Upload each testing result as excel to webpnp test reporter
      const remoteExcelPathName = await excel.genExcelFilesAndUpload(workloadResults);
      await excel.remoteExecUploadScript(remoteExcelPathName); // upload the .xlsx data
    }

    const mailType = 'dev_notice';
    const testReports = await genSingleReport(workloadResults);
    console.log(subject);
    await sendMail(subject, testReports, mailType, []);
  } catch (err) {
    console.log(err);
    let subject = '[W' + weekAndDay + '] Auto test failed on ' + platform + '-' + cpuModel;
    console.log(subject);
    await sendMail(subject, err, 'failure_notice');
  }
}


if (settings.enable_cron) {
  cron.schedule(settings.update_browser_sched, () => {
    browser.updateChrome();
  });
  cron.schedule(settings.test_cadence, () => {
    main();
  });
} else {
  main();
}
