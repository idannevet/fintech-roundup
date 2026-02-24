import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as recurringController from '../controllers/recurringController';

const router = Router();
router.use(authenticate);

router.get('/', recurringController.getRecurring);
router.post('/', recurringController.createRecurring);
router.patch('/:id/toggle', recurringController.toggleRecurring);
router.delete('/:id', recurringController.deleteRecurring);

export default router;
