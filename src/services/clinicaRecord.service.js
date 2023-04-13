import { Worker } from 'worker_threads';

export default class ClinicaRecordService {
  constructor({ clinicaRecordRepository }) {
    this._clinicaRecordRepository = clinicaRecordRepository;
  }

  async processAllRecords() {
    let continuationToken = null;
    let count = 0;
    do {
      const result = await this._clinicaRecordRepository.traverse(continuationToken);
      const worker = new Worker('./src/workers/clinicaRecord.worker.js', {
        workerData: { dataProcess: Buffer.from(JSON.stringify(result.resources), 'utf8') },
      });

      worker.once('message', (processId) => {
        console.log(`Worker clinica record in process ${processId}`);
      });

      continuationToken = result.continuationToken;
      count = count + 1;
    } while (count < 4);
  }
}
