import { Router } from 'express';
import { createSong, listSongs, deleteSong } from '../controllers/song.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { songRequestSchema } from '../validators/index.js';

const router = Router();
router.use(requireAuth);
router.param('id', idParam);
router.post('/generate', aiLimiter, validate(songRequestSchema), createSong);
router.get('/', listSongs);
router.delete('/:id', deleteSong);
export default router;
