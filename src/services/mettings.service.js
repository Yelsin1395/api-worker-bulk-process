import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
import runner from '../common/runner';
import fs from 'fs';
const clc = require('cli-color');
const helpers = require('../common/helpers');

export default class MettingsService {
  constructor({ loggerRepository, clinicaRecordRepository, documentRepository, mettingRepository, storageBlobRepository, storageTableRepository }) {
    this._loggerRepository = loggerRepository;
    this._clinicaRecordRepository = clinicaRecordRepository;
    this._documentRepository = documentRepository;
    this._mettingRepository = mettingRepository;
    this._storageBlobRepository = storageBlobRepository;
    this._storageTableRepository = storageTableRepository;
  }

  async processMigrateMettings() {
    let continuationToken = null;

    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    do {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = await this._documentRepository.traverse(continuationToken);

      let itemsTotalProcess = result.resources.length;
      let processCount = 1;
      const emitData = [];

      progressBar.start(itemsTotalProcess, 0);
      continuationToken = result.continuationToken;

      console.log(`🔓 Last process token: ${continuationToken}`);
      if (continuationToken) {
        this._loggerRepository.create('METTING_SERVICE', continuationToken);
      }

      for (const document of result.resources) {
        progressBar.increment();
        progressBar.update(processCount++);

        if (document.nroLote === 0 && document.facturaNro === '0') {
          console.log('🚫 Document is nrLote 0 and nroFactura 0.');
          emitData.push({ document, clinicaRecord: null });
        } else {
          const clinicaRecords = await this._clinicaRecordRepository.getRecordByLoteAndFactura(document.nroLote, document.facturaNro);
          console.log(`📄 Total documents obtained: ${clinicaRecords.length}`);

          if (clinicaRecords.length) {
            console.log('❤️ Data clínica record match with data document, adding data to memory');
            emitData.push({ document, clinicaRecord: clinicaRecords[0] });
          } else {
            console.log('🚫 Document it does not have any record, we continue with the following query.');
            emitData.push({ document, clinicaRecord: null });
          }
        }
      }

      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');

        const worker = new Worker('./src/workers/mettingsMigrateWorker.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker cross metting in process ${processId}`);
        });
      }

