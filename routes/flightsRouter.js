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
    const passengers = req.body.formData.child + req.body.formData.adult;
    let payload = {
        resultCode: 1,
        message: null,
        flights: [],
    }
    let filterThere = createFilter(req.body.formData.origin, req.body.formData.destination,
        req.body.formData.flightClass, passengers, req.body.formData.dates[0]);

    let filterBack = createFilter(req.body.formData.destination, req.body.formData.origin,
        req.body.formData.flightClass, passengers, req.body.formData.dates[1]);

    let rawFlights = {
        there: [],
        back: [],
    }

    db.collection('newFlights').find(filterThere).toArray((err, result) => {
        if (!err) {
            if (result.length === 0) {
                payload.message = 'Tickets not found';
                res.send(payload);
            } else {
                rawFlights.there = [...result];

                db.collection('newFlights').find(filterBack).toArray((err, result) => {
                    if (!err) {
                        if (result.length === 0) {
                            payload.message = 'Tickets not found';
                            res.send(payload);
                        } else {
                            rawFlights.back = [...result];

                            let thereFlightSorted = sortFlightsByRelevance(rawFlights.there);
                            let backFlightSorted = sortFlightsByRelevance(rawFlights.back);

                            if (thereFlightSorted.length <= backFlightSorted.length) {
                                payload.resultCode = 0;
                                let sortedFlights = thereFlightSorted.map((flight, index) => {
                                    let temp = {
                                        there: flight,
                                        back: backFlightSorted[index],
                                    }
                                    return temp;
                                });
                                if (passengers > 1) {
                                    let flights = sortedFlights.map(flight => {
                                        flight.there.price *= passengers;
                                        flight.back.price *= passengers;
                                        return flight;
                                    })
                                    payload.flights = [...flights];
                                    res.send(payload);
                                }
                                if (passengers === 1) {
                                    payload.flights = [...sortedFlights];
                                    res.send(payload);
                                }
                            }
                            if (thereFlightSorted.length > backFlightSorted.length) {
                                let sortedFlights = backFlightSorted.map((flight, index) => {
                                    let temp = {
                                        there: thereFlightSorted[index],
                                        back: flight,
                                    }
                                    return temp;
                                });
                                if (passengers > 1) {
                                    let flights = sortedFlights.map(flight => {
                                        flight.there.price *= passengers;
                                        flight.back.price *= passengers;
                                        return flight;
                                    })
                                    payload.flights = [...flights];
                                    res.send(payload);
                                }
                                if (passengers === 1) {
                                    payload.resultCode = 0;
                                    payload.flights = [...sortedFlights];
                                    res.send(payload);
                                }
                            }
                        }
                    } else {
                        payload.message = 'Tickets not found'
                        res.send(payload);
                    }
                });
            }
        } else {
            payload.message = 'Tickets not found'
            res.send(payload);
        }
    });
});

const sortFlightsByRelevance = (flights) => {
    let newFlightsArray = [...flights];
    newFlightsArray.sort(sortFunction);
    return newFlightsArray
}

const sortFunction = (a, b) => {
    let coefA = relevanceCoefficient(a);
    let coefB = relevanceCoefficient(b);
    return coefA - coefB;
}

const relevanceCoefficient = (flight) => {
    let duration = flight.duration.split(':');
    let durationInSeconds = ((Number(duration[0]) * 60 + Number(duration[1])) * 60);
    let coef = (durationInSeconds + flight.price) / 2;
    return coef;
}

const createFilter = (origin, destination, flightClass, passengers, date) => {
    const convertDate = date.split('T')[0];
    let filter;
    //passengers += 1;
    filter = {
        origin: origin,
        destination: destination,
        departure_at_short: convertDate,
        class: flightClass,
        available: {"$gte": passengers},
    }
    return filter;
}

module.exports = router;
