const { parentPort, workerData } = require('worker_threads');
const process = require('process');
const processRunner = require('../utils/processRunner.util');

parentPort.postMessage(process.pid);

const items = JSON.parse(Buffer.from(workerData.dataProcess).toString());

async function workerProcess(items) {
  let processEnd = false;
  const wd = processRunner(items, 50);

  do {
    const { done, value } = wd.next();
    if (value) {
      console.log({ valueProcess: value.length });
    }

    processEnd = done;
  } while (!processEnd);

  console.log(`Process worker finished ${process.pid}`);
}

workerProcess(items);
