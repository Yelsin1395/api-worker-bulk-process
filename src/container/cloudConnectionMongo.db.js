import { set, connect } from 'mongoose';
import { ConnectionString } from 'connection-string';
import clc from 'cli-color';

export default class MongoImpl {
  constructor({ config }) {
    this._config = config;
  }

  async initConnect() {
    try {
      const uri = new ConnectionString('', {
        user: this._config.DB_USER_MONGO,
        password: this._config.DB_KEY_MONGO,
        protocol: 'mongodb+srv',
        hosts: [{ name: this._config.DB_HOST_MONGO }],
        path: [String(this._config.DB_CONTAINER_NAME_MONGO)],
        params: {
          retryWrites: true,
          w: 'majority',
        },
      });

      // const optionMongoose = {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
      // };

      set('runValidators', true);

      await connect(uri.toString());

      console.log(clc.bgBlueBright(`The database is connected: ${this._config.DB_CONTAINER_NAME_MONGO}`));
    } catch (error) {
      console.error(clc.red(error));
    }
  }
}
