const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use('/api', require('./api'));

// Connect to database.
mongoose.connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    // Start app after connection.
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Running the lendr web app on port ${port}.`));
}).catch((err) => console.error(err));