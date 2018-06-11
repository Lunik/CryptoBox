const Express = require('express')
const https = require('https')
const fs = require('fs')
const morgan = require('morgan')
const Path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')

const config = require('./config.json')

const app = Express()

//app.use(morgan('combined'))
app.use(bodyParser())
app.use(cookieParser())
app.use(fileUpload())

app.RANDOM_PASSWORD = Math.random().toString(16).replace('0.', '')

console.log(`
##########################
##                      ##
##       PASSWORD       ##    ${app.RANDOM_PASSWORD}
##                      ##
##########################
`)

require('./routes/login')(app)
require('./routes/vault')(app)
require('./routes/files')(app)

app.use(Express.static(Path.join(__dirname, '/static')))

let options = {
  hostname: config.server.hostname,
  key: fs.readFileSync(config.server.certs.privatekey),
  cert: fs.readFileSync(config.server.certs.certificate)
}

const server = https.createServer(options, app)

server.listen(config.server.port, (err) => {
  if (err) console.error(err)

  console.log('Server listening on port', config.server.port)
})
