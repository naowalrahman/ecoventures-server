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
    return `${dt.getFullYear()}-${dt.getMonth()+1}-${dt.getDate()}, ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`
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

function setupLocationAddresses() {
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

}

setupLocationAddresses()
app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
