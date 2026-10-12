import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { firebaseLogin } from '../controllers/firebaseAuthController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/firebase', firebaseLogin);
router.post('/logout', logout);
router.get('/me', getMe);

export default router;
