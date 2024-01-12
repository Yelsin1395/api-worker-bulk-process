const { parentPort, workerData } = require('worker_threads');
const clc = require('cli-color');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { initConnect } = require('./cloudConnectionCosmosDb');
const cloudConnectionStorageBlob = require('./cloudConnectionStorageBlob');
const cloudConnectionSftp = require('./cloudConnectionSftp');
const processRunner = require('../utils/processRunner.util');
const helpers = require('../common/helpers');
const processId = uuidv4();

parentPort.postMessage(processId);

const result = JSON.parse(Buffer.from(workerData.dataProcess).toString());

async function workerProcess(data) {
  console.log(clc.yellowBright(`⌛ Processing data`));
  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: process.env.COSMOS_TABLE_MEETING });
  const sftp = await cloudConnectionSftp.initConnect();
  const blobContainerClient = cloudConnectionStorageBlob.initConnect();
  const wd = processRunner(data, process.env.MAX_ITEM_PROCESS_WORKER);
  let processEnd = false;

  do {
    const { done, value } = wd.next();

    if (value) {
      for (let item of value) {
        const { metting, inputsFiles } = item;

        for (const inputFile of inputsFiles) {
          const fileExtension = path.extname(inputFile.name);
          let remoteFilePath = `${process.env.SFTP_PATHNAME_EXPEDIENTE_DIGITAL}/${inputFile.name}`;
          let blobFileUpload = `documentos/${metting.nroLote}/${metting.nroFactura}/${metting.nroEncuentro}/${metting.nroFactura}_${metting.nroEncuentro}_${inputFile.document.id}${fileExtension}`;

          console.log(clc.yellow(`⌚⚠️ Download file SFTP ${inputFile.name} ...`));
          const fileBuffer = await sftp.get(remoteFilePath);
          console.log(clc.bgGreen('✅✅✅ Successful download ✅✅✅'));

          const uploadOptions = {
            tags: {
              ENCUENTRO: metting.nroEncuentro,
              FACTURADOC: metting.nroFactura,
              LOTEDOC: metting.nroLote,
            },
          };

          console.log(clc.yellow(`⌚⚠️ Upload file blob storage ${inputFile.name} ...`));
          const blockBlobClient = blobContainerClient.getBlockBlobClient(blobFileUpload);
          await blockBlobClient.uploadData(fileBuffer, uploadOptions);
          console.log(clc.bgGreen('✅✅✅ Successful upload to blob storage ✅✅✅'));

          const payloadFile = {
            nombre: `${typeDocument}${fileExtension}`,
            url: blockBlobClient.url,
            urlSas: blobFileUpload,
            documentoRequerido: {
              id: inputFile.document.id,
              descripcion: inputFile.document.descripcion,
            },
            estado: 'OK',
            mensajeError: '',
            existe: true,
            error: '',
            idPeticionHis: '',
            usuario: '',
            origen: 'CARGA_HISTORICA',
            fechaCarga: helpers.normalizeCurrentDateTimeUtc(),
          };

          metting.archivos.push(payloadFile);
        }
        
        await container.items.upsert(metting);
        console.log(clc.greenBright(`💾 The data is stored correctly`));
      }
    }

    processEnd = done;
  } while (!processEnd);

  console.log(clc.bgCyanBright(`🏁 Process worker mettings finished ${processId}`));
}

workerProcess(result);
