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

  async getLoteByRangeDate(continuationToken) {
    const tableName = 'storagetablelote';
    const tableClient = this._storageTableImpl.connect(tableName);

    const page = await tableClient
      .listEntities({
        queryOptions: {
          filter: `Timestamp ge datetime'2023-11-01T00:00:00Z' and Timestamp le datetime'2023-11-30T23:59:59Z'`,
        },
      })
      .byPage({ maxPageSize: 100, continuationToken })
      .next();

    return {
      resources: page.value,
      continuationToken: page.value?.continuationToken ?? null,
    };
  }

  async getTypeDocByCodigo(codigo) {
    const tableName = 'storagetablecatalogo';
    const tableClient = this._storageTableImpl.connect(tableName);
    let result = null;

    const iterator = await tableClient.listEntities({
      queryOptions: {
        filter: `Codigo eq '${codigo}'`,
      },
    });

    for await (const page of iterator) {
      result = page;
      break;
    }

    return result;
  }
}
