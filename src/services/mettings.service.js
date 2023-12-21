import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
const clc = require('cli-color');

export default class MettingsService {
  constructor({ loggerRepository, clinicaRecordRepository, documentRepository }) {
    this._loggerRepository = loggerRepository;
    this._clinicaRecordRepository = clinicaRecordRepository;
    this._documentRepository = documentRepository;
  }

  discardPendingFile(files) {
    const validFiles = [];

    for (const file of files) {
      if (file.estadoArchivo !== 'PENDIENTE') {
        if (file.archivoBytes?.length) {
          file.archivoBytes = '';
        }

        validFiles.push(file);
      }
    }

    return validFiles;
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
      // await new Promise((resolve) => setTimeout(resolve, 3000));
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

        if (document.nroLote !== 0 && document.facturaNro !== '0') {
          const clinicaRecords = await this._clinicaRecordRepository.getRecordByLoteAndFactura(document.nroLote, document.facturaNro);
          console.log(`📄 Total documents obtained: ${clinicaRecords.length}`);
        }

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
    } while (continuationToken);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }
}
