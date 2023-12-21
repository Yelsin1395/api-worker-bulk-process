import { Worker } from 'worker_threads';
import cliProgress from 'cli-progress';
import XLSX from 'xlsx';
import helpers from '../common/helpers';
const clc = require('cli-color');

export default class UploadHistoryService {
  constructor({ config, loggerRepository, clinicaRecordRepository, invoiceRepository, mettingRepository, storageSftpImpl }) {
    this._config = config;
    this._loggerRepository = loggerRepository;
    this._clinicaRecordRepository = clinicaRecordRepository;
    this._invoiceRepository = invoiceRepository;
    this._mettingRepository = mettingRepository;
    this._storageSftpImpl = storageSftpImpl;
  }

  async processUploadHistory() {
    let continuationToken = null;

    const progressBar = new cliProgress.SingleBar({
      format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    const sftp = await this._storageSftpImpl.connect();
    const files = await sftp.list(this._config.SFTP_PATHNAME_EXPEDIENTE_DIGITAL);

    do {
      const result = await this._invoiceRepository.traverse(continuationToken);

      let itemsTotalProcess = result.resources.length;
      let processCount = 1;

      progressBar.start(itemsTotalProcess, 0);
      continuationToken = result.continuationToken;

      console.log(`🔓 Last process token: ${continuationToken}`);
      if (continuationToken) {
        this._loggerRepository.create('UPLOADHISTORY_SERVICE', continuationToken);
      }

      const emitData = [];

      for (const itemProcess of result.resources) {
        progressBar.increment();
        progressBar.update(processCount++);

        const mettings = await this._mettingRepository.getByFacturaLote(itemProcess.nroFactura, itemProcess.nroLote);

        if (mettings.length) {
          for (const metting of mettings) {
            // TODO: se debe considerar que el encuentro puede terner varios archvios (falta refactorizar)
            for (const file of files) {
              const duplicate = emitData.filter((x) => x.inputFile.name === file.name && x.inputFile.size === file.size);

              if (duplicate.length > 0) {
                continue;
              }

              // metting.nroEncuentro
              if (file.name.split('-').includes('76981467')) {
                emitData.push({ metting, inputFile: file });
              }
            }
          }
        }
      }

      if (emitData.length) {
        const dataProcess = Buffer.from(JSON.stringify(emitData), 'utf8');

        console.log('📨 Send data process...');
        const worker = new Worker('./src/workers/uploadHistoryWorker.js', {
          workerData: { dataProcess },
        });

        worker.once('message', (processId) => {
          console.log(`♻️ Worker cross invoice in process ${processId}`);
        });
      }

      progressBar.stop();
    } while (false);
  }

  async exportReport() {
    try {
      let continuationToken = null;
      const mapRows = [];
      const wb = XLSX.utils.book_new();
      const dateStart = new Date('2023-04-01');
      const dateFin = new Date();

      const progressBar = new cliProgress.SingleBar({
        format: 'CLI Progress |' + clc.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      });

      do {
        // await new Promise((resolve) => setTimeout(resolve, 1500));
        const result = await this._clinicaRecordRepository.getAllExpedientNotGenerate(continuationToken);
        let itemsTotalProcess = result.resources.length;
        let processCount = 1;

        progressBar.start(itemsTotalProcess, 0);
        continuationToken = result.continuationToken;

        console.log({ continuationToken });

        for (const item of result.resources) {
          progressBar.increment();
          progressBar.update(processCount++);

          const dateInput = new Date(helpers.normalizeDate(item.facturaFecha));

          if (dateInput >= dateStart && dateInput <= dateFin) {
            for (const encuentro of item.nroEncuentro) {
              mapRows.push({
                nroEncuentro: encuentro,
                nroLote: item.nroLote,
                nroFactura: item.facturaNro,
                origen: item.origen,
                estado: item.estado,
                estadoFactura: item.estadoFactura,
                fechaFactura: item.facturaFecha,
                fechaRegistro: item.fechaRegistro,
                fechaModificacion: item.fechaModificacion,
                origenServicioId: item.origenServicioId,
                origenServicioDesc: item.origenServicioDesc,
              });
              console.log('❤️ Adding data to memory');
            }
          }
        }

        progressBar.stop();
      } while (continuationToken);
      console.log({ mapRows: mapRows.length });
      const wsSheet = XLSX.utils.json_to_sheet(mapRows);
      XLSX.utils.book_append_sheet(wb, wsSheet, 'report');
      XLSX.writeFile(wb, 'reportGenerate.xlsx', {
        bookType: 'xlsx',
        compression: true,
      });

      console.log(clc.bgMagentaBright(`🏁🏁🏁 Process finished 🏁🏁🏁`));
    } catch (error) {
      console.error(error);
    }
  }
}
