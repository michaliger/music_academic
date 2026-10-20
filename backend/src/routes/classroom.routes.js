import { Router } from 'express';
import { listClasses, createClass, joinClass, getClassProgress, removeStudent, deleteClass } from '../controllers/classroom.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { createClassSchema, joinClassSchema } from '../validators/index.js';

const router = Router();
router.use(requireAuth);
router.param('id', idParam);
router.param('sid', idParam);
router.get('/', listClasses);
router.post('/', requireRole('teacher', 'admin'), validate(createClassSchema), createClass);
router.post('/join', validate(joinClassSchema), joinClass);
router.get('/:id/progress', getClassProgress);
router.delete('/:id/students/:sid', removeStudent);
router.delete('/:id', deleteClass);
export default router;
