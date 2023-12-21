export default class StorageBlobDevolutionsRepository {
  constructor({ storageBlobImpl }) {
    this._storageBlobImpl = storageBlobImpl;
    this._blobContainerClient = 'documentstorage';
    this._folderName = 'devoluciones';
  }

  async traverse(continuationToken) {
    const containerClient = this._storageBlobImpl.connect(this._blobContainerClient);
    const options = { maxPageSize: 5000 };
    continuationToken && (options.continuationToken = continuationToken);
    return containerClient.listBlobsFlat().byPage(options);
  }

  async downloadStringFile(blobName) {
    const containerClient = this._storageBlobImpl.connect(this._blobContainerClient);
    const blobClient = containerClient.getBlobClient(blobName);
    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = (await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody)).toString();
    return downloaded;
  }

  async streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
