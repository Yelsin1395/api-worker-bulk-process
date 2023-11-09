import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
const clc = require('cli-color');
import fs from 'fs';

export default class InvoiceService {
  constructor({ clinicaRecordRepository, documentRepository }) {
    this._clinicaRecordRepository = clinicaRecordRepository;
    this._documentRepository = documentRepository;
  }

  async processMigrateInvoice() {
    let continuationToken = null;

    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    do {
      const result = await this._clinicaRecordRepository.traverse(continuationToken);
      let itemsTotalProcess = result.resources.length;
      let processCount = 1;

      progressBar.start(itemsTotalProcess, 0);
      continuationToken = result.continuationToken;
      
      if(continuationToken) {
        fs.appendFileSync('logToken.txt', continuationToken);    
      }      

      const emitData = [];

      for (const itemProcess of result.resources) {
        if (typeof itemProcess.nroLote === 'string') {
          itemProcess.nroLote = parseInt(itemProcess.nroLote);
        }

        progressBar.increment();
        progressBar.update(processCount++);

        // const document = await this._documentRepository.getRecordByLoteAndFactura(itemProcess.nroLote, itemProcess.facturaNro);

        // console.log(`📄 Total documents obtained: ${document.length}`);

        // if (!document.length) {
        //   console.log('🚫 Document it does not have any record, we continue with the following query.');
        //   continue;
        // }

        // console.log('❤️ Data clínica record match with data document, adding data to memory');

        // emitData.push({ clinicaRecord: itemProcess, document });
        emitData.push({ clinicaRecord: itemProcess });
      }

      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');
        const worker = new Worker('./src/workers/crossInvoiceWorket.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker cross invoice in process ${processId}`);
        });
      }

      progressBar.stop();
    } while (false);
  }
}
