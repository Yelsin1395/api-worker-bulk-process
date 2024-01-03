export default class ClinicaRecordRepository {
  constructor({ config, cosmosImpl }) {
    this._config = config;
    this._cosmosImpl = cosmosImpl;
  }

  async traverse(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_CLINICARECORD });

    const querySpec = {
      query: 'SELECT * FROM c',
      parameters: [],
    };

    const data = await container.items.query(querySpec, { maxItemCount: this._config.MAX_ITEM_COUNT_CLINICARECORD, continuationToken }).fetchNext();

    console.log(`📦 Data package process found: ${data?.resources?.length}`);

    return {
      resources: data.resources,
      continuationToken: data.continuationToken,
    };
  }

  async getAllExpedientNotGenerate(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_CLINICARECORD });

    const querySpec = {
      query: "SELECT * FROM c WHERE c.estado != 'EXPEDIENTE_GENERADO' AND c.nroLote != 0 AND c._ts >= 1680307200 AND c._ts <= 1703116799",
      parameters: [],
    };

    const data = await container.items.query(querySpec, { maxItemCount: this._config.MAX_ITEM_COUNT_CLINICARECORD, continuationToken }).fetchNext();

    console.log(`📦 Data package process found: ${data?.resources?.length}`);

    return {
      resources: data.resources,
      continuationToken: data.continuationToken,
    };
  }

  async getRecordByLoteAndFactura(nroLote, facturaNro) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_CLINICARECORD });

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

  async getAllByNroLote(nroLote) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_CLINICARECORD });

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

  async getInvoiceByNroFactura(facturaNro) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_CLINICARECORD });

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.facturaNro = @facturaNro',
      parameters: [
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
