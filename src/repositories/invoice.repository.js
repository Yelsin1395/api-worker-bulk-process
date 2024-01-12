const helpers = require('../common/helpers');

export default class InvoiceRepository {
  constructor({ config, cosmosImpl }) {
    this._config = config;
    this._cosmosImpl = cosmosImpl;
  }

  async traverse(continuationToken) {
    const { container } = await this._cosmosImpl.impl.containers.createIfNotExists({ id: this._config.COSMOS_TABLE_INVOICE });

    const querySpec = {
      query: `SELECT * FROM c WHERE c.estadoExpediente != 'EXPEDIENTE_GENERADO' AND c.fechaRegistro >= '${helpers.normalizeDateTime(
        '01/04/2023'
      )}' AND c.fechaRegistro <= '${helpers.normalizeCurrentDateTimeUtc()}'`,
    };

    const data = await container.items.query(querySpec, { maxItemCount: this._config.MAX_ITEM_COUNT_INVOICE, continuationToken }).fetchNext();

    console.log(`📦 Data package process found: ${data?.resources?.length}`);

    return {
      resources: data.resources,
      continuationToken: data.continuationToken,
    };
  }
}
