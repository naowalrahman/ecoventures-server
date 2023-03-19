const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
const port = 3001

app.use(cors())

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const API_KEY = 'ab2695956bc5adc46b7e6f54f47a9d33'
const locations = { NY: [40.7128, 74.006] }

function getLocationData(lon, lat) {
    let locationData
    fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lon=${lon}&lat=${lat}&appid=${API_KEY}`)
        .then((response) => response.json())
        .then((json) => (locationData = json))

    return locationData
}

function setupLocationAddresses() {
    app.get('/location/(:lon)(-(:lat))?', (req, res) => {
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

        let locationData
        if (params['lat'] == undefined) {
            locationData = getLocationData(locations[params['lon']][0], locations[params['lon']][1])
        } else {
            locationData = getLocationData((params['lon'], params['lat']))
        }

        console.log(locationData)

        res.send({
            date: dt,
            aqi: locationData.list[0].main.aqi,
            gas: locationData.list[0].components,
        })
    })
}

setupLocationAddresses()
// app.get('/details', (req, res) => {
//     date = new Date()
//     res.send({
//         data:
//             date.getFullYear() +
//             '-' +
//             date.getMonth() +
//             '-' +
//             date.getDate() +
//             ', ' +
//             date.getHours() +
//             ':' +
//             date.getMinutes() +
//             ':' +
//             date.getSeconds(),
//     })
// })

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
