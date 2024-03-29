import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-error';
import { errorMiddleware, notFoundMiddleware } from '../middlewares/exception.middleware';

export default function ({
  homeRoutes,
  clinicaRecordRoutes,
  invoiceRoutes,
  documentRoutes,
  mettingsRoutes,
  devolutionsRoutes,
  uploadHistoryRoutes,
  loteRoutes,
}) {
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
  apiRoutes.use('/invoice', invoiceRoutes);
  apiRoutes.use('/document', documentRoutes);
  apiRoutes.use('/mettings', mettingsRoutes);
  apiRoutes.use('/devolutions', devolutionsRoutes);
  apiRoutes.use('/upload-history', uploadHistoryRoutes);
  apiRoutes.use('/lote', loteRoutes);

  return router;
}
