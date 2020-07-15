const settings = require('../../config.json');
const platformBrowser = require('../browser.js');
const chromium = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function runSpeedometer2Test(workload, flags) {
  // let workload = settings.workloads[1];
  let args = ["--start-maximized"];
  if (flags !== undefined) {
    args = args.concat(flags);
  }
  platformBrowser.configChromePath(settings);
  console.log(`********** Start running ${workload.name} tests **********`);
  const userDataDir = path.join(process.cwd(), 'userData');
  if (fs.existsSync(userDataDir)) {
    fs.rmdirSync(userDataDir, { recursive: true });
  }
  fs.mkdirSync(userDataDir);
  const browser = await chromium.launch({
    headless: false,
    executablePath: settings.chrome_path,
    userDataDir: userDataDir,
    args: args,
    defaultViewport: null
  });
  const page = await browser.newPage();
  console.log(`********** Going to URL: ${workload.url} **********`);
  await page.goto(workload.url, { waitUntil: 'load', timeout: 5000 });

  console.log("********** Running Speedometer2 tests... **********");
  await page.click('#home > div > button');
  // Speedometer2 has already defined result elements before testing started, so
  // we have no way to wait for result elements, just wait for 2 mins to wait for test done
  await page.waitFor(2 * 60 * 1000);

  let scores = {};
  const scoreElement = await page.$('#result-number');
  let score = await scoreElement.evaluate(element => element.textContent);
  if (score === "") {
    // Test not done yet, continue to wait...
    await page.waitFor(3 * 60 * 1000);
    score = await scoreElement.evaluate(element => element.textContent);
    if (score === "")
      return Promise.reject("Error: Speedometer2 takes too long time to run...")
  }
  score = await scoreElement.evaluate(element => element.textContent);
  console.log("********** Running Speedometer2 tests completed **********");
  console.log('********** Speedometer tests score: **********');
  console.log(`********** ${score}  **********`);
  scores['Total Score'] = score;

  const subcaseTable = await page.$('#detailed-results > table:nth-child(3)');
  const subcaseScore = await subcaseTable.evaluate((element) => {
    let subcase = {};
    // let unit = element.rows[0].cells[1].textContent.replace('Score', '');

    for (let i = 1; i < element.rows.length; i++) {
      let subItem = element.rows[i].cells[0].textContent; // + unit;
      let subScore = element.rows[i].cells[1].textContent;
      subcase[subItem] = subScore;
    }
    return subcase;
  });

  Object.assign(scores, subcaseScore);
  console.log(scores);
  await browser.close();

  return Promise.resolve({
    date: Date(),
    scores: scores
  });
}

const workload = {
  "name": "Speedometer2",
  "url": "http://user-awfy.sh.intel.com:8080/awfy/ARCworkloads/Speedometer2-226694-jstc/"
}
module.exports = runSpeedometer2Test(workload);
