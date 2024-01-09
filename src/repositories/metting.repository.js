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

  async getAllByNroEncuentro(nroEncuentro) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_MEETING });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.nroEncuentro = @nroEncuentro',
      parameters: [
        {
          name: '@nroEncuentro',
          value: nroEncuentro,
        },
      ],
    };

    const result = await container.items.query(querySpec).fetchAll();
    return result.resources;
  }

  async getAllMettingTraverse(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_MEETING });

    const querySpec = {
      query: 'SELECT * FROM c  WHERE c.nroLote = "0" AND c.nroFactura = "0" AND c.archivos = null',
      parameters: [],
    };

    const data = await container.items.query(querySpec, { maxItemCount: this._config.MAX_ITEM_COUNT_METTING, continuationToken }).fetchNext();

    console.log(`📦 Data package process found: ${data?.resources?.length}`);

    return {
      resources: data.resources,
      continuationToken: data.continuationToken,
    };
  }

  async allMettingsByDate(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_MEETING });

    const querySpec = {
      query: 'SELECT * FROM c  WHERE c.fechaRegistro >= "2023-12-26T00:00:00.000Z" AND c.nroLote != "0" AND c.nroFactura != "0"',
    };

    const data = await container.items.query(querySpec, { maxItemCount: this._config.MAX_ITEM_COUNT_METTING, continuationToken }).fetchNext();

    console.log(`📦 Data package process found: ${data?.resources?.length}`);

    return {
      resources: data.resources,
      continuationToken: data.continuationToken,
    };
  }

  async update(metting) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_MEETING });

    await container.items.upsert(metting);
  }
}
