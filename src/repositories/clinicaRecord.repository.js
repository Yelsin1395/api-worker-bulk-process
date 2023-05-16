export default class ClinicaRecordRepository {
  constructor({ config, cosmosImpl }) {
    this._config = config;
    this._cosmosImpl = cosmosImpl;
  }

  async traverse(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_CLINICARECORD });

    const querySpec = {
      query: "SELECT * FROM c WHERE c.estado = 'EXPEDIENTE_PENDIENTE'",
      parameters: [],
    };

    const data = await container.items.query(querySpec, { maxItemCount: 500, continuationToken }).fetchNext();

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
}
