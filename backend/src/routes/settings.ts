import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as settingsController from '../controllers/settingsController';

const router = Router();
router.use(authenticate);

router.get('/rounding', settingsController.getRoundingConfig);
router.put('/rounding', settingsController.updateRoundingConfig);
router.put('/profile', settingsController.updateProfile);

export default router;
