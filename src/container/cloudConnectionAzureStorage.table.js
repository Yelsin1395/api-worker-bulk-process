import { TableClient } from '@azure/data-tables';

export default class StorageTableImpl {
  constructor({ config }) {
    this._config = config;
  }

  connect(tableName) {
    const tableClient = TableClient.fromConnectionString(this._config.AZURE_ACCOUNT_CONNECTION_STRING, tableName);
    return tableClient;
  }
}
