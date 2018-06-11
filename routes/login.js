
module.exports = function (app) {
  app.post('/login', (req, res) => {
    const password = req.body.password

    if (password === app.RANDOM_PASSWORD) {
      res.cookie('logged', app.RANDOM_PASSWORD)
      console.log(req.connection.remoteAddress, 'logged in')
      res.redirect('/files')
    } else {
      res.end('[Error] Failed to log in')
    }
  })
}
