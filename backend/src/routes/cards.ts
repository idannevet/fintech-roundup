import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as cardController from '../controllers/cardController';

const router = Router();
router.use(authenticate);

router.get('/', cardController.getCards);
router.post('/', cardController.addCard);
router.delete('/:id', cardController.deleteCard);
router.patch('/:id/toggle', cardController.toggleCard);
router.post('/:id/simulate', cardController.simulateTransaction);

export default router;
