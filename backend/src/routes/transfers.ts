import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as transferController from '../controllers/transferController';

const router = Router();
router.use(authenticate);

router.get('/', transferController.getTransfers);
router.post('/', transferController.createTransfer);
router.get('/virtual-card', transferController.getVirtualCard);
router.get('/investment', transferController.getInvestment);
router.put('/investment/risk', transferController.updateRiskLevel);

export default router;
