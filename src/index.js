const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        'err': 'Too many requests.'
    }
});
app.use(limiter);

app.use('/api', require('./api'));

// 404 Fallback.
app.use((req, res) => {
    res.status(404).send({ err: `Cannot ${req.method.toUpperCase()} ${req.url}` });
});

// Connect to database.
mongoose.connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    // Start app after connection.
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Running the lendr web app on port ${port}.`));
}).catch((err) => console.error(err));