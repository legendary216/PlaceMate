import express from 'express';
import { loginUser, logoutUser } from '../Controller/loginController.js';

const router=express.Router();


router.post('/loginUser', loginUser);
router.post('/logoutUser', logoutUser);

export default router; 