
import { Router } from "express";

const router = Router();

router.get('/', (req, res) => {
    res.send('User route with GET method on /api/users');
})

export default router