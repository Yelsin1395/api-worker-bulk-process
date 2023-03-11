import container from './container/container';
const app = container.resolve('server');

async function appStart() {
  console.log(JSON.stringify(container.registrations));

  await app.start();
}

appStart();
