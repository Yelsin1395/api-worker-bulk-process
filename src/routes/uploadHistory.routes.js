import { Router } from 'express';

export default function ({ uploadHistoryController }) {
  const router = Router();

  router.post('/run', uploadHistoryController.processUploadHistory.bind(uploadHistoryController));
  router.post('/export-report', uploadHistoryController.exportReport.bind(uploadHistoryController));

  return router;
}
