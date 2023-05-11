import { Router } from 'express';

export default function ({ invoiceController }) {
  const router = Router();

  router.post('/process-cross', invoiceController.processCrossInvoice);

  return router;
}
