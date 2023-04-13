const { parentPort, workerData } = require('worker_threads');
const clc = require('cli-color');
const { v4: uuidv4 } = require('uuid');
const { initConnect } = require('./cloudConnectionCosmosDb');
const processRunner = require('../utils/processRunner.util');
const processId = uuidv4();

parentPort.postMessage(processId);

const items = JSON.parse(Buffer.from(workerData.dataProcess).toString());

async function workerProcess(items) {
  const { cosmosImpl } = await initConnect();
  const { container } = await cosmosImpl.containers.createIfNotExists({ id: process.env.COSMOS_TABLE_EXPEDIENTEDIGITALTEST });
  const wd = processRunner(items, 30);
  let processEnd = false;

  do {
    const { done, value } = wd.next();
    if (value) {
      for (let item of value) {
        console.log(clc.yellowBright(`⌛ Data process number: ${item.id}`));
        item = { ...item, nroLote: String(item.nroLote) };
        await container.items.upsert(item);
        console.log(clc.greenBright(`✅ Data ${item.id} is processed correctly`));
      }
    }

    processEnd = done;
  } while (!processEnd);

  console.log(clc.bgCyanBright(`🔧 Process worker finished ${processId}`));
}

workerProcess(items);
