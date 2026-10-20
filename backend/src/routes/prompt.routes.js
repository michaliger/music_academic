import { Router } from 'express';
import { createPrompt, listMyPrompts } from '../controllers/prompt.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { promptSchema } from '../validators/index.js';

const router = Router();
router.use(requireAuth);
router.post('/', aiLimiter, validate(promptSchema), createPrompt);
router.get('/me', listMyPrompts);
export default router;
