import { Router } from 'express';
import { getOverview, listUsers, setRole, getUserPrompts, listAllClasses, deleteUser } from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { roleSchema } from '../validators/index.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.param('id', idParam);
router.get('/overview', getOverview);
router.get('/users', listUsers);
router.patch('/users/:id/role', validate(roleSchema), setRole);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/prompts', getUserPrompts);
router.get('/classes', listAllClasses);
export default router;
