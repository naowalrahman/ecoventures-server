const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
const stringSimilarity = require('string-similarity')
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
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
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
  // // distance + color stuff
  // app.get('/location/:homeCity-:otherCity', (req, res) => {
  //   let params = req.params
  //   lat1 = locations[params.homeCity].lat
  //   lon1 = locations[params.homeCity].lng
  //   lat2 = locations[params.otherCity].lat
  //   lon2 = locations[params.otherCity].lng

  //   let distanceMeasured = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)
  //   res.send({
  //     distance: distanceMeasured,
  //     rgb: returnRGB(distanceMeasured)
  //   })
  // })
  // :type|:input
  app.get('/allDistance/:cityName&:type&:input', (req, res) => {
    let params = req.params;
    let lat1 = locations[params.cityName]["lat"]
    let lon1 = locations[params.cityName]["lng"]
    distColorList = []

    for (let property in locations) {

      let countryLinkClass;
      let countryTextClass;
      countryLinkClass = `${locations[property]["country"]}-country`
        .replace(/ /g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/'/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '');

      countryTextClass = `${locations[property]["country"]}-text`
        .replace(/ /g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/'/g, '')
        .replace(/,/g, '');

      let distanceMeasured = getDistanceFromLatLonInKm(lat1, lon1, locations[property]["lat"], locations[property]["lng"])
      distColorList.push([property, 0, locations[property]["country"], distanceMeasured, returnRGB(distanceMeasured), countryLinkClass, countryTextClass])
    }
    switch (params.type) {
      case "closest":
        distColorList.sort((a, b) => {
          return a[3] - b[3]
        })
        break;
      case "farthest":
        distColorList.sort((a, b) => {
          return b[3] - a[3]
        })
        break;
      case "country":
        distColorList = distColorList.map((item) => {
          return [item[0], stringSimilarity.compareTwoStrings(params.input.toLowerCase(), item[2].toLowerCase()), item[2], item[3], item[4], item[5], item[6]];
        }).sort((a, b) => {
          return b[1] - a[1]
        })
        break;
      case "city":
        distColorList = distColorList.map((item) => {
          return [item[0], stringSimilarity.compareTwoStrings(params.input.toLowerCase(), item[0].toLowerCase()), item[2], item[3], item[4], item[5], item[6]];
        }).sort((a, b) => {
          return b[1] - a[1]
        })
        break;
    }


    res.send({
      dcList: distColorList
    })
  })



}


// // this code is being worked on -------------------------------------

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
}
);

/**
* @param {Collection<Document>} collection 
* @param {String} location 
* @param {String} user 
* @param {String} reviewText 
* @returns {InsertOneResult<Document>}
* NOTE: con.db("Test").collection("Reviews") is how to do collection
*/
async function createReview(collection, location, user, reviewText) {
  return await collection.insertOne({
      "timeSubmitted": new Date(),
      "location": location,
      "user": user,
      "review": reviewText
    });
  }

function setupReviewAddress() {
  app.post('/submitreview/:password/:location/:user/:review', (req, res) => {
    (async () => {
      if (password === req.params.password) {
        const { location, user, review } = req.params
        await createReview(client.db("Test").collection("Reviews"), location, user, review)
        res.send("Review submitted")
      }
      
    })()
  })
}

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

function getReviewData() {
  app.post('/reviewData/:password/:location', (req, res) => {
    
    (async () => {
        const params = req.params
        if (password === params.password) { 

            let reviews = await client.db("Test").collection("Reviews").find({ location: params.location }).toArray()
            reviews = reviews.map((object) => {
              return (
                {
                  _id: object["_id"],
                  timeSubmitted: formatDate(object["timeSubmitted"]),
                  location: object["location"],
                  user: object["user"],
                  review: object["review"]
                }
              )
            })
            res.send(reviews)
        }
    })() 
  })
}


// async function testDB() {
//   // app.post('/mongo', (req, res) => {
//   //   (async () => {
//       // Connect the client to the server	(optional starting in v4.7)

//       const con = await client.connect();
//       const orangeCollection = con.db("Test").collection("Reviews");
//       //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//       // (DANGEROUS CODE, UN COMMENTING CREATES 39000+ CITIES ADDED ) -------------------------
//       // iterator = 1;
//       // console.log(Object.keys(locations).length); //39187
//       // for (property in locations) {
//       //   await createReview(orangeCollection, property, "Admin", "Test Review", new Date())
//       //   console.log(iterator + " review created");
//       //   iterator++;
//       // }
//       // (DANGEROUS CODE, UN COMMETING DELETES ALL THINGS -------------------------
//       //await orangeCollection.deleteMany({})
//       //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//       // CREATES INDEX
//       //await orangeCollection.createIndex({ location: 1 });
//       //console.log("Index creation successful!");
//       variable = await orangeCollection.find().toArray();
//       console.log(variable);
//       return variable;
//   //   })().then((variable) => {
//   //     res.send(variable)
//   //   })
//   // })
//   /*
//   fetch('http://localhost:3001/mongo', { method: 'POST' })
//   .then((res) => res.json())
//   .then(json => {console.log(json)}
//   )
//   */
// }
//testDB();
(async() => {
  console.log("ran");
  const variable = await client.db("Test").collection("Reviews").find({"timeSubmitted": {$regex : "2023-06-21"}}).toArray()
  console.log(variable);
})()
setupLocationAddressesAndDistances();
setupReviewAddress();
getReviewData();

//test review submission
// (async () => {
//     await fetch('http://localhost:3001/submitreview/Tokyo/Beanbag/awesome', { method: 'POST' })
//     variable = await client.db("Test").collection("Reviews").find({ location: 'Tokyo' }).toArray()
//     console.log(variable)
// })()

// (async () => {
//     const variable =  await fetch(`http://localhost:3001/reviewData/${process.env.MONGODB_PASSWORD}/Tokyo`, { method: 'POST' })
//     const json = await variable.json()
//     console.log(json);
//     console.log("finished get");
// })()
// // client.db("Test").collection("Reviews").deleteMany({ user: 'Beanbag' })


app.listen(port, () => console.log(`App listening on port ${port}!`))