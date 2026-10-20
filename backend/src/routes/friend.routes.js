import { Router } from 'express';
import { getFriends, sendRequest, acceptRequest, removeFriendship } from '../controllers/friend.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { friendRequestSchema } from '../validators/index.js';

const router = Router();
router.use(requireAuth);
router.param('id', idParam);
router.get('/', getFriends);
router.post('/', validate(friendRequestSchema), sendRequest);
router.post('/:id/accept', acceptRequest);
router.delete('/:id', removeFriendship);
export default router;
