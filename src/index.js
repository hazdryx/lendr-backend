const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express().use('/api', require('./api'));

// Connect to database.
mongoose.connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    // Start app after connection.
    app.listen(process.env.PORT, () => console.log('Running the lendr web app on port 3000.'));
}).catch((err) => console.error(err));