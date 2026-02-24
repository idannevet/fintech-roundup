import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as goalsController from '../controllers/goalsController';

const router = Router();
router.use(authenticate);

router.get('/', goalsController.getGoals);
router.post('/', goalsController.createGoal);
router.patch('/:id', goalsController.updateGoal);
router.delete('/:id', goalsController.deleteGoal);
router.post('/:id/contribute', goalsController.contributeToGoal);

export default router;
