import { Worker } from 'worker_threads';

export default class ClinicaRecordService {
  constructor({ clinicaRecordRepository }) {
    this._clinicaRecordRepository = clinicaRecordRepository;
  }

  async processAllRecords() {
    let continuationToken = null;

    do {
      const result = await this._clinicaRecordRepository.traverse(continuationToken);

      continuationToken = result.continuationToken;
      console.log(`🔓 Last process token: ${continuationToken}`);

      const worker = new Worker('./src/workers/clinicaRecordWorker.js', {
        workerData: { dataProcess: Buffer.from(JSON.stringify(result.resources), 'utf8') },
      });

      worker.once('message', (processId) => {
        console.log(`🚀 Worker clinica record in process ${processId}`);
      });
    } while (continuationToken);
  }
}
