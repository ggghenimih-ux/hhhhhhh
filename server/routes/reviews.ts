import { Router } from 'express';
import { createReview } from '../controllers/reviewController';

const router = Router();

router.post('/', createReview);

export default router;
