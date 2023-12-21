import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
const clc = require('cli-color');

export default class DevolutionsService {
  constructor({ storageBlobDevolutionsRepository, clinicaRecordRepository }) {
    this._storageBlobDevolutionsRepository = storageBlobDevolutionsRepository;
    this._clinicaRecordRepository = clinicaRecordRepository;
    this._folderName = 'devoluciones';
  }

  async processMigrateDevolutions() {
    let continuationToken = null;
    let count = 0;
    let countOld = 0;
    let numberAttemps = 0;

    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    do {
      const blobs = await this._storageBlobDevolutionsRepository.traverse(continuationToken);
      const wd = await blobs.next();
      const items = wd.value.segment.blobItems;
      const emitData = [];
      let processCount = 1;

      progressBar.start(items.length, 0);

      continuationToken = wd.value.continuationToken;
      console.log({ continuationToken });

      for (const blob of items) {
        const separateBlobName = blob.name.split('/');
        progressBar.increment();
        progressBar.update(processCount++);

        if (separateBlobName.includes(this._folderName)) {
          ++count;
          const blobName = blob.name;
          const fileName = separateBlobName[1];
          const encuentro = fileName.split('_')[0];

          if (encuentro !== '0') {
            const fileString = await this._storageBlobDevolutionsRepository.downloadStringFile(blobName);
            const devolution = JSON.parse(fileString);
            const clinicaRecord = await this._clinicaRecordRepository.getRecordByLoteAndFactura(devolution.nroLote, devolution.facturaNro);

            if (clinicaRecord.length) {
              emitData.push({ fileName, fileString, clinicaRecordString: JSON.stringify(clinicaRecord[0]) });
            }

            // if (count === 10) {
            //   break;
            // }
          }
        }
      }

      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');

        const worker = new Worker('./src/workers/crossDevolutionsWorker.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker cross invoice in process ${processId}`);
        });
      }

      if (countOld !== count) {
        countOld = count;
        numberAttemps = 0;
      }

      if (countOld === count && count !== 0 && countOld !== 0) {
        ++numberAttemps;
      }

      if (numberAttemps === 5) continuationToken = null;

      console.log({ count, countOld, numberAttemps });
      progressBar.stop();
    } while (continuationToken);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }
}
