import { Router } from 'express';

export default function ({ loteController }) {
  const router = Router();

  router.post('/process-migrate', loteController.processMigrateLote);
  router.post('/process-copy-file', loteController.processCopyFilesByLote);

  return router;
}
