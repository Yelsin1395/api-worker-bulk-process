const { parentPort, workerData } = require('worker_threads');
const clc = require('cli-color');
const { v4: uuidv4 } = require('uuid');
const { initConnect } = require('./cloudConnectionCosmosDb');
const processRunner = require('../utils/processRunner.util');
const config = require('../config.worker');
const helpers = require('../common/helpers');
const processId = uuidv4();

parentPort.postMessage(processId);

const result = JSON.parse(Buffer.from(workerData.dataProcess).toString());

async function workerProcess(data) {
  console.log(clc.yellowBright(`⌛ Processing data`));

  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: config.COSMOS_TABLE_INVOICE });
  const wd = processRunner(data, config.MAX_ITEM_PROCESS_WORKER);
  let processEnd = false;

  do {
    const { done, value } = wd.next();

    if (value) {
      for (let item of value) {
        const clinicaRecord = item.clinicaRecord;

        console.log(JSON.stringify(clinicaRecord));

        const payload = {
          id: clinicaRecord.facturaNro,
          nroFactura: clinicaRecord.facturaNro,
          nroLote: String(clinicaRecord.nroLote),
          estadoExpediente: clinicaRecord.estado,
          fechaFacturacion: helpers.normalizeDate(clinicaRecord.facturaFecha),
          importeFacturacion: clinicaRecord.facturaImporte,
          facturaAsociada: helpers.normalizeTypeInvoice(clinicaRecord.facturaNroAfecta, clinicaRecord.facturaNroInafecta),
          urlAnexoDetallado: clinicaRecord.archivoAnexoDet,
          urlAnexoDetalladoSas: clinicaRecord.archivoAnexoDetSas,
          urlFactura: clinicaRecord.facturaArchivo,
          urlFacturaSas: clinicaRecord.facturaArchivoSas,
          coCentro: clinicaRecord.coCentro,
          coEstructura: clinicaRecord.coEstru,
          nroHistoriaClinica: clinicaRecord.nroHistoriaClinica,
          nroRemesa: clinicaRecord.nroRemesa,
          origenSistema: clinicaRecord.origen,
          estadoFacturacion: clinicaRecord.estadoFactura,
          fechaAtencion: clinicaRecord.fechaAtencion,
          paciente: {
            apellidoPaterno: clinicaRecord.pacienteApellidoPaterno,
            apellidoMaterno: clinicaRecord.pacienteApellidoMaterno,
            nombre: clinicaRecord.pacienteNombre,
            documentoIdentidad: {
              id: clinicaRecord.pacienteTipoDocIdentId,
              descripcion: clinicaRecord.pacienteTipoDocIdentId === '1' ? 'D.N.I' : clinicaRecord.pacienteTipoDocIdentDesc,
              numero: clinicaRecord.pacienteNroDocIdent,
            },
          },
          modoFacturacion: {
            id: clinicaRecord.modoFacturacionId,
            descripcion: clinicaRecord.modoFacturacion,
          },
          mecanismoFacturacion: {
            id: clinicaRecord.mecanismoFacturacionId,
            descripcion: clinicaRecord.mecanismoFacturacionDesc,
          },
          garante: {
            id: clinicaRecord.garanteId,
            descripcion: clinicaRecord.garanteDescripcion,
          },
          beneficio: {
            id: clinicaRecord.beneficioId,
            descripcion: clinicaRecord.beneficioDescripcion,
          },
          origenServicio: {
            id: clinicaRecord.origenServicioId,
            descripcion: clinicaRecord.origenServicioDesc,
          },
          encuentros: clinicaRecord.nroEncuentro,
          comprobantes: [],
          tipoComprobante: '01',
          fechaRegistro: helpers.normalizeDateTime(clinicaRecord.facturaFecha),
          fechaModificacion: helpers.normalizeDateTime(clinicaRecord.facturaFecha),
        };

        await container.items.upsert(payload);

        console.log(clc.greenBright(`💾 The data is stored correctly`));
      }
    }

    processEnd = done;
  } while (!processEnd);

  console.log(clc.bgCyanBright(`🏁 Process worker finished ${processId}`));
}

workerProcess(result);
