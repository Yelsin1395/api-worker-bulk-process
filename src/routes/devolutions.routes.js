import { Router } from 'express';

export default function ({ devolutionsController }) {
  const router = Router();

  router.post('/process-migrate', devolutionsController.processMigrateDevolutions.bind(devolutionsController));

  return router;
}
