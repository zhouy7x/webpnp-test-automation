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
    [ "--enable-features=ReaderMode" ],
    [ "--enable-features=AutofillShowTypePredictions" ],
    [ "--enable-quic " ],
    [ "--top-chrome-touch-ui=enabled" ],
    [ "--top-chrome-touch-ui=auto" ],
    [ "--enable-features=UseLookalikesForNavigationSuggestions" ],
    [ "--enable-touch-drag-drop" ],
    [ "--enable-features=AutofillTokenPrefixMatching" ],
    [ "--enable-features=ReducedReferrerGranularity" ],
    [ "--enable-features=Previews" ],
    [ "--enable-features=NoScriptPreviews" ],
    [ "--enable-features=IsolatePrerendersMustProbeOrigin" ],
    [ "--enable-features=IsolatePrerenders" ],
    [ "--isolated-prerender-nsp-enabled" ],
    [ "--enable-features=WebContentsForceDark" ],
    [ "--enable-experimental-accessibility-language-detection" ],
    [ "--enable-experimental-accessibility-language-detection-dynamic" ],
    [ "--enable-features=ExperimentalFlingAnimation" ],
    [ "--enable-features=CorbAllowlistAlsoAppliesToOorCors" ],
    [ "--force-empty-corb-allowlist" ],
    [ "--enable-features=CrossOriginOpenerPolicyAccessReporting" ],
    [ "--enable-features=CrossOriginIsolated" ],
    [ "--enable-features=IntensiveWakeUpThrottling" ],
    [ "--enable-features=ParallelDownloading" ],
    [ "--enable-features=UseDownloadOfflineContentProvider" ],
    [ "--enable-features=WebAuthenticationPhoneSupport" ],
    [ "--enable-features=ExperimentalProductivityFeatures" ],
    [ "--enable-features=AllowSignedHTTPExchangeCertsWithoutExtension" ],
    [ "--enable-features=SignedExchangeSubresourcePrefetch" ],
    [ "--enable-features=SignedExchangePrefetchCacheForNavigations" ],
    [ "--enable-features=CompositorThreadedScrollbarScrolling" ],
    [ "--enable-features=CalculateNativeWinOcclusion" ],
    [ "--enable-features=EnableAmbientAuthenticationInGuestSession" ],
    [ "--enable-features=PaintHolding" ],
    [ "--enable-features=AutofillUseImprovedLabelDisambiguation" ],
    [ "--enable-features=NativeFileSystemAPI" ],
    [ "--enable-features=FileHandlingAPI" ],
    [ "--enable-features=Portals" ],
    [ "--enable-features=PortalsCrossOrigin" ],
    [ "--enable-features=SameSiteByDefaultCookies" ],
    [ "--enable-features=CookiesWithoutSameSiteMustBeSecure" ],
    [ "--enable-unsafe-webgpu" ],
    [ "--enable-features=AllowSyncXHRInPageDismissal" ],
    [ "--enable-features=CSSColorSchemeUARendering" ],
    [ "--enable-features=FormControlsRefresh" ],
    [ "--enable-features=FontAccess" ],
    [ "--enable-features=GlobalMediaControlsPictureInPicture" ],
    [ "--enable-features=WinUseBrowserSpellChecker" ],
    [ "--enable-features=WebBundles" ],
    [ "--enable-features=ImprovedCookieControls" ],
    [ "--enable-features=ImprovedCookieControlsForThirdPartyCookieBlocking" ],
    [ "--enable-features=ImpulseScrollAnimations" ],
    [ "--enable-features=PercentBasedScrolling" ],
    [ "--enable-features=ScrollUnification" ],
    [ "--enable-de-jelly " ],
    [ "--enable-features=RawClipboard" ],
    [ "--enable-features=ColorProviderRedirection" ],
    [ "--enable-features=ConversionMeasurement" ],
    [ "--conversions-debug-mode" ],
    [ "--enable-features=SchemefulSameSite" ]
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