export default class LoteController {
  constructor({ loteService }) {
    this._loteService = loteService;

    this.processMigrateLote = this.processMigrateLote.bind(this);
    this.processCopyFilesByLote = this.processCopyFilesByLote.bind(this);
  }

  async processMigrateLote(req, res) {
    this._loteService.processMigrateLote();
    return res.status(200).send({
      status: 200,
      message: 'Data process migrate lote',
    });
  }

  async processCopyFilesByLote(req, res) {
    this._loteService.processCopyFilesByLote();
    return res.status(200).send({
      status: 200,
      message: 'Data process copy files by lote',
    });
  }
}
