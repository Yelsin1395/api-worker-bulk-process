export default class UploadHistoryController {
  constructor({ uploadHistoryService }) {
    this._uploadHistoryService = uploadHistoryService;

    this.processUploadHistory = this.processUploadHistory.bind(this);
    this.exportReport = this.exportReport.bind(this);
  }

  async processUploadHistory(req, res) {
    this._uploadHistoryService.processUploadHistory();
    return res.status(200).send({
      status: 200,
      message: 'Data process upload history',
    });
  }

  async exportReport(req, res) {
    this._uploadHistoryService.exportReport();
    return res.status(200).send({
      status: 200,
      message: 'Export report expedient not generate in upload history',
    });
  }
}
