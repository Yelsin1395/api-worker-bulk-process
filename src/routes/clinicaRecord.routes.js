import { Router } from 'express';

export default function ({ clinicaRecordController }) {
  const router = Router();

  router.post('/process', clinicaRecordController.processAllRecords);

  return router;
}
