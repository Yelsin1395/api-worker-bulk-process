import { Router } from 'express';

export default function ({ mettingsController }) {
  const router = Router();

  router.post('/process-migrate', mettingsController.processMigrateMettings);

  return router;
}
