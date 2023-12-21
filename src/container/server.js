import express from 'express';
import clc from 'cli-color';

export default class Server {
  constructor({ pkg, config, cosmosImpl, mongoImpl, routes }) {
    this._pkg = pkg;
    this._config = config;
    this._cosmosImpl = cosmosImpl;
    this._mongoImpl = mongoImpl;
    this._express = express().use(routes);
  }

  async start() {
    const PORT = this._config.PORT;
    await this._cosmosImpl.initConnect();
    await this._mongoImpl.initConnect();
    return this._express.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'production') {
        const route = () => `http://localhost:${PORT}`;
        console.log(`Hello, your app is ready on ${route()}`);
        console.log('To shut it down, press <CTRL> + C at any time.');
        console.log(clc.greenBright('-------------------------------------------------------'));
        console.log(clc.greenBright(`Environment  : ${process.env.NODE_ENV}`));
        console.log(clc.greenBright(`App name     : ${this._pkg.name}`));
        console.log(clc.greenBright(`Version      : ${this._pkg.version}`));
        console.log(clc.greenBright(`Author api   : ${this._pkg.author}`));
        console.log(clc.greenBright(`API Info     : ${route()}`));
        console.log(clc.greenBright('-------------------------------------------------------'));
      } else {
        console.log(`${this._pkg.name} running on port ${PORT}`);
      }
    });
  }
}
