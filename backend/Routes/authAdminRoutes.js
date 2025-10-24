import express from 'express';
import { loginAdmin,logoutAdmin,registerAdmin } from '../Controller/authAdminController.js';
import { approveMentor } from '../Controller/authAdminController.js';
import { protect} from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.post('/register', registerAdmin);

router.put('/approve-mentor/:mentorId', protect, approveMentor);
 
export default router;
 