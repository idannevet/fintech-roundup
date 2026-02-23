import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as walletController from '../controllers/walletController';

const router = Router();
router.use(authenticate);

router.get('/', walletController.getWallet);
router.get('/history', walletController.getWalletHistory);
router.get('/stats', walletController.getWalletStats);

export default router;
