import { createContainer, asClass, asFunction, asValue, Lifetime } from 'awilix';

// setting container app
import pkg from '../../package.json';
import config from './config';
import server from './server';
import CosmosImpl from './cloudConnectionCosmos.db';
import routes from '../routes/index';
import APP_DATA_PROCESS from '../../APP_DATA_PROCESS.json'

const container = createContainer();
container.register({
  pkg: asValue(pkg),
  appDataProcess: asValue(APP_DATA_PROCESS),
  config: asValue(config),
  server: asClass(server).singleton(),
  cosmosImpl: asClass(CosmosImpl).singleton(),
  routes: asFunction(routes).singleton(),
});

container.loadModules(['repositories/**/*.repository.js', 'services/**/*.service.js', 'controllers/**/*.controller.js', 'routes/**/*.routes.js'], {
  cwd: `${__dirname}/..`,
  formatName: 'camelCase',
  resolverOptions: {
    lifetime: Lifetime.SINGLETON,
  },
});

export default container;
