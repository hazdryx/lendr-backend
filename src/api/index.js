const express = require('express');
const cors = require('cors');
const router = express.Router();

// Apply initial middleware.
router.use(cors());
router.use(express.json());

// Add API versions.
const current = require('./v1');
router.use('/current', current);
router.use('/v1', current);

// 404 Fallback.
router.use((req, res) => {
  res.status(404).send({ err: `Cannot ${req.method.toUpperCase()} /api${req.url}` });
});

module.exports = router;