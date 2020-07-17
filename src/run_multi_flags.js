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
    [],
    [ '--ignore-gpu-blacklist' ],
    [ '--disable-accelerated-2d-canvas' ],
    [ '--enable-hardware-overlays' ],
    [ '--enable-hardware-overlays=single-fullscreen' ],
    [ '--enable-hardware-overlays=single-fullscreen,single-on-top' ],
    [ '--enable-hardware-overlays=single-fullscreen,single-on-top,underlay' ],
    [ '--enable-nacl' ],
    [ '--enable-experimental-webassembly-features' ],
    [ '--enable-features=WebAssemblyBaseline' ],
    [ '--disable-features=WebAssemblyBaseline' ],
    [ '--enable-features=WebAssemblyLazyCompilation' ],
    [ '--disable-features=WebAssemblyLazyCompilation' ],
    [ '--enable-features=WebAssemblySimd' ],
    [ '--disable-features=WebAssemblySimd' ],
    [ '--enable-features=WebAssemblyThreads' ],
    [ '--disable-features=WebAssemblyThreads' ],
    [ '--enable-features=WebAssemblyTiering' ],
    [ '--disable-features=WebAssemblyTiering' ],
    [ '--enable-features=WebAssemblyBaseline, WebAssemblyTiering' ],
    [ '--enable-features=V8VmFuture' ],
    [ '--disable-features=V8VmFuture' ],
    [ '--enable-gpu-rasterization' ],
    [ '--disable-gpu-rasterization' ],
    [ '--enable-oop-rasterization' ],
    [ '--disable-oop-rasterization' ],
    [ '--enable-features=OopRasterizationDDL' ],
    [ '--disable-features=OopRasterizationDDL' ],
    [ '--enable-experimental-web-platform-features' ],
    [ '--enable-webgl-draft-extensions' ],
    [ '--enable-zero-copy' ],
    [ '--disable-zero-copy' ],
    [ '--enable-features=Vulkan' ],
    [ '--disable-features=Vulkan' ],
    [ '--force-ui-direction=ltr' ],
    [ '--force-ui-direction=rtl' ],
    [ '--enable-features=DelayAsyncScriptExecution' ],
    [ '--disable-features=DelayAsyncScriptExecution' ],
    [ '--enable-features=LazyImageLoading' ],
    [ '--disable-features=LazyImageLoading' ],
    [ '--enable-features=LazyFrameLoading' ],
    [ '--disable-features=LazyFrameLoading' ],
    [ '--use-angle=gl' ],
    [ '--use-angle=d3d11' ],
    [ '--use-angle=d3d9' ],
    [ '--use-angle=d3d11on12' ],
    [ '--enable-features=UseSkiaRenderer' ],
    [ '--disable-features=UseSkiaRenderer' ],
    [ '--enable-features=DecodeJpeg420ImagesToYUV' ],
    [ '--disable-features=DecodeJpeg420ImagesToYUV' ],
    [ '--enable-features=DecodeLossyWebPImagesToYUV' ],
    [ '--disable-features=DecodeLossyWebPImagesToYUV' ],
    [ '--enable-features=TextureLayerSkipWaitForActivation' ],
    [ '--disable-features=TextureLayerSkipWaitForActivation' ],
    [ '--enable-features=TextfieldFocusOnTapUp' ],
    [ '--disable-features=TextfieldFocusOnTapUp' ],
    [ '--new-canvas-2d-api' ]
  ];
  let workloadFiles = [];
  const deviceInfo = await genDeviceInfo();

  // Loop testing flags
  for (let i = 1; i <= flagList.length; i++) {
    if (i > 1)
      await updateConfig(flagList[i]);
    workloadFile = await runWithFlag(deviceInfo);
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