import { Worker } from 'worker_threads';
import runner from '../common/runner';

export default class InvoiceService {
  constructor({ appDataProcess, clinicaRecordRepository, documentRepository }) {
    this._appDataProcess = appDataProcess;
    this._clinicaRecordRepository = clinicaRecordRepository;
    this._documentRepository = documentRepository;
  }

  async processCrossInvoice() {
    let processEnd = false;
    const processGenerator = runner(this._appDataProcess, 20);

    do {
      const { done, value } = processGenerator.next();
      if (value) {
        const emitData = [];

        for (const itemProcess of value) {
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

        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');
        const worker = new Worker('./src/workers/crossInvoiceWorket.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker cross invoice in process ${processId}`);
        });
      }
      processEnd = done;
    } while (!processEnd);
  }
}
