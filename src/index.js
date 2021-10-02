const express = require('express');
const history = require('connect-history-api-fallback');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Add API backend.
app.use('/api', require('./api'));

// Add vue frontend
const vue = express.static('./public');
app.use(vue);
app.use(history({
    disableDotRule: true
}));
app.use(vue);

// Connect to database.
mongoose.connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    // Start app after connection.
    app.listen(process.env.PORT, () => console.log('Running the lendr web app on port 3000.'));
}).catch((err) => console.error(err));