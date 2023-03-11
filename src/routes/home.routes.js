import { Router } from 'express';

export default function ({ homeController }) {
  const router = Router();

  router.get('/', homeController.index);

  return router;
}
