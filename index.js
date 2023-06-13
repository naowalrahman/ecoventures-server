const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()

const app = express()
const port = 3001

app.use(cors())

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const API_KEY = process.env.OPENWEATHERMAP_API_KEY
const locations = require("./world_cities.json")

async function getLocationData(lat, lon) {
    const response = await axios(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    return response.data
}

function dateStr() {
    let dt = new Date()
    return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}, ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`
}

/**
 * @param {JSON object} gases: JSON of the individual gas concentrations
 */
function avgGas(gases) {
    let numerator = 0;
    let denominator = 0;

    Object.values(gases).forEach((val) => {
        numerator += val;
        ++denominator;
    })

    return numerator / denominator;
}
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return Math.round(d);
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function returnRGB(distance) {
    const equatedValue = Math.min(distance / 35, 510)
    const darkFactor = 0.9;
    const otherValue = 255 * darkFactor;
    const blueVal = 96 * darkFactor;
    if (equatedValue <= 255) {
        return `rgba(${equatedValue * 0.5}, ${otherValue}, ${blueVal}, 1)`
    }
    else {
        return `rgba(${otherValue}, ${(510 - equatedValue) * 0.5}, ${blueVal}, 1)`
    }
}
function setupLocationAddressesAndDistances() {
    app.get('/location/:lat/:lon', (req, res) => {
        let params = req.params
        let dt = dateStr()

        let locationData = getLocationData(params.lat, params.lon)
        locationData.then((locationData) => {
            // console.log(locationData)

            res.send({
                date: dt,
                aqi: locationData.list[0].main.aqi,
                gas: locationData.list[0].components,
                avgGas: avgGas(locationData.list[0].components)
            })
        })

    })

    app.get('/location/:city', (req, res) => {
        let params = req.params
        res.redirect(`/location/${locations[params.city].lat}/${locations[params.city].lng}`)
    })
    // distance + color stuff
    app.get('/location/:homeCity-:otherCity', (req, res) => {
        let params = req.params
        lat1 = locations[params.homeCity].lat
        lon1 = locations[params.homeCity].lng
        lat2 = locations[params.otherCity].lat
        lon2 = locations[params.otherCity].lng

        let distanceMeasured = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)
        res.send({
            distance: distanceMeasured,
            rgb: returnRGB(distanceMeasured)
        })
    })

    app.get('/allDistance/:cityName', (req, res) => {
        let params = req.paramscon.db("Test").collection("Oranges");
        let lat1 = locations[params.cityName]["lat"]
        let lon1 = locations[params.cityName]["lng"]
        distColorList = []
        for (let property in locations) {
            let distanceMeasured = getDistanceFromLatLonInKm(lat1, lon1, locations[property]["lat"], locations[property]["lng"])
            distColorList.push([property, distanceMeasured, returnRGB(distanceMeasured)])
        }
        res.send({
            dcList: distColorList
        })
    })

}


// this code is being worked on -------------------------------------

const { MongoClient, ServerApiVersion } = require('mongodb');
const password = process.env.MONGODB_PASSWORD
const uri = process.env.ATLAS_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

/**
 * 
 * @param {Collection<Document>} collection 
 * @param {String} location 
 * @param {String} user 
 * @param {String} reviewText 
 * @returns {InsertOneResult<Document>}
 * NOTE: con.db("Test").collection("Oranges") is how to do collection
 */
async function createReview(collection, location, user, reviewText) {
    return await collection.insertOne({
        "location": location,
        "user": user,
        "review": reviewText
    });
}

// function testDB() {
//     app.post('/mongo', (req, res) => {
//         (async () => {
//             // Connect the client to the server	(optional starting in v4.7)
//             const con = await client.connect();
//             // Send a ping to confirm a successful connection
//             const orangeCollection = con.db("Test").collection("Oranges");
//             //await client.db("Test").collection("Oranges").insertOne({"testWord": "rabbit"});
//             // let variable = await orangeCollection.find().toArray();

//             await orangeCollection.insertOne({ "tawseef": "rezahome" });

//             // await orangeCollection.deleteMany({})
//             variable = await orangeCollection.find().toArray();
//             console.log(variable);
//             return variable;
//         }).then((variable) => {
//             res.send(variable)
//         })
//     })

//     fetch('https://4014-2600-4040-96f2-fb00-30e9-2d19-20fb-ff44.ngrok-free.app/mongo', { method: 'POST' }).then((res) => {
//         console.log(true)
//     })
// }
// testDB();

setupLocationAddressesAndDistances()


app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))

