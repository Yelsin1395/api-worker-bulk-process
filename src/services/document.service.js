import { Worker } from 'worker_threads';
const clc = require('cli-color');
import fs from 'fs';

export default class DocumentService {
  constructor({ documentRepository, storageTableRepository, clinicaRecordRepository }) {
    this._documentRepository = documentRepository;
    this._storageTableRepository = storageTableRepository;
    this._clinicaRecordRepository = clinicaRecordRepository;
  }

  async processRollbackFieldHistorialDevolucion(garanteId, nroLote) {
    const expedients = [];
    const documents = [];
    let continuationToken = null;

    do {
      const result = await this._storageTableRepository.getExpedientByLote(garanteId, nroLote, continuationToken);

      continuationToken = result.continuationToken;

      for (const entity of result.resources) {
        if (entity.Estado === 'ERROR' && entity.MsjError === 'Ocurrió un error generando el expediente no se encontro la Carta Devolucion') {
          expedients.push(entity);
        }
      }
    } while (continuationToken);

    console.log(`📄 Total expedients obtained: ${expedients.length}`);

    for (const expedient of expedients) {
      const nroEncuentros = expedient.NroEncuentro.split(',');

      for (const nroEncuentro of nroEncuentros) {
        const [entity] = await this._documentRepository.searchBasic({
          nroEncuentro,
          // nroLote: expedient.NroLote,
          // facturaNro: expedient.FacturaNro,
          historialDevolucion: true,
        });

        if (!entity) {
          continue;
        }

        if (entity.historialDevolucion.length === 1) {
          const [invoiceCurrent] = await this._clinicaRecordRepository.getRecordByLoteAndFactura(entity.nroLote, entity.facturaNro);

          const [invoicePrevious] = await this._clinicaRecordRepository.getRecordByLoteAndFactura(
            entity.historialDevolucion[0].nroLote,
            entity.historialDevolucion[0].nroFactura
          );

          if (
            invoiceCurrent.mecanismoFacturacionId !== invoicePrevious.mecanismoFacturacionId &&
            invoiceCurrent.mecanismoFacturacionDesc !== invoicePrevious.mecanismoFacturacionDesc
          ) {
            console.log('❤️ Double mechanism case, ready to be processed');
            documents.push(entity);
          }
        } else {
          console.log(clc.bgYellowBright('❗ It is a special case of double mechanism, which requires manual revision'));
          fs.appendFileSync('mixed_cases.txt', entity);
        }
      }
    }

    const worker = new Worker('./src/workers/documentRollbackHistorialDevWorker.js', {
      workerData: { dataProcess: Buffer.from(JSON.stringify(documents), 'utf8') },
    });

    worker.once('message', (processId) => {
      console.log(`♻️ Worker clinica record in process ${processId}`);
    });
  }
}
