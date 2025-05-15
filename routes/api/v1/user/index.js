const { Router } = require('express');
const authRoutes = require('./authRoutes');
const commentRoutes = require('./commentRoutes');
const router = Router();

router.use('/auth', authRoutes);
router.use('/comments', commentRoutes);
module.exports = router;
