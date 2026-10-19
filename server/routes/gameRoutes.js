import { Router } from 'express';
import * as c from '../controllers/gameController.js';

const router = Router();

router.post('/games', c.newGame);
router.get('/games/:id', c.getGame);
router.delete('/games/:id', c.quit);
router.post('/games/:id/play', c.play);
router.post('/games/:id/draw', c.draw);
router.post('/games/:id/pass', c.pass);
router.post('/games/:id/uno', c.uno);
router.post('/games/:id/bot', c.bot);
router.get('/stats', c.stats);

export default router;