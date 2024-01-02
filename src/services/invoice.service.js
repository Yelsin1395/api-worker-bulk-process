import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
const clc = require('cli-color');

export default class InvoiceService {
  constructor({ loggerRepository, clinicaRecordRepository, documentRepository }) {
    this._loggerRepository = loggerRepository;
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
      // await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await this._clinicaRecordRepository.traverse(continuationToken);

      let itemsTotalProcess = result.resources.length;
      let processCount = 1;
      const emitData = [];

      progressBar.start(itemsTotalProcess, 0);
      continuationToken = result.continuationToken;

      console.log(`🔓 Last process token: ${continuationToken}`);
      if (continuationToken) {
        this._loggerRepository.create('INVOICE_SERVICE', continuationToken);
      }

      for (const clinicaRecord of result.resources) {
        progressBar.increment();
        progressBar.update(processCount++);

        const documents = await this._documentRepository.getRecordByLoteAndFactura(clinicaRecord.nroLote, clinicaRecord.facturaNro);
        console.log(`📄 Total documents obtained: ${documents.length}`);

        if (documents.length) {
          console.log('❤️ Data clínica record match with data document, adding data to memory');

          emitData.push({ clinicaRecord, document: documents[0] });
        } else {
          console.log('🚫 Clinica it does not have any record, we continue with the following query.');

          emitData.push({ clinicaRecord, document: null });
        }
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

    const result = await this._clinicaRecordRepository.getAllByNroLote(nroLote);

    let itemsTotalProcess = result.length;
    let processCount = 1;
    const emitData = [];

    progressBar.start(itemsTotalProcess, 0);

    for (const clinicaRecord of result) {
      progressBar.increment();
      progressBar.update(processCount++);

      const documents = await this._documentRepository.getRecordByLoteAndFactura(clinicaRecord.nroLote, clinicaRecord.facturaNro);
      console.log(`📄 Total documents obtained: ${documents.length}`);

      if (documents.length) {
        console.log('❤️ Data clínica record match with data document, adding data to memory');

        emitData.push({ clinicaRecord, document: documents[0] });
      } else {
        console.log('🚫 Clinica it does not have any record, we continue with the following query.');
        emitData.push({ clinicaRecord, document: null });
      }
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
  }
}
