import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
const clc = require('cli-color');

export default class MettingsService {
  constructor({ clinicaRecordRepository, documentRepository }) {
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
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const result = await this._documentRepository.traverse(continuationToken);

      let itemsTotalProcess = result.resources.length;
      let processCount = 1;

      progressBar.start(itemsTotalProcess, 0);
      continuationToken = result.continuationToken;

      console.log(`🔓 Last process token: ${continuationToken}`);

      const emitData = [];

      for (const itemProcess of result.resources) {
        progressBar.increment();
        progressBar.update(processCount++);

        itemProcess.archivos = this.discardPendingFile(itemProcess.archivos);

        emitData.push(itemProcess);
      }

      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');

        const worker = new Worker('./src/workers/mettingsMigrateWorker.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker cross invoice in process ${processId}`);
        });
      }

      progressBar.stop();
    } while (continuationToken);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }
}
