import { Router } from 'express';

export default function ({ mettingsController }) {
  const router = Router();

  router.post('/process-migrate', mettingsController.processMigrateMettings);
  router.post('/process-migrate-metting', mettingsController.processMigrateByMetting);
  router.post('/process-files', mettingsController.processFilesByMetting);
  router.post('/search-metting-process', mettingsController.searchBlobsByNroEncuentroProcess);
  router.post('/double-mechanism-export', mettingsController.exportDoubleMechanism);

  return router;
}
