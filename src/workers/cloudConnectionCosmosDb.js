const { CosmosClient } = require('@azure/cosmos');

async function initConnect() {
  const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
  });
  const { database } = await cosmosClient.databases.createIfNotExists({ id: process.env.COSMOS_CONTAINER });

  return {
    cosmosImpl: database,
  };
}

module.exports = { initConnect };
