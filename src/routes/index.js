import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-error';
import { errorMiddleware, notFoundMiddleware } from '../middlewares/exception.middleware';

export default function ({ homeRoutes, clinicaRecordRoutes }) {
  const router = express.Router();
  const apiRoutes = express.Router();

  //middleware default
  apiRoutes
    .use(express.json())
    .use(express.urlencoded({ extended: false }))
    .use(cors())
    .use(helmet())
    .use(compression())
    .use(morgan('dev'));

  // prefix route
  router.use('', apiRoutes);

  //middleware setting
  router.use(errorMiddleware);
  router.use(notFoundMiddleware);

  // functions
  apiRoutes.use('/', homeRoutes);
  apiRoutes.use('/clinicarecord', clinicaRecordRoutes);

  return router;
}
