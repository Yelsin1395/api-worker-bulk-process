import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
const clc = require('cli-color');

export default class LoteService {
  constructor({ storageTableRepository, mettingRepository, mettingsService, invoiceService }) {
    this._storageTableRepository = storageTableRepository;
    this._mettingRepository = mettingRepository;
    this._mettingsService = mettingsService;
    this._invoiceService = invoiceService;
  }

  async processMigrateLote() {
    const lotes = ['526296', '526301', '526299', '526302', '526303', '526304', '526295', '526297', '526298', '526305', '526319', '526324', '526175'];

    for (const lote of lotes) {
      await this._mettingsService.processMigrateByLote(lote);
      await this._invoiceService.processMigrateByLote(lote);
    }

    // let continuationToken = null;

    // do {
    //   const result = await this._storageTableRepository.getLoteByRangeDate(continuationToken);

    //   console.log({ result });
    //   continuationToken = result.continuationToken;

    //   for (const entity of result.resources) {
    //     await this._mettingsService.processMigrateByLote(entity.NroLote);
    //     await this._invoiceService.processMigrateByLote(entity.NroLote);
    //   }
    // } while (continuationToken);

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }

  async processCopyFilesByLote() {
    const lotes = ['77598'];
    let emitData = [];

    for (const lote of lotes) {
      emitData = await this._mettingRepository.getAllByNroLote(lote);

      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');

        const worker = new Worker('./src/workers/copyFilesWorker.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker copy files documents in process ${processId}`);
        });
      }
    }

    console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
  }
}
