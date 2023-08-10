export default class DocumentController {
  constructor({ documentService }) {
    this._documentService = documentService;
  }

  async processRollbackFieldHistorialDevolucion(req, res) {
    const { garanteId, nroLote } = req.body;
    await this._documentService.processRollbackFieldHistorialDevolucion(garanteId, nroLote);
    return res.status(200).send({
      status: 200,
      message: 'Data process rollback historial devoluciones',
    });
  }
}
