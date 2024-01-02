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

async function documentRepository() {
  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: process.env.COSMOS_TABLE_DOCUMENT });

  return container;
}

async function mettingRepository() {
  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: process.env.COSMOS_TABLE_MEETING });

  return container;
}

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

  for (const file of files) {
    const separateBlobName = file.urlArchivoSas.split('/');
    const fileNameAbs = separateBlobName.pop();
    const typeFileExtension = fileNameAbs.split('_').pop();
    const blobNameUpload = `documentos/${nroLote}/${nroFactura}/${nroEncuentro}/${nroFactura}_${nroEncuentro}_${typeFileExtension}`;

    console.log('⬇️⬇️⬇️⌛ Download file ... ⬇️⬇️⬇️⌛');
    const fileBuffer = await downloadBufferFile(containerClient, file.urlArchivoSas);

    const uploadOptions = {
      tags: {
        ENCUENTRO: nroEncuentro,
        FACTURADOC: nroFactura,
        LOTEDOC: nroLote,
      },
    };

    console.log('⬆️⬆️⬆️⌛ Upload file ... ⬆️⬆️⬆️⌛');
    const { urlBlob, urlSasBlob } = await uploadBufferFile(containerClient, blobNameUpload, uploadOptions, fileBuffer);

    console.log('📥📥📥 Adding a transform file ... 📥📥📥');
    filesTransform.push({
      nombre: setInput.string(file.nombreArchivo),
      url: urlBlob,
      urlSas: urlSasBlob,
      documentoRequerido: {
        id: setInput.string(file.tipoDocumentoId),
        descripcion: setInput.string(file.tipoDocumentoDesc),
      },
      estado: setInput.string(file.estadoArchivo),
      mensajeError: setInput.string(file.msjError),
      existe: setInput.boolean(file.existe),
      error: setInput.string(file.error),
      idPeticionHis: setInput.string(file.peticionid),
      usuario: setInput.string(file.userName),
      origen: setInput.string(file.origen),
      fechaCarga: file?.fechaCarga ? helpers.normalizeDateTime(file.fechaCarga, 2) : null,
    });
  }

  console.log('🈯🈯🈯 Process normalize file finished 🈯🈯🈯');
  return filesTransform;
}

async function workerProcess(data) {
  console.log(clc.yellowBright(`⌛ Processing data`));

  const containerDocument = await documentRepository();
  const containerMetting = await mettingRepository();
  const wd = processRunner(data, process.env.MAX_ITEM_PROCESS_WORKER);
  let processEnd = false;

  do {
    const { done, value } = wd.next();

    if (value) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      for (const encuentro of value) {
        const querySpec = `SELECT * FROM c WHERE c.nroEncuentro = '${encuentro.nroEncuentro}'`;

        const result = await containerDocument.items.query(querySpec).fetchAll();
        const documents = result.resources;

        if (documents.length) {
          const document = documents[0];

          if (document.archivos.length) {
            const files = await normalizeFiles(encuentro.nroEncuentro, encuentro.nroLote, encuentro.nroFactura, document.archivos);

            for (const file of files) {
              encuentro.archivos.push(file);
            }

            await containerMetting.items.upsert(encuentro);
            console.log(clc.greenBright(`💾 The data is stored correctly`));
          }
        }
      }
    }

    processEnd = done;
  } while (!processEnd);

  console.log(clc.bgCyanBright(`🏁 Process worker cross invoice finished ${processId}`));
}

workerProcess(result);
