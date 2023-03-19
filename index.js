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

setupLocationAddresses()

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
