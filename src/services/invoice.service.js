import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
const clc = require('cli-color');
import fs from 'fs';

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

  async processMigrateByNumInvoice() {
    const invoices = [
      'F371-00047641',
      'F356-00032802',
      'F356-00032800',
      'F418-00358833',
      'F418-00358788',
      'F418-00358840',
      'F356-00032790',
      'F371-00048220',
      'F371-00048257',
      'F371-00048689',
      'F371-00040262',
      'F371-00032813',
      'F371-00035598',
      'F356-00042561',
      'F371-00049197',
      'F371-00049788',
      'F356-00032127',
      'F356-00032129',
      'F356-00046271',
      'F356-00046423',
      'F356-00048085',
    ];
    const emitData = [];
    const invoicesInvalid = [];

    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    let itemsTotalProcess = invoices.length;
    let processCount = 1;

    progressBar.start(itemsTotalProcess, 0);

    for (const invoice of invoices) {
      progressBar.increment();
      progressBar.update(processCount++);

      const [clinicaRecord] = await this._clinicaRecordRepository.getInvoiceByNroFactura(invoice);

      if (clinicaRecord) {
        const [document] = await this._documentRepository.getRecordByLoteAndFactura(clinicaRecord.nroLote, clinicaRecord.facturaNro);

        if (document) {
          console.log('❤️ Data clínica record match with data document, adding data to memory');
          emitData.push({ clinicaRecord, document });
        } else {
          console.log('🚫 Clinica it does not have any record, we continue with the following query.');
          emitData.push({ clinicaRecord, document: null });
        }
      } else {
        console.log(`La factura ${invoice}, no existe en clinica record`);
        invoicesInvalid.push(invoice);
      }
    }

    if (invoicesInvalid.length) {
      fs.appendFileSync('invoicesInvalid.txt', JSON.stringify(invoicesInvalid));
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
  }
}
