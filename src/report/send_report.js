"use strict";

const genTestReport = require('./gen_test_report.js');
const checkReport = require('./check_report.js');
const sendMail = require('../send_mail.js');
const reportConfig = require('./report_config.json');
const settings = require('../../config.json');
const chart = require('./chart.js');
const cron = require('node-cron');
const moment = require('moment');
const path = require('path');


async function main() {
  const newResultsDir = path.join(settings.result_server.reportDir, 'new-results');
  let now = moment();
  const weekAndDay = now.week() + '.' + now.day();
  const availableReports = await checkReport.checkAvailableReports(newResultsDir);
  // No available reports
  if (availableReports.length == 0)
    return;
  for (let availableReport of availableReports) {
    const platform = availableReport.platform;
    const browser = availableReport.browser;
    const channel = browser.split('-')[1];
    const workloads = reportConfig['channels'][channel]['workloads'];
    try {
      const deviceInfos = [];
      for (let key in availableReport.report) {
        deviceInfos.push(availableReport['report'][key]['device_info']);
      }
      let chartImages = [];
      // Download chart files
      await chart.cleanUpChartFiles();
      await chart.dlCharts(deviceInfos, platform, browser, workloads);
      chartImages = await chart.getChartFiles();
      console.log(chartImages);

      const allResults = [];
      for (let key in reportConfig['compare_list']) {
        const comparedDevice = reportConfig['compare_list'][key];
        const basedResults = availableReport['report'][key]['workloads'];
        const comparedResults = availableReport['report'][comparedDevice]['workloads'];
        allResults.push({ 'basedResults': basedResults, 'comparedResults': comparedResults });
      }
      // Generate all-in-one report as html
      const testReports = await genTestReport(allResults, deviceInfos, platform, browser);

      let subject = '[W' + weekAndDay + '] Web PnP auto test report - ' + platform + ' - ' + browser;
      let mailType = 'test_report';

      console.log("Subject: ", subject);
      await sendMail(subject, testReports, mailType, chartImages);
      await chart.moveChartFiles(chartImages);
      await checkReport.moveReportFiles(availableReport.report, platform);
    } catch (err) {
      console.log(err);
      let subject = '[W' + weekAndDay + '] Auto test failed on ' + platform + '-' + browser;
      console.log(subject);
      await sendMail(subject, err, 'failure_notice');
      await chart.cleanUpChartFiles();
    }
  }
  return Promise.resolve();
}

(async () => {
  // Run every 6h
  cron.schedule("* * */6 * * *", () => {
    await main();
  });
})();