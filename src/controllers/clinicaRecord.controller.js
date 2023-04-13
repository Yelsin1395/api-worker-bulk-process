export default class ClinicaRecordController {
  constructor({ clinicaRecordService }) {
    this._clinicaRecordService = clinicaRecordService;

    this.processAllRecords = this.processAllRecords.bind(this);
  }

  async processAllRecords(req, res) {
    this._clinicaRecordService.processAllRecords();
    return res.status(200).send({
      status: 200,
      message: 'Data process clinica records',
    });
  }
}
