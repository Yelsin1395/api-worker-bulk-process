export default class ClinicaRecordRepository {
  constructor({ config, cosmosImpl }) {
    this._config = config;
    this._cosmosImpl = cosmosImpl;
  }

  async traverse(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_CLINICARECORD });

    const querySpec = {
      // ORDER BY c.nroLote
      query: 'SELECT * FROM c',
      parameters: [],
    };

    const data = await container.items.query(querySpec, { maxItemCount: 30, continuationToken }).fetchNext();
    console.log({data: data?.resources?.length});
    return {
      resources: data.resources,
      continuationToken: data.continuationToken,
    };
  }
}
