export default class MettingsController {
  constructor({ mettingsService }) {
    this._mettingsService = mettingsService;

    this.processMigrateMettings = this.processMigrateMettings.bind(this);
    this.processMigrateByMetting = this.processMigrateByMetting.bind(this);
    this.processFilesByMetting = this.processFilesByMetting.bind(this);
    this.searchBlobsByNroEncuentroProcess = this.searchBlobsByNroEncuentroProcess.bind(this);
    this.exportDoubleMechanism = this.exportDoubleMechanism.bind(this);
  }

  async processMigrateMettings(req, res) {
    this._mettingsService.processMigrateMettings();
    return res.status(200).send({
      status: 200,
      message: 'Data process migrate invoice',
    });
  }

  async processMigrateByMetting(req, res) {
    this._mettingsService.processMigrateByMetting();
    return res.status(200).send({
      status: 200,
      message: 'Data process migrate by metting',
    });
  }

  async processFilesByMetting(req, res) {
    this._mettingsService.processFilesByMetting();
    return res.status(200).send({
      status: 200,
      message: 'Data process files by metting',
    });
  }

  async searchBlobsByNroEncuentroProcess(req, res) {
    this._mettingsService.searchBlobsByNroEncuentroProcess();
    return res.status(200).send({
      status: 200,
      message: 'Data process search files in blob by metting',
    });
  }

  async exportDoubleMechanism(req, res) {
    this._mettingsService.exportDoubleMechanism();
    return res.status(200).send({
      status: 200,
      message: 'Data process double mechanism export by metting',
    });
  }
}
