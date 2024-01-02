export default class DocumentRepository {
  constructor({ config, cosmosImpl }) {
    this._config = config;
    this._cosmosImpl = cosmosImpl;
  }

  async traverse(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_DOCUMENT });

    const querySpec = {
      query: 'SELECT * FROM c',
      parameters: [],
    };

    const data = await container.items.query(querySpec, { maxItemCount: this._config.MAX_ITEM_COUNT_DOCUMENT, continuationToken }).fetchNext();

    console.log(`📦 Data package process found: ${data?.resources?.length}`);

    return {
      resources: data.resources,
      continuationToken: data.continuationToken,
    };
  }

  async searchBasic(filter) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_DOCUMENT });

    let querySpec = {
      query: `SELECT * FROM c WHERE <<condition>> ORDER BY c.nroEncuentro ASC`,
      parameters: [],
    };

    this._setSearchCondition(querySpec, filter);

    const result = await container.items.query(querySpec).fetchAll();
    return result.resources;
  }

  _setSearchCondition(querySpec, filter) {
    const conditions = [];

    if (filter.nroEncuentro) {
      conditions.push('c.nroEncuentro = @nroEncuentro');
      querySpec.parameters.push({
        name: '@nroEncuentro',
        value: `${filter.nroEncuentro}`,
      });
    }

    if (filter.nroLote) {
      conditions.push('c.nroLote = @nroLote');
      querySpec.parameters.push({
        name: '@nroLote',
        value: parseInt(filter.nroLote),
      });
    }

    if (filter.facturaNro) {
      conditions.push('c.facturaNro = @facturaNro');
      querySpec.parameters.push({
        name: '@facturaNro',
        value: filter.facturaNro,
      });
    }

    if (filter.historialDevolucion) {
      conditions.push('ARRAY_LENGTH(c.historialDevolucion) > 0');
    }

    querySpec.query = querySpec.query.replace('<<condition>>', conditions.length && conditions.join(' AND '));
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

  async getHistorialDevolucionByNroLote(nroLote) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_DOCUMENT });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.nroLote = @nroLote AND ARRAY_LENGTH(c.historialDevolucion) > 0',
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

  async getAllByNroLote(nroLote) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_DOCUMENT });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.nroLote = @nroLote',
      parameters: [
        {
          name: '@nroLote',
          value: parseInt(nroLote),
        },
      ],
    };

    const result = await container.items.query(querySpec).fetchAll();
    return result.resources;
  }

  async getAllByMetting(nroEncuentro) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_DOCUMENT });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.nroEncuentro = @nroEncuentro',
      parameters: [
        {
          name: '@nroEncuentro',
          value: `${nroEncuentro}`,
        },
      ],
    };

    const result = await container.items.query(querySpec).fetchAll();
    return result.resources;
  }
}
