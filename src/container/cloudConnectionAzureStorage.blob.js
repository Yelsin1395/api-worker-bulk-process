import { BlobServiceClient } from '@azure/storage-blob';

export default class StorageBlobImpl {
  constructor({ config }) {
    this._config = config;
  }

  connect(blobContainerClient) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(this._config.AZURE_STORAGE_CONNECTION_STRING);
    return blobServiceClient.getContainerClient(blobContainerClient);
  }
}
