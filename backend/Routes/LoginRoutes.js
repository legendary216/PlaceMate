import express from 'express';
import { loginHandler, logoutUser } from '../Controller/loginController.js';

const router=express.Router();


router.post('/handlelogin', loginHandler);
router.post('/logoutUser', logoutUser);

export default router; 