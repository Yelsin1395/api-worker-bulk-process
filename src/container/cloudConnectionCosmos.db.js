import { CosmosClient } from '@azure/cosmos';
import clc from 'cli-color';

export default class CosmosImpl {
  constructor({ config }) {
    this._config = config;
    this.impl = null;
  }

  async initConnect() {
    try {
      const cosmosClient = new CosmosClient({ endpoint: this._config.COSMOS_ENDPOINT, key: this._config.COSMOS_KEY });
      const { database } = await cosmosClient.databases.createIfNotExists({ id: this._config.COSMOS_CONTAINER });

      console.log(clc.bgMagentaBright(`The database is connected: ${database.id}`));
      
      this.impl = database;
    } catch (error) {
      throw new Error(error);
    }
  }
}
