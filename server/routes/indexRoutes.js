import { Router } from 'express';
import { getIndexComparison } from '../controllers/indexController.js';

const router = Router();

router.get('/comparison', getIndexComparison);

export default router;
