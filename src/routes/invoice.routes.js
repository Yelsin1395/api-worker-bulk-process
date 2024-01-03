import { Router } from 'express';

export default function ({ invoiceController }) {
  const router = Router();

  router.post('/process-migrate', invoiceController.processMigrateInvoice);
  router.post('/process-migrate-nrofactura', invoiceController.processMigrateByNumInvoice);

  return router;
}
