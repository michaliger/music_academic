import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import auth from './auth.routes.js';
import prompts from './prompt.routes.js';
import friends from './friend.routes.js';
import classes from './classroom.routes.js';
import admin from './admin.routes.js';
import songs from './song.routes.js';
import compositions from './composition.routes.js';
import ai from './ai.routes.js';
import catalog from './catalog.routes.js';

/** All API routes, mounted under /api by app.js. */
const router = Router();
router.use('/auth', authLimiter, auth);
router.use('/prompts', prompts);
router.use('/friends', friends);
router.use('/classes', classes);
router.use('/admin', admin);
router.use('/songs', songs);
router.use('/compositions', compositions);
router.use('/ai', ai);
router.use('/', catalog);
export default router;
