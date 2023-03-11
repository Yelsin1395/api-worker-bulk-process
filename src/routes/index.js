import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
// import 'express-async-error';
import { errorMiddleware, notFoundMiddleware } from '../middlewares/exception.middleware';

export default function ({ homeRoutes }) {
  const router = express.Router();
  const functionRoutes = express.Router();

  //middleware default
  functionRoutes
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(cors())
    .use(helmet())
    .use(compression())
    .use(morgan('dev'));

  // prefix route
  router.use('/scraping', functionRoutes);

  //middleware setting
  router.use(errorMiddleware);
  router.use(notFoundMiddleware);

  // functions
  functionRoutes.use('/', homeRoutes);

  return router;
}
