export default class HomeService {
  constructor({ pkg }) {
    this._pkg = pkg;
  }

  index() {
    return {
      status: 200,
      message: `Welcome to application ${this._pkg.name.split('-').join(' ')}.`,
      version: `${this._pkg.version}`,
    };
  }
}
