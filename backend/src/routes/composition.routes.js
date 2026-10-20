import { Router } from 'express';
import * as ctrl from '../controllers/composition.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { lyricsRequestSchema, analyzeSchema, compositionSchema } from '../validators/index.js';

const router = Router();
router.use(requireAuth);
router.param('id', idParam);
router.post('/lyrics', aiLimiter, validate(lyricsRequestSchema), ctrl.getLyrics);
router.post('/analyze', validate(analyzeSchema), ctrl.analyze);
router.get('/', ctrl.listCompositions);
router.post('/', validate(compositionSchema), ctrl.createComposition);
router.get('/:id', ctrl.getComposition);
router.put('/:id', validate(compositionSchema), ctrl.updateComposition);
router.delete('/:id', ctrl.deleteComposition);
export default router;
