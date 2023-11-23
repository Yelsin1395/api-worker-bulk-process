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

function normalizeFiles(files) {
  return files.map((file) => {
    const idPeticionesHis = [];

    if (file.peticionid) {
      idPeticionesHis.push(file.peticionid);
    }

    if (file.peticionidLista) {
      idPeticionesHis.push(file.peticionidLista);
    }

    return {
      nombre: file.nombreArchivo,
      url: file.urlArchivo,
      urlSas: file.urlArchivoSas,
      documentoRequerido: {
        id: file.tipoDocumentoId,
        descripcion: file.tipoDocumentoDesc,
      },
      estado: file.estadoArchivo,
      mensajeError: file.msjError,
      existe: file.existe,
      error: file.error,
      origen: file.origen,
      idPeticionesHis,
      documentoRequeridoAnterior: {
        id: file.tipoDocumentoIdModified,
        descripcion: file.tipoDocumentoDescModified,
      },
      usuario: file.userName,
      fechaCarga: file.fechaCarga && helpers.normalizeDateTime(file.fechaCarga),
    };
  });
}

function normalizeHistoryDevolutions(histories) {
  return histories.map((history) => {
    return {
      id: history.id,
      nroDevolucion: history.nroDevolucion,
      nroLote: String(history.nroLote),
      nroFactura: history.nroFactura,
      urlFactura: history.urlFactura,
      urlFacturaSas: history.urlFacturaSas,
      archivoNotaCredito: history.notaCredito,
      urlNotaCredito: history.urlNotaCredito,
      urlNotaCreditoSas: history.urlNotaCreditoSas,
      archivoCartaDevolucion: history.cartaDevolucion,
      urlCartaDevolucion: history.urlCartaDevolucion,
      urlCartaDevolucionSas: history.urlCartaDevolucionSas,
      usuario: history.usuario,
      fechaDevolucion: history.fecha && helpers.normalizeDateTime(history.fecha),
    };
  });
}

async function workerProcess(data) {
  console.log(clc.yellowBright(`⌛ Processing data`));

  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: config.COSMOS_TABLE_MEETING });
  const wd = processRunner(data, config.MAX_ITEM_PROCESS_WORKER);
  let processEnd = false;

  do {
    const { done, value } = wd.next();

    if (value) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      for (let item of value) {
        const { clinicaRecord, documents } = item;

        for (const document of documents) {
          const payload = {
            id: document.nroEncuentro,
            nroEncuentro: document.nroEncuentro,
            nroLote: String(document.nroLote),
            nroFactura: document.facturaNro,
            sede: {
              id: document.sede,
              descripcion: document.sedeDesc,
            },
            idPeticionHis: document.peticionHisID,
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
            importeFacturacion: clinicaRecord.facturaImporte,
            garante: {
              id: clinicaRecord.garanteId,
              descripcion: clinicaRecord.garanteDescripcion,
            },
            beneficio: {
              id: clinicaRecord.beneficioId,
              descripcion: clinicaRecord.beneficioDescripcion,
            },
            origenServicio: {
              id: document.codigoServicioOrigen,
              descripcion: document.origenServicio,
            },
            fechaAtencion: document.fechaAtencion,
            fechaEfectivaOrden: document.fechaEfectivaOrden,
            fechaMensaje: document.fechaMensaje,
            archivos: normalizeFiles(document.archivos),
            historialDevolucion: document.historialDevolucion ? normalizeHistoryDevolutions(document.historialDevolucion) : [],
            usuario: document.userName,
            fechaRegistro: helpers.normalizeDateTime(document.fechaAtencion),
            fechaModificacion: helpers.normalizeDateTime(document.fechaAtencion),
          };

          await container.items.upsert(payload);

          console.log(clc.greenBright(`💾 The data is stored correctly`));
        }
      }
    }

    processEnd = done;
  } while (!processEnd);

  console.log(clc.bgCyanBright(`🏁 Process worker finished ${processId}`));
}

workerProcess(result);
