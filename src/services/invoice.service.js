import { Worker } from 'worker_threads';
import fs from 'fs';

export default class InvoiceService {
  constructor({ clinicaRecordRepository, documentRepository }) {
    this._clinicaRecordRepository = clinicaRecordRepository;
    this._documentRepository = documentRepository;
  }

  async processCrossInvoice() {
    let continuationToken = null;

    do {
      const result = await this._clinicaRecordRepository.traverse(continuationToken);

      continuationToken = result.continuationToken;
      fs.appendFileSync('logToken.txt', continuationToken);

      const emitData = [];

      for (const itemProcess of result.resources) {
        if (typeof itemProcess.nroLote === 'string') {
          itemProcess.nroLote = parseInt(itemProcess.nroLote);
        }

        console.log(`🚀 The item will be processed: ${JSON.stringify(itemProcess)}`);

        const clinicaRecord = await this._clinicaRecordRepository.getRecordByLoteAndFactura(itemProcess.nroLote, itemProcess.facturaNro);

        console.log(`📄 Total documents clinicaRecord obtained: ${clinicaRecord.length}`);

        if (!clinicaRecord.length) {
          console.log(`🚫 Clinica record it does not have any record, we continue with the following query.`);
          continue;
        }

        const document = await this._documentRepository.getRecordByLoteAndFactura(itemProcess.nroLote, itemProcess.facturaNro);

        console.log(`📄 Total documents obtained: ${document.length}`);

        if (!document.length) {
          console.log('🚫 Document it does not have any record, we continue with the following query.');
          continue;
        }

        console.log('❤️ Data clínica record match with data document, adding data to memory');

        emitData.push({ clinicaRecord, document });
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
    } while (continuationToken);
  }
}
