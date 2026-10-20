import rateLimit from 'express-rate-limit';

const limiter = (limit, message = 'יותר מדי בקשות, נסי שוב בעוד דקה') => rateLimit({ windowMs: 60_000, limit, message: { error: message } });

export const apiLimiter = limiter(200);
export const authLimiter = limiter(20);
export const aiLimiter = limiter(8); // AI calls are slow and cost money
