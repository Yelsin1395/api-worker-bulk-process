import express from 'express';

export default class Server {
  constructor({ pkg, config, routes }) {
    this._pkg = pkg;
    this._config = config;
    this._express = express().use(routes);
  }

  async start() {
    const PORT = this._config.PORT;
    return this._express.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'production') {
        const route = () => `http://localhost:${PORT}`;
        console.log(`Hello, your app is ready on ${route()}`);
        console.log('To shut it down, press <CTRL> + C at any time.');
        console.log('-------------------------------------------------------');
        console.log(`Environment  : ${process.env.NODE_ENV}`);
        console.log(`Version      : ${this._pkg.version}`);
        console.log(`API Info     : ${route()}`);
        console.log('-------------------------------------------------------');
      } else {
        console.log(`${this._pkg.name} running on port ${PORT}`);
      }
    });
  }
}
