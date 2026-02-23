import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as transactionController from '../controllers/transactionController';

const router = Router();
router.use(authenticate);

router.get('/', transactionController.getTransactions);

export default router;
