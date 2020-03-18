const DownloaderUtils = require('../utils');

// https://storage.googleapis.com/tfjs-models/savedmodel/posenet_mobilenet_075_partmap/model.json
// https://storage.googleapis.com/tfjs-models/savedmodel/posenet_mobilenet_075_partmap/group1-shard1of2
// https://storage.googleapis.com/tfjs-models/savedmodel/posenet_mobilenet_075_partmap/group1-shard2of2

// const STORAGEPATH = "https://storage.googleapis.com/tfjs-models/savedmodel/posenet_mobilenet_075_partmap"

const RESNET50_BASE_URL =
    'https://storage.googleapis.com/tfjs-models/savedmodel/bodypix/resnet50/';
const MOBILENET_BASE_URL =
    'https://storage.googleapis.com/tfjs-models/savedmodel/bodypix/mobilenet/';

const outputFolder = './models/bodypix';

// const downloaderUtils = new DownloaderUtils(STORAGEPATH, outputFolder);

async function downloadBodyPix(){
  const BASE_URL =
  'https://storage.googleapis.com/tfjs-models/savedmodel/bodypix';

  ['MobileNetV1', 'ResNet50'].forEach(architecture => {
    const vOutputStrides = [16, 32];
    let vMultipliers;
    architecture = architecture.toLowerCase();
    let arch = architecture;
    if (architecture === 'mobilenetv1') {
      vOutputStrides.pop(); // no 32 strides in mobilenetv1
      vOutputStrides.push(8);
      vMultipliers = [1.0, 0.75, 0.50];
      arch = 'mobilenet';
    }
    vOutputStrides.forEach(outputStride => {
      const vQuantBytes = [1,2,4];
      vQuantBytes.forEach(async quantBytes => {
        if (vMultipliers) {
          vMultipliers.forEach(async multiplier => {
            const vFilePath = toLocalFolder({architecture, outputStride, multiplier, quantBytes});
            const url = `${BASE_URL}/${arch}/${vFilePath}`
            const downloaderUtils = new DownloaderUtils(url, `${outputFolder}/${architecture}/${vFilePath}`);
            downloaderUtils.makeOutputPath();
            try {
              const modelJson = await downloaderUtils.saveJson(`model-stride${outputStride}.json`);
              await downloaderUtils.saveWeights(modelJson);
            } catch(err) {
              console.log('Faild download: '+ url, err)
            }
          })
        } else {
          const vFilePath = toLocalFolder({architecture, outputStride, quantBytes});
          const url = `${BASE_URL}/${arch}/${vFilePath}`;
          const downloaderUtils = new DownloaderUtils(url, `${outputFolder}/${architecture}/${vFilePath}`);
          downloaderUtils.makeOutputPath();
          try {
            const modelJson = await downloaderUtils.saveJson(`model-stride${outputStride}.json`);
            await downloaderUtils.saveWeights(modelJson);
          } catch(err) {
            console.log('Faild download: '+ url, err)
          }
      }

      })
    })
  })
    // NOTE: paths are relative to where the script is being called
    // downloaderUtils.makeOutputPath();

    // const modelJson = await downloaderUtils.saveJson('model.json');
    // await downloaderUtils.saveWeights(modelJson);
}

function toLocalFolder({
  architecture,
  outputStride,
  // only by the MobileNetV1 architecture
  multiplier,
  quantBytes
}) {
  const vQuantName = quantBytes === 4 ? 'float' : `quant${quantBytes}`;
  let result = '';//`/model-stride${outputStride}.json`;
  architecture = architecture.toLowerCase();
  if (architecture === 'resnet50') {
    result = `${vQuantName}${result}`;
  } else {
    const toStr = {1.0: '100', 0.75: '075', 0.50: '050'};
    result = `${vQuantName}/${toStr[multiplier]}${result}`;
  }
  return result;
}

module.exports = downloadBodyPix
