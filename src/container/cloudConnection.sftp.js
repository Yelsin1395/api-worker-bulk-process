import Client from 'ssh2-sftp-client';

export default class StorageSftpImpl {
  constructor({ config }) {
    this._config = config;
  }

  async connect() {
    try {
      const sftp = new Client();
      await sftp.connect({
        host: this._config.SFTP_CONNECT_HOST,
        port: this._config.SFTP_CONNECT_PORT,
        username: this._config.SFTP_CONNECT_USERNAME,
        password: this._config.SFTP_CONNECT_PASSWORD,
      });
      return sftp;
    } catch (error) {
      console.error(error);
    }
  }
}
