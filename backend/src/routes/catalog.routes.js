import { Router } from 'express';
import { listCategories, getCourses, getLesson, checkAnswer, submitQuiz } from '../controllers/catalog.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { answerCheckSchema, quizSchema } from '../validators/index.js';

const router = Router();
router.param('id', idParam);
router.get('/categories', listCategories);
router.get('/courses', requireAuth, getCourses);
router.get('/lessons/:id', requireAuth, getLesson);
router.post('/lessons/:id/check', requireAuth, validate(answerCheckSchema), checkAnswer);
router.post('/lessons/:id/quiz', requireAuth, validate(quizSchema), submitQuiz);
export default router;
