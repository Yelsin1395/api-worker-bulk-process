const { BlobServiceClient } = require('@azure/storage-blob');

function initConnect() {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  return blobServiceClient.getContainerClient('documentstorage');
}

module.exports = { initConnect };
