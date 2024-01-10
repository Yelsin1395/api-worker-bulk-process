const { parentPort, workerData } = require('worker_threads');
const clc = require('cli-color');
const { v4: uuidv4 } = require('uuid');
const { initConnect } = require('./cloudConnectionCosmosDb');
const cloudStorageBlob = require('./cloudConnectionStorageBlob');
const processRunner = require('../utils/processRunner.util');
const helpers = require('../common/helpers');
const setInput = require('../common/setInput');
const processId = uuidv4();

parentPort.postMessage(processId);

const result = JSON.parse(Buffer.from(workerData.dataProcess).toString());

async function downloadBufferFile(containerClient, blobName) {
  const blobClient = containerClient.getBlobClient(blobName);
  const downloadBlockBlobResponse = await blobClient.download();
  const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
  return downloaded;
}

async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

async function uploadBufferFile(containerClient, blobName, uploadOptions, fileBuffer) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(fileBuffer, uploadOptions);

  return {
    urlBlob: blockBlobClient.url,
    urlSasBlob: blobName,
  };
}

async function normalizeFiles(nroEncuentro, nroLote, nroFactura, files) {
  console.log('⌛⌛⌛ Normalize file ⌛⌛⌛');
  const containerClient = cloudStorageBlob.initConnect();
  const filesTransform = [];
  const uploadOptions = {
    tags: {
      ENCUENTRO: nroEncuentro,
      FACTURADOC: nroFactura,
      LOTEDOC: nroLote,
    },
  };

  for (const file of files) {
    if (!file.urlSas) continue;

    const separateBlobName = file.urlSas.split('/');
    const fileNameAbs = separateBlobName.pop();
    const typeFileExtension = fileNameAbs.split('_').pop();
    const blobNameUpload = `documentos/${nroLote}/${nroFactura}/${nroEncuentro}/${nroFactura}_${nroEncuentro}_${typeFileExtension}`;

    console.log('⬇️⬇️⬇️⌛ Download file ... ⬇️⬇️⬇️⌛');
    const fileBuffer = await downloadBufferFile(containerClient, file.urlSas);

    console.log('⬆️⬆️⬆️⌛ Upload file ... ⬆️⬆️⬆️⌛');
    const { urlBlob, urlSasBlob } = await uploadBufferFile(containerClient, blobNameUpload, uploadOptions, fileBuffer);

    console.log('📥📥📥 Adding a transform file ... 📥📥📥');
    file.url = urlBlob;
    file.urlSas = urlSasBlob;
    filesTransform.push(file);
  }

  console.log('🈯🈯🈯 Process normalize file finished 🈯🈯🈯');
  return filesTransform;
}

async function workerProcess(data) {
  console.log(clc.yellowBright(`⌛ Processing data`));
  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: process.env.COSMOS_TABLE_MEETING });
  const wd = processRunner(data, process.env.MAX_ITEM_PROCESS_WORKER);
  let processEnd = false;

  do {
    const { done, value } = wd.next();

    if (value) {
      for (let items of value) {
        let filesCombine = [];

        if (items.length === 1) {
          console.log(`"Next metting, no cumple doble mecanismo encuentro ${items[0].nroEncuentro}"`);
          continue;
        }

        for (const metting of items) {
          if (metting.archivos?.length || metting.archivos !== null) {
            console.log(`🔃🔃🔃 Process conbine files metting ${metting.nroEncuentro} ...  🔃🔃🔃`);
            filesCombine = helpers.combineFiles(filesCombine, metting.archivos, 'documentoRequerido', 'id');
          }
        }

        for (const metting of items) {
          if (metting.nroLote === '0' && metting.nroFactura === '0') {
            await container.item(metting.nroEncuentro, ['0', '0']).delete();
            console.log(clc.redBright(`🗑️ The data is delete correctly metting with lote 0 factura 0 encuentro ${metting.nroEncuentro}`));
            continue;
          }

          console.log('〰️〰️〰️ Process normalize files of metting ... 〰️〰️〰️');
          const filesNew = await normalizeFiles(metting.nroEncuentro, metting.nroLote, metting.nroFactura, filesCombine);

          console.log(`🔃🔃🔃 Process conbine files metting ${metting.nroEncuentro} and add new files to metting ...  🔃🔃🔃`);
          metting.archivos = helpers.combineFiles(metting.archivos ? metting.archivos : [], filesNew, 'documentoRequerido', 'id');

          await container.items.upsert(metting);
          console.log(clc.greenBright(`💾 The data is stored correctly`));
        }
      }
    }

    processEnd = done;
  } while (!processEnd);

  console.log(clc.bgCyanBright(`🏁 Process worker mettings finished ${processId}`));
}

workerProcess(result);
