export default class DevolutionsController {
  constructor({ devolutionsService }) {
    this._devolutionsService = devolutionsService;

    this.processMigrateDevolutions = this.processMigrateDevolutions.bind(this);
  }

  async processMigrateDevolutions(req, res) {
    this._devolutionsService.processMigrateDevolutions();
    return res.status(200).send({
      status: 200,
      message: 'Data process migrate devolutions',
    });
  }
}
