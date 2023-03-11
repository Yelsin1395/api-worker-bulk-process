export default class HomeController {
  constructor({ homeService }) {
    this._homeService = homeService;

    this.index = this.index.bind(this);
  }

  index(req, res) {
    return res.status(200).send(this._homeService.index());
  }
}
