export default class MettingRepository {
  constructor({ config, cosmosImpl }) {
    this._config = config;
    this._cosmosImpl = cosmosImpl;
  }

  async getByFacturaLote(nroFactura, nroLote) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_MEETING });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.nroFactura = @nroFactura AND c.nroLote = @nroLote',
      parameters: [
        {
          name: '@nroFactura',
          value: nroFactura,
        },
        {
          name: '@nroLote',
          value: nroLote,
        },
      ],
    };

    const result = await container.items.query(querySpec).fetchAll();
    return result.resources;
  }

  async getAllByNroLote(nroLote) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_MEETING });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.nroLote = @nroLote',
      parameters: [
        {
          name: '@nroLote',
          value: nroLote,
        },
      ],
    };

    const result = await container.items.query(querySpec).fetchAll();
    return result.resources;
  }
}
