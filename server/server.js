import express from 'express'
import session from 'express-session'
import logger from 'morgan'
import apiRouter from './routes/index.js'
import config from './server.config.js'
import postgresStore from './postgres-store.js'

postgresStore.init(config.postgres)

const app = express()

app.use(logger('dev'))
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api', apiRouter)

export default app
