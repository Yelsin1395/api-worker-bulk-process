import { odata } from '@azure/data-tables';

export default class StorageTableRepository {
  constructor({ storageTableImpl }) {
    this._storageTableImpl = storageTableImpl;
  }

  async getExpedientByLote(garanteId, partitionKey, continuationToken) {
    const tableName = `storagetableexpediente${garanteId}`;
    const tableClient = this._storageTableImpl.connect(tableName);

    const page = await tableClient
      .listEntities({
        queryOptions: {
          filter: odata`PartitionKey eq ${partitionKey}`,
        },
      })
      .byPage({ maxPageSize: 30, continuationToken })
      .next();

    return {
      resources: page.value,
      continuationToken: page.value?.continuationToken ?? null,
    };
  }
}
