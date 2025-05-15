const { Router } = require('express');
const adminRouter = require('./admin/index');
const userRouter = require('./user/index');
const publicRouter = require('./publicRoutes/index');

const router = Router();

router.use('/admin', adminRouter);
router.use('/user', userRouter);
router.use('/public', publicRouter);

module.exports = router;
