const Express = require('express')
const serveIndex = require('serve-index')
const Path = require('path')

const config = require('../config.json')

module.exports = function (app) {
  app.use('/files', checkLogged, serveIndex(config.files.mountpoint, {
    icons: true,
    hidden: true
  }))
  app.use('/files', checkLogged, Express.static(config.files.mountpoint))

  function checkLogged (req, res, next) {
    if (req.cookies.logged !== app.RANDOM_PASSWORD) {
      res.clearCookie('logged')
      return res.redirect('/')
    }

    next()
  }

  app.post('/upload', (req, res) => {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.')
    }

    req.files.file.mv(Path.join(config.files.mountpoint, req.files.file.name), function (err) {
      if (err) {
        return res.status(500).send(err)
      }

      console.log(req.connection.remoteAddress, 'uploaded', req.files.file.name)
      res.send(`
        <p>File uploaded!</p>
        <p><a href="/files">Go to files</a></p>
      `)
    })
  })
}
