const { parentPort, workerData } = require('worker_threads');
const clc = require('cli-color');
const { v4: uuidv4 } = require('uuid');
const { initConnect } = require('./cloudConnectionCosmosDb');
const processRunner = require('../utils/processRunner.util');
const helpers = require('../common/helpers');
const setInput = require('../common/setInput');
const processId = uuidv4();

parentPort.postMessage(processId);

const result = JSON.parse(Buffer.from(workerData.dataProcess).toString());

async function workerProcess(data) {
  console.log(clc.yellowBright(`⌛ Processing data`));

  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: process.env.COSMOS_TABLE_INVOICE });
  const wd = processRunner(data, process.env.MAX_ITEM_PROCESS_WORKER);
  let processEnd = false;

  do {
    const { done, value } = wd.next();

    if (value) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      for (let item of value) {
        const { clinicaRecord, document } = item;

        const payload = {
          id: clinicaRecord.facturaNro,
          nroFactura: clinicaRecord.facturaNro,
          nroLote: String(clinicaRecord.nroLote),
          estadoExpediente: setInput.string(clinicaRecord.estado),
          fechaFacturacion: helpers.normalizeDateTime(clinicaRecord.facturaFecha),
          importeFacturacion: setInput.number(clinicaRecord.facturaImporte),
          facturaAsociada: helpers.normalizeTypeInvoice(clinicaRecord.facturaNroAfecta, clinicaRecord.facturaNroInafecta),
          urlAnexoDetallado: setInput.string(clinicaRecord.archivoAnexoDet),
          urlAnexoDetalladoSas: setInput.string(clinicaRecord.archivoAnexoDetSas),
          urlFactura: setInput.string(clinicaRecord.facturaArchivo),
          urlFacturaSas: setInput.string(clinicaRecord.facturaArchivoSas),
          coCentro: setInput.string(clinicaRecord.coCentro),
          coEstructura: setInput.string(clinicaRecord.coEstru),
          nroHistoriaClinica: setInput.string(clinicaRecord.nroHistoriaClinica),
          nroRemesa: setInput.number(clinicaRecord.nroRemesa),
          origenSistema: setInput.string(clinicaRecord.origen),
          estadoFacturacion: setInput.string(clinicaRecord.estadoFactura),
          fechaAtencion: helpers.normalizeDateTime(clinicaRecord.fechaAtencion, 2),
          paciente: {
            apellidoPaterno: setInput.string(clinicaRecord.pacienteApellidoPaterno),
            apellidoMaterno: setInput.string(clinicaRecord.pacienteApellidoMaterno),
            nombre: setInput.string(clinicaRecord.pacienteNombre),
            documentoIdentidad: {
              id: setInput.string(clinicaRecord.pacienteTipoDocIdentId),
              descripcion: clinicaRecord.pacienteTipoDocIdentId === '1' ? 'D.N.I' : clinicaRecord.pacienteTipoDocIdentDesc,
              numero: setInput.string(clinicaRecord.pacienteNroDocIdent),
            },
          },
          modoFacturacion: {
            id: setInput.string(clinicaRecord.modoFacturacionId),
            descripcion: setInput.string(clinicaRecord.modoFacturacion),
          },
          mecanismoFacturacion: {
            id: setInput.string(clinicaRecord.mecanismoFacturacionId),
            descripcion: setInput.string(clinicaRecord.mecanismoFacturacionDesc),
          },
          garante: {
            id: setInput.string(clinicaRecord.garanteId),
            descripcion: setInput.string(clinicaRecord.garanteDescripcion),
          },
          beneficio: {
            id: setInput.string(clinicaRecord.beneficioId),
            descripcion: setInput.string(clinicaRecord.beneficioDescripcion),
          },
          origenServicio: {
            id: setInput.string(clinicaRecord.origenServicioId),
            descripcion: setInput.string(clinicaRecord.origenServicioDesc),
          },
          sede: {
            id: setInput.string(document?.sede),
            descripcion: setInput.string(document?.sedeDesc),
          },
          encuentros: setInput.array(clinicaRecord?.nroEncuentro),
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

  console.log(clc.bgCyanBright(`🏁 Process worker cross invoice finished ${processId}`));
}

workerProcess(result);
