const express = require('express');
const cors = require('cors');
const router = express.Router();

// Add API versions.
const current = require('./v1');
router.use('/current', current);
router.use('/v1', current);

module.exports = router;