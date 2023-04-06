export default class HomeController {
  constructor({ homeService }) {
    this._homeService = homeService;

    this.index = this.index.bind(this);
  }

  index(req, res) {
    const data = this._homeService.index();
    return res.status(data.status).send(data);
  }
}
