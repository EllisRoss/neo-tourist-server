const express = require('express');
const router = express.Router();
const mongo = require('mongodb');

let db;

mongo.MongoClient.connect('mongodb://localhost:27017/', {useUnifiedTopology: true},
    function (err, client) {
  if (err) {
    throw err;
  }
  db = client.db('NeoTourist');
});

router.post('/', (req, res, next) => {
  let payload = {
    resultCode: 1,
    message: null,
    hotels: [],
  }
  let filter = {
    city: req.body.hotelQuery.city,
    rooms: {"$elemMatch": {personAmount: {"$gte": req.body.hotelQuery.guests}}}
  }
  db.collection('hotels').find(filter).toArray((err, result) => {
    if (!err) {
      if (req.body.filter.sortByLowPrice) {
        payload.hotels = [...result];
        payload.hotels.sort(sortByLowPrice);
        payload.resultCode = 0;
        res.send(payload);
      } else if (req.body.filter.sortByStars) {
        payload.hotels = [...result];
        payload.hotels.sort(sortByHighStars);
        payload.resultCode = 0;
        res.send(payload);
      } else if (req.body.filter.sortByUsersScore) {
        payload.hotels = [...result];
        payload.hotels.sort(sortByGuestScore);
        payload.resultCode = 0;
        res.send(payload);
      } else {
        payload.hotels = [...result];
        payload.resultCode = 0;
        res.send(payload);
      }
    } else {
      payload.message = 'Tickets not found'
      res.send(payload);
    }
  });
});

const sortByLowPrice = (a, b) => {
  return a.price - b.price;
}

const sortByHighStars = (a, b) => {
  return b.stars - a.stars;
}

const sortByGuestScore = (a, b) => {
  return b.guestScore - a.guestScore;
}

module.exports = router;
