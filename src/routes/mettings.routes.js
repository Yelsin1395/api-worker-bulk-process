import { Router } from 'express';

export default function ({ mettingsController }) {
  const router = Router();

  router.post('/process-migrate', mettingsController.processMigrateMettings);
  router.post('/process-migrate-metting', mettingsController.processMigrateByMetting);

  return router;
}
