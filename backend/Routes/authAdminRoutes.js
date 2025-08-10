import express from 'express';
import { loginAdmin,logoutAdmin,registerAdmin } from '../Controller/authAdminController.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.post('/register', registerAdmin);

export default router;
