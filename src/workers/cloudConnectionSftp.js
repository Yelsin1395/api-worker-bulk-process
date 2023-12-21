const Client = require('ssh2-sftp-client');

async function initConnect() {
  try {
    const sftp = new Client();
    await sftp.connect({
      host: process.env.SFTP_CONNECT_HOST,
      port: process.env.SFTP_CONNECT_PORT,
      username: process.env.SFTP_CONNECT_USERNAME,
      password: process.env.SFTP_CONNECT_PASSWORD,
    });
    return sftp;
  } catch (error) {
    console.error(error);
  }
}

module.exports = { initConnect };
