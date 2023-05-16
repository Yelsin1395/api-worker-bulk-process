const { parentPort, workerData } = require('worker_threads');
const clc = require('cli-color');
const { v4: uuidv4 } = require('uuid');
const { initConnect } = require('./cloudConnectionCosmosDb');
const processRunner = require('../utils/processRunner.util');
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
      for (let item of value) {
        const clinicaRecord = item.clinicaRecord;
        const documents = item.document;
        const encuentros = [];

        for (const document of documents) {
          const archivos = [];

          for (const archivo of document.archivos) {
            archivos.push({
              nombreArchivo: archivo.nombreArchivo,
              urlArchivo: archivo.urlArchivo,
              urlArchivoSas: archivo.urlArchivoSas,
              estadoArchivo: archivo.estadoArchivo,
              nroEncuentro: archivo.nroEncuentro,
              existe: archivo.existe,
              tipoDocumentoId: archivo.tipoDocumentoId,
              tipoDocumentoDesc: archivo.tipoDocumentoDesc,
              error: archivo.error,
              msjError: archivo.msjError,
            });
          }

          encuentros.push({
            mecanismoFacturacionId: clinicaRecord.mecanismoFacturacionId,
            mecanismoFacturacionDesc: clinicaRecord.mecanismoFacturacionDesc,
            archivos,
            beneficio: document.beneficio,
            beneficioDesc: document.beneficioDesc,
            codigoApp: document.codigoApp,
            codigoCamaPaciente: document.codigoCamaPaciente,
            codigoCMP: document.codigoCMP,
            codigoOrigenPaciente: document.codigoOrigenPaciente,
            codigoSede: document.codigoSede,
            codigoServDestino: document.codigoServDestino,
            codigoServicioOrigen: document.codigoServicioOrigen,
            codigoServSolicita: document.codigoServSolicita,
            descripcionServSolicita: document.descripcionServSolicita,
            descripServDestino: document.descripServDestino,
            estado: document.estado,
            facturaIdDocumento: document.facturaIdDocumento,
            facturaImporte: document.facturaImporte,
            fechaAtencion: document.fechaAtencion,
            fechaEfectivaOrden: document.fechaEfectivaOrden,
            fechaMensaje: document.fechaMensaje,
            fechaTransaccion: document.fechaTransaccion,
            fullName: document.fullName,
            id: document.id,
            nroEncuentro: document.nroEncuentro,
            nroRemesa: document.nroRemesa,
            origenDescripcion: document.origenDescripcion,
            origenServicio: document.origenServicio,
            pacienteApellidoMaterno: document.pacienteApellidoMaterno,
            pacienteApellidoPaterno: document.pacienteApellidoPaterno,
            pacienteNombre: document.pacienteNombre,
            pacienteNroDocIdent: document.pacienteNroDocIdent,
            pacienteTipoDocIdentDesc: document.pacienteTipoDocIdentDesc,
            pacienteTipoDocIdentId: document.pacienteTipoDocIdentId,
            peticionHisID: document.peticionHisID,
            peticionLisID: document.peticionLisID,
            sede: document.sede,
            sedeDesc: document.sedeDesc,
            sexoPaciente: document.sexoPaciente,
            transactionId: document.transactionId,
            userId: document.userId,
            userName: document.userName,
          });
        }

        const payload = {
          archivoAnexoDet: clinicaRecord.archivoAnexoDet,
          archivoAnexoDetSas: clinicaRecord.archivoAnexoDetSas,
          beneficioId: clinicaRecord.beneficioId,
          beneficioDescripcion: clinicaRecord.beneficioDescripcion,
          coCentro: clinicaRecord.coCentro,
          coEstru: clinicaRecord.coEstru,
          encuentros,
          estado: clinicaRecord.estado,
          estadoFactura: clinicaRecord.estadoFactura,
          facturaArchivo: clinicaRecord.facturaArchivo,
          facturaArchivoSas: clinicaRecord.facturaArchivoSas,
          facturaFecha: clinicaRecord.facturaFecha,
          facturaImporte: clinicaRecord.facturaImporte,
          facturaNro: clinicaRecord.facturaNro,
          facturaNroAfecta: clinicaRecord.facturaNroAfecta,
          facturaNroInafecta: clinicaRecord.facturaNroInafecta,
          fechaAtencion: clinicaRecord.fechaAtencion,
          garanteDescripcion: clinicaRecord.garanteDescripcion,
          garanteId: clinicaRecord.garanteId,
          id: clinicaRecord.id,
          modoFacturacion: clinicaRecord.modoFacturacion,
          modoFacturacionId: clinicaRecord.modoFacturacionId,
          nroHistoriaClinica: clinicaRecord.nroHistoriaClinica,
          nroLote: String(clinicaRecord.nroLote),
          nroRemesa: clinicaRecord.nroRemesa,
          origen: clinicaRecord.origen,
          origenServicioDesc: clinicaRecord.origenServicioDesc,
          origenServicioId: clinicaRecord.origenServicioId,
          pacienteApellidoMaterno: clinicaRecord.pacienteApellidoMaterno,
          pacienteApellidoPaterno: clinicaRecord.pacienteApellidoPaterno,
          pacienteNombre: clinicaRecord.pacienteNombre,
          pacienteNroDocIdent: clinicaRecord.pacienteNroDocIdent,
          pacienteTipoDocIdentDesc: clinicaRecord.pacienteTipoDocIdentDesc,
          pacienteTipoDocIdentId: clinicaRecord.pacienteTipoDocIdentId,
          sedeRenipress: clinicaRecord.sedeRenipress,
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
