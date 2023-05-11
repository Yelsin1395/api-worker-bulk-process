import { createContainer, asClass, asFunction, asValue, Lifetime } from 'awilix';

// setting container app
import pkg from '../../package.json';
import config from './config';
import server from './server';
import CosmosImpl from './cloudConnectionCosmos.db';
import routes from '../routes/index';

const container = createContainer();
container.register({
  pkg: asValue(pkg),
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
