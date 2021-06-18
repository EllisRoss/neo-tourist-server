const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
}

// routes declaration
const searchHotelRouter = require('./routes/hotelsRouter');
const searchFlightRouter = require('./routes/flightsRouter');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));

// routes
app.use('/search-hotel', searchHotelRouter);
app.use('/search-flight', searchFlightRouter);

module.exports = app;
