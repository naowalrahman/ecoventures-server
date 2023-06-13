// remember to do npm install mongodb and mongoose and add the password to env

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
const MongoClient = require('mongodb').MongoClient
const mongo = require('mongodb')
const mongoose = require('mongoose')

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

function setupLocationAddresses() {
    app.get('/location/:city', (req, res) => {
        let params = req.params
        let dt = new Date()
        dt =
            dt.getFullYear() +
            '-' +
            dt.getMonth() +
            '-' +
            dt.getDate() +
            ', ' +
            dt.getHours() +
            ':' +
            dt.getMinutes() +
            ':' +
            dt.getSeconds()

        let locationData = getLocationData(locations[params.city].lat, locations[params.city].lng)
        locationData.then((locationData) => {
            console.log(locationData)

            res.send({
                date: dt,
                aqi: locationData.list[0].main.aqi,
                gas: locationData.list[0].components,
            })
        })
    })

    app.get('/location/:lat/:lon', (req, res) => {
        let params = req.params
        let dt = new Date()
        dt =
            dt.getFullYear() +
            '-' +
            dt.getMonth() +
            '-' +
            dt.getDate() +
            ', ' +
            dt.getHours() +
            ':' +
            dt.getMinutes() +
            ':' +
            dt.getSeconds()

        let locationData = getLocationData(params.lat, params.lon)
        locationData.then((locationData) => {
            // console.log(locationData)

            res.send({
                date: dt,
                aqi: locationData.list[0].main.aqi,
                gas: locationData.list[0].components,
            })
        })

    })
}
// this code is being worked on 
const password = process.env.MONGODB_PASSWORD
const mongoDBLink = `mongodb+srv://admin:${password}@ecoventures.dfhg2mh.mongodb.net/`
function doMongo() {
    console.log("doMongo")
    mongo.connect(mongoDBLink, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    
        if (err) {
          console.error('Failed to connect to MongoDB:', err);
          return;
        }
        else {
            console.log("hello");
            return;
        }
    })
}




setupLocationAddresses()
doMongo();

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))


/* extra notes
// To connect with your mongoDB database
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/', {
	dbName: 'yourDB-name',
	useNewUrlParser: true,
	useUnifiedTopology: true
}, err => err ? console.log(err) :
	console.log('Connected to yourDB-name database'));

// Schema for users of app
const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
});
const User = mongoose.model('users', UserSchema);
User.createIndexes();

// For backend and express
const express = require('express');
const app = express();
const cors = require("cors");
console.log("App listen at port 5000");
app.use(express.json());
app.use(cors());
app.get("/", (req, resp) => {

	resp.send("App is Working");
	// You can check backend is working or not by
	// entering http://loacalhost:5000
	
	// If you see App is working means
	// backend working properly
});

app.post("/register", async (req, resp) => {
	try {
		const user = new User(req.body);
		let result = await user.save();
		result = result.toObject();
		if (result) {
			delete result.password;
			resp.send(req.body);
			console.log(result);
		} else {
			console.log("User already register");
		}

	} catch (e) {
		resp.send("Something Went Wrong");
	}
});
app.listen(5000);
*/