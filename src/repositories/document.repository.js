export default class DocumentRepository {
  constructor({ config, cosmosImpl }) {
    this._config = config;
    this._cosmosImpl = cosmosImpl;
  }

  async getRecordByLoteAndFactura(nroLote, facturaNro) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_DOCUMENT });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.nroLote = @nroLote AND c.facturaNro = @facturaNro',
      parameters: [
        {
          name: '@nroLote',
          value: nroLote,
        },
        {
          name: '@facturaNro',
          value: facturaNro,
        },
      ],
    };

    const result = await container.items.query(querySpec).fetchAll();
    return result.resources;
  }
}
