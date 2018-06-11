const Path = require('path')
const { spawn } = require('child_process')

module.exports = function (app) {
  app.post('/vault/unlock', (req, res) => {
    const password = req.body.password

    const unlock = spawn('sh', [Path.join(__dirname, '/scripts/unlock.sh'), password])

    unlock.on('close', (code) => {
      if (code === 0) {
        console.log("Vault unlocked by", req.connection.remoteAddress)
        res.redirect('/')
      } else {
        res.end('[Error] Failed unlocking the vault')
      }
    })
  })

  app.post('/vault/lock', (req, res) => {
    const lock = spawn('sh', [Path.join(__dirname, '/scripts/lock.sh')])

    lock.on('close', (code) => {
      if (code === 0) {
        console.log("Vault locked by", req.connection.remoteAddress)
        res.redirect('/')
      } else {
        res.end('[Error] Failed locking the vault')
      }
    })
  })
}