      progressBar.stop();
    } while (continuationToken);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }

  async processMigrateByLote(nroLote) {
    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    const result = await this._documentRepository.getAllByNroLote(nroLote);

    let itemsTotalProcess = result.length;
    let processCount = 1;
    const emitData = [];

    progressBar.start(itemsTotalProcess, 0);

    for (const document of result) {
      progressBar.increment();
      progressBar.update(processCount++);

      const clinicaRecords = await this._clinicaRecordRepository.getRecordByLoteAndFactura(document.nroLote, document.facturaNro);
      console.log(`📄 Total documents obtained: ${clinicaRecords.length}`);

      if (clinicaRecords.length) {
        console.log('❤️ Data clínica record match with data document, adding data to memory');
        emitData.push({ document, clinicaRecord: clinicaRecords[0] });
      } else {
        console.log('🚫 Document it does not have any record, we continue with the following query.');
        emitData.push({ document, clinicaRecord: null });
      }
    }

    if (emitData.length) {
      const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

      console.log('📨 Send data process...');

      const worker = new Worker('./src/workers/mettingsMigrateWorker.js', {
        workerData: { dataProcess },
      });

      worker.once('message', (processId) => {
        console.log(`♻️ Worker cross metting in process ${processId}`);
      });
    }

    progressBar.stop();
  }

  async processMigrateByMetting() {
    const mettings = [];
    const emitData = [];

    for (const metting of mettings) {
      const documents = await this._documentRepository.getAllByMetting(metting);

      for (const document of documents) {
        const clinicaRecords = await this._clinicaRecordRepository.getRecordByLoteAndFactura(document.nroLote, document.facturaNro);
        console.log(`📄 Total documents obtained: ${clinicaRecords.length}`);

        if (clinicaRecords.length) {
          console.log('❤️ Data clínica record match with data document, adding data to memory');
          emitData.push({ document, clinicaRecord: clinicaRecords[0] });
        } else {
          console.log('🚫 Document it does not have any record, we continue with the following query.');
          emitData.push({ document, clinicaRecord: null });
        }
      }
    }

    if (emitData.length) {
      const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

      console.log('📨 Send data process...');

      const worker = new Worker('./src/workers/mettingsMigrateWorker.js', {
        workerData: { dataProcess },
      });

      worker.once('message', (processId) => {
        console.log(`♻️ Worker cross metting in process ${processId}`);
      });
    }
  }

  async processFilesByMetting() {
    let continuationToken = null;

    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    do {
      const result = await this._mettingRepository.getAllMettingTraverse(continuationToken);
      let itemsTotalProcess = result.resources.length;
      let processCount = 1;
      const emitData = [];
      progressBar.start(itemsTotalProcess, 0);
      continuationToken = result.continuationToken;

      console.log(`🔓 Last process token: ${continuationToken}`);

      if (continuationToken) {
        this._loggerRepository.create('MEETING_SERVICE', continuationToken);
      }
      for (const nroEncuentro of result.resources) {
        progressBar.increment();
        progressBar.update(processCount++);

        const mettings = await this._mettingRepository.getAllByNroEncuentro(nroEncuentro.nroEncuentro);

        for (const metting of mettings) {
          if (metting.nroLote !== '0' && metting.nroFactura !== '0' && metting.archivos !== null) {
            emitData.push(metting);
          }
        }
      }
      console.log('tamaño de obtener los datos despues del filtro', emitData.length);
      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');

        const worker = new Worker('./src/workers/mettingsValidateFiles.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker copy valoidate files metting process ${processId}`);
        });
      }
      progressBar.stop();
    } while (continuationToken);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }

  // async processFilesByMetting() {
  //   const nroEncuentros = ['23236230'];
  //   const emitData = [];

  //   for (const nroEncuentro of nroEncuentros) {
  //     const mettings = await this._mettingRepository.getAllByNroEncuentro(nroEncuentro);

  //     for (const metting of mettings) {
  //       if (metting.nroLote !== '0' && metting.nroFactura !== '0') {
  //         emitData.push(metting);
  //       }
  //     }
  //   }

  //   if (emitData.length) {
  //     const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

  //     console.log('📨 Send data process...');

  //     const worker = new Worker('./src/workers/mettingsValidateFiles.js', {
  //       workerData: { dataProcess },
  //     });

  //     worker.once('message', (processId) => {
  //       console.log(`♻️ Worker copy valoidate files metting process ${processId}`);
  //     });
  //   }
  // }

  _getFileExtension(filename) {
    return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined;
  }

  async searchBlobsByNroEncuentroProcess() {
    const nroEncuentros = ['23282544'];

    for (const nroEncuentro of nroEncuentros) {
      const mettings = await this._mettingRepository.getAllByNroEncuentro(nroEncuentro);

      if (!mettings.length) {
        continue;
      }

      const metting = mettings[0];
      const tags = {
        ENCUENTRO: metting.nroEncuentro,
        FACTURADOC: metting.nroFactura,
        LOTEDOC: metting.nroLote,
      };

      const blobs = await this._storageBlobRepository.searchFileByTags(tags);
      let wd = await blobs.next();

      while (!wd.done) {
        const blob = wd.value;
        const urlBlob = await this._storageBlobRepository.getUrlsBlob(blob.name);
        const separateBlobName = blob.name.split('/');
        const typeDocument = separateBlobName.pop().split('_').pop().split('.')[0];
        const fileExtension = this._getFileExtension(blob.name);

        if (!metting.archivos.some((f) => f.documentoRequerido.id === typeDocument)) {
          const catalog = await this._storageTableRepository.getTypeDocByCodigo(typeDocument);

          metting.archivos.push({
            nombre: `${typeDocument}.${fileExtension}`,
            url: urlBlob,
            urlSas: blob.name,
            documentoRequerido: {
              id: catalog.Codigo,
              descripcion: catalog.Descripcion,
            },
            estado: 'OK',
            mensajeError: '',
            existe: true,
            error: false,
            idPeticionHis: null,
            usuario: null,
            origen: 'EXPEDIENTE_DIGITAL',
            fechaCarga: helpers.normalizeCurrentDateTimeUtc(),
          });
        }

        wd = await blobs.next();
      }

      await this._mettingRepository.update(metting);
      console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished metting ${nroEncuentro} 🏁🏁🏁`));
    }
  }

  async exportDoubleMechanism() {
    let continuationToken = null;
    let mettingPrevious = null;

    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    do {
      const result = await this._mettingRepository.allMettingsByDate(continuationToken);
      let itemsTotalProcess = result.resources.length;
      let processCount = 1;

      progressBar.start(itemsTotalProcess, 0);
      continuationToken = result.continuationToken;

      console.log(`🔓 Last process token: ${continuationToken}`);

      if (continuationToken) {
        this._loggerRepository.create('MEETING_SERVICE_EXPORT_DOUBLE_MECHANISM', continuationToken);
      }

      for (const item of result.resources) {
        progressBar.increment();
        progressBar.update(processCount++);

        const mettings = await this._mettingRepository.getAllByNroEncuentro(item.nroEncuentro);

        console.log(`📄 Total metting obtained: ${mettings.length}`);

        for (const metting of mettings) {
          if (metting.nroLote === '0' && metting.nroFactura === '0') {
            continue;
          }

          if (!mettingPrevious) {
            mettingPrevious = metting;
            continue;
          }

          if (metting.nroEncuentro === mettingPrevious.nroEncuentro) {
            if (metting.mecanismoFacturacion.id !== mettingPrevious.mecanismoFacturacion.id) {
              console.log(`Encuentro ${metting.nroEncuentro} es doble mecanismo`);
              await this._mettingRepository.createMongo(metting.nroEncuentro);
              mettingPrevious = null;
              continue;
            }
          }

          mettingPrevious = metting;
        }
      }

      progressBar.stop();
    } while (continuationToken);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }

  // async exportDoubleMechanism() {
  //   const result = await this._mettingRepository.getAllMongo();
  //   const progressBar = new cliProgress.SingleBar({
  //     format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
  //     barCompleteChar: '\u2588',
  //     barIncompleteChar: '\u2591',
  //     hideCursor: true,
  //   });

  //   let itemsTotalProcess = result.length;
  //   let processCount = 1;

  //   progressBar.start(itemsTotalProcess, 0);

  //   for (const item of result) {
  //     await new Promise((resolve) => setTimeout(resolve, 200));
  //     progressBar.increment();
  //     progressBar.update(processCount++);

  //     fs.appendFileSync('mettingDoubleMechanismo.txt', `"${item.number}", `);
  //   }

  //   progressBar.stop();
  //   console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  // }

  async doubleMechanismProcess() {
    const result = await this._mettingRepository.getAllMongo();
    console.log(`Registros obtneidos en mongo ${result.length}`);
    const wd = runner(result, 100);
    let processEnd = false;
    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    do {
      const { done, value } = wd.next();
      const emitData = [];

      if (value) {
        await new Promise((resolve) => setTimeout(resolve, 1200));

        let itemsTotalProcess = value.length;
        let processCount = 1;

        progressBar.start(itemsTotalProcess, 0);

        for (let item of value) {
          progressBar.increment();
          progressBar.update(processCount++);
          console.log(`Metting to process ${item.number}`);
          emitData.push(await this._mettingRepository.getAllByNroEncuentro(item.number));
        }
      }

      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');

        const worker = new Worker('./src/workers/doubleMechanismProcess.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker copy valoidate files metting process ${processId}`);
        });
      }

      progressBar.stop();
      processEnd = done;
    } while (!processEnd);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }
}
