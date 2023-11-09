const { CosmosClient } = require('@azure/cosmos');
const config = require('../config.worker');

async function initConnect() {
  const cosmosClient = new CosmosClient({
    endpoint: config.COSMOS_ENDPOINT,
    key: config.COSMOS_KEY,
  });
  const { database } = await cosmosClient.databases.createIfNotExists({ id: config.COSMOS_CONTAINER });

  return {
    cosmosImpl: database,
  };
}

module.exports = { initConnect };
