import { Router } from 'express';

export default function ({ documentController }) {
  const router = Router();

  router.post('/process/rollback-historial-devoluciones', documentController.processRollbackFieldHistorialDevolucion.bind(documentController));

  return router;
}
