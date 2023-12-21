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

function normalizeFiles(files) {
  const peticiones = [];
  const archivos = files.map((file) => {
    if (file.peticionidLista && file.peticionidLista.length) {
      for (const item of file.peticionidLista) {
        if (!peticiones.some((x) => x.id === item.idPeticionHis)) {
          peticiones.push({
            id: item.idPeticionHis,
            descripcion: item.descExamen,
          });
        }
      }
    }

    return {
      nombre: setInput.string(file.nombreArchivo),
      url: setInput.string(file.urlArchivo),
      urlSas: setInput.string(file.urlArchivoSas),
      documentoRequerido: {
        id: setInput.string(file.tipoDocumentoId),
        descripcion: setInput.string(file.tipoDocumentoDesc),
      },
      estado: setInput.string(file.estadoArchivo),
      mensajeError: setInput.string(file.msjError),
      existe: setInput.boolean(file.existe),
      error: setInput.string(file.error),
      idPeticionHis: setInput.string(file.peticionid),
      usuario: setInput.string(file.userName),
      origen: setInput.string(file.origen),
      fechaCarga: file?.fechaCarga ? helpers.normalizeDateTime(file.fechaCarga, 2) : null,
    };
  });

  return { peticiones, archivos };
}

function normalizeHistoryDevolutions(histories) {
  return histories.map((history) => {
    return {
      id: history.id,
      nroDevolucion: setInput.number(history.nroDevolucion),
      nroLote: String(history.nroLote),
      nroFactura: history.nroFactura,
      urlFactura: setInput.string(history.urlFactura),
      urlFacturaSas: setInput.string(history.urlFacturaSas),
      archivoNotaCredito: setInput.string(history.notaCredito),
      urlNotaCredito: setInput.string(history.urlNotaCredito),
      urlNotaCreditoSas: setInput.string(history.urlNotaCreditoSas),
      archivoCartaDevolucion: setInput.string(history.cartaDevolucion),
      urlCartaDevolucion: setInput.string(history.urlCartaDevolucion),
      urlCartaDevolucionSas: setInput.string(history.urlCartaDevolucionSas),
      usuario: setInput.string(history.usuario),
      fechaDevolucion: history.fecha ? helpers.normalizeDateTimeSeparate(history.fecha) : null,
    };
  });
}

async function workerProcess(data) {
  console.log(clc.yellowBright(`⌛ Processing data`));

  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: process.env.COSMOS_TABLE_MEETING });
  const wd = processRunner(data, process.env.MAX_ITEM_PROCESS_WORKER);
  let processEnd = false;

  do {
    const { done, value } = wd.next();

    if (value) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      for (let item of value) {
        const { document, clinicaRecord } = item;

        const { peticiones, archivos } = normalizeFiles(document.archivos);

        const payload = {
          id: document.nroEncuentro,
          nroEncuentro: document.nroEncuentro,
          nroLote: String(document.nroLote),
          nroFactura: document.facturaNro,
          sede: {
            id: setInput.string(document.sede),
            descripcion: setInput.string(document.sedeDesc),
          },
          nroHistoriaClinica: setInput.string(document.peticionHisID),
          peticiones,
          paciente: {
            apellidoPaterno: setInput.string(clinicaRecord?.pacienteApellidoPaterno),
            apellidoMaterno: setInput.string(clinicaRecord?.pacienteApellidoMaterno),
            nombre: setInput.string(clinicaRecord?.pacienteNombre),
            documentoIdentidad: {
              id: setInput.string(clinicaRecord?.pacienteTipoDocIdentId),
              descripcion: setInput.string(clinicaRecord?.pacienteTipoDocIdentId === '1' ? 'D.N.I' : clinicaRecord?.pacienteTipoDocIdentDesc),
              numero: setInput.string(clinicaRecord?.pacienteNroDocIdent),
            },
          },
          modoFacturacion: {
            id: setInput.string(clinicaRecord?.modoFacturacionId),
            descripcion: setInput.string(clinicaRecord?.modoFacturacion),
          },
          mecanismoFacturacion: {
            id: setInput.string(clinicaRecord?.mecanismoFacturacionId),
            descripcion: setInput.string(clinicaRecord?.mecanismoFacturacionDesc),
          },
          nroRemesa: setInput.number(clinicaRecord?.nroRemesa),
          importeFacturacion: setInput.number(clinicaRecord?.facturaImporte),
          garante: {
            id: setInput.string(clinicaRecord?.garanteId),
            descripcion: setInput.string(clinicaRecord?.garanteDescripcion),
          },
          beneficio: {
            id: setInput.string(clinicaRecord?.beneficioId),
            descripcion: setInput.string(clinicaRecord?.beneficioDescripcion),
          },
          origenServicio: {
            id: setInput.string(document.codigoServicioOrigen),
            descripcion: setInput.string(document.origenServicio),
          },
          fechaAtencion: helpers.normalizeDateTime(document.fechaAtencion, 2),
          fechaEfectivaOrden: document.fechaEfectivaOrden ? helpers.normalizeDateTime(document.fechaEfectivaOrden) : null,
          fechaMensaje: document.fechaMensaje ? helpers.normalizeDateTime(document.fechaMensaje) : null,
          archivos,
          historialDevolucion: document.historialDevolucion ? normalizeHistoryDevolutions(document.historialDevolucion) : [],
          usuario: document.userName ?? null,
          fechaRegistro: helpers.normalizeDateTime(document.fechaAtencion, 2),
          fechaModificacion: helpers.normalizeDateTime(document.fechaAtencion, 2),
        };

        await container.items.upsert(payload);

        console.log(clc.greenBright(`💾 The data is stored correctly`));
      }
    }

    processEnd = done;
  } while (!processEnd);

  console.log(clc.bgCyanBright(`🏁 Process worker mettings finished ${processId}`));
}

workerProcess(result);
