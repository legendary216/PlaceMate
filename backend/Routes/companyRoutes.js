import express from 'express';
const router = express.Router();
import {
    getPlacementStatsByYear,
    getCompaniesByYear,
    addCompany,
    updateCompany,
    deleteCompany,
    addPlacement,
    deletePlacement,
    getPlacementsAdmin,
    updatePlacement
} from '../Controller/companyController.js';

import { protect, authorize } from '../Middleware/authMiddleware.js';

// --- Public Routes ---

// GET /api/placements/stats/:year
router.get('/placements/stats/:year', getPlacementStatsByYear);

// GET /api/companies/visited/:year
router.get('/companies/visited/:year', getCompaniesByYear);


// --- Admin Routes (To be added later) ---
// ...

// --- Admin Routes ---

// Company CRUD
router.post('/companies', protect, authorize('admin'), addCompany);
router.put('/companies/:id', protect, authorize('admin'), updateCompany);
router.delete('/companies/:id', protect, authorize('admin'), deleteCompany);

// Placement CRUD
router.post('/placements', protect, authorize('admin'), addPlacement);
router.get('/placements/admin/:year', protect, authorize('admin'), getPlacementsAdmin); // Get detailed list for admin
router.put('/placements/:id', protect, authorize('admin'), updatePlacement);
router.delete('/placements/:id', protect, authorize('admin'), deletePlacement);


export default router;