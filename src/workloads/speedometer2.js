const settings = require('../../config.json');
const platformBrowser = require('../browser.js');
const { chromium } = require('playwright-chromium');
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
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: settings.chrome_path,
    viewport: null,
    args: args
  });
  const page = await browser.newPage();
  console.log(`********** Going to URL: ${workload.url} **********`);
  await page.goto(workload.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(5 * 1000);
  console.log("********** Running Speedometer2 tests... **********");
  // A quick rule-of-thumb is to count the number of await's or then's
  // happening in your code and if there's more than one then you're
  // probably better off running the code inside a page.evaluate call.
  // The reason here is that all async actions have to go back-and-forth
  // between Node's runtime and the browser's, which means all the JSON
  // serialization and deserializiation. While it's not a huge amount of
  // parsing (since it's all backed by WebSockets) it still is taking up
  // time that could better be spent doing something else.
  await page.evaluate(async () => {
    const startButton = document.querySelector('#home > div > button');
    startButton.click();
    await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
  });
  // await page.click('xpath=//*[@id="home"]/div/button');
  // await page.waitForTimeout(2 * 60 * 1000);
  await page.waitForSelector('xpath=//*[@id="summarized-results"]/div[4]/button[2]',
    {timeout: 5 * 60 * 1000}
  );

  console.log("********** Running Speedometer2 tests completed **********");
  let scores = {};
  const scoreElement = await page.$('#result-number');
  const score = await scoreElement.evaluate(element => element.textContent);
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


module.exports = runSpeedometer2Test;
