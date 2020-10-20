let existingConf
try {
  existingConf = require('./local.server.config.js')
} catch (err) {
  existingConf = {}
}

function e (param) {
  return process.env[param] || existingConf[param] || ''
}
export default {
  SESSION_SECRET: e('SESSION_SECRET'),
  postgres: {
    user: e('POSTGRES_USER'),
    host: e('POSTGRES_HOST'),
    database: e('POSTGRES_DB'),
    password: e('POSTGRES_PASSWORD')
  }
}
