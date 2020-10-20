import Debug from 'debug'
import moment from 'moment'
import path from 'path'
import yargs from 'yargs'
import postgresStore from './postgres-store.js'
import config from './server.config.js'

import Agency from './models/agency.model.js'
import Calendar from './models/calendar.model.js'
import CalendarDate from './models/calendar-date.model.js'
import Route from './models/route.model.js'
import Stop from './models/stop.model.js'
import StopTime from './models/stop-time.model.js'
import Transfer from './models/transfer.model.js'
import Trip from './models/trip.model.js'

import importCSV from './tools/import-csv.js'
import askUser from './tools/ask-user.js'
const debug = Debug('ratp')


const argv = yargs(process.argv)
  .usage('Usage: $0 [path]')
  .alias('p', 'path')
  .demandOption('p')
  .describe('path', 'path of the csv files')
  .argv

const csvPath = argv.p

async function dropEverything () {
  const result = await postgresStore.client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
  )

  for (const row of result.rows) {
    if (row.tablename !== 'spatial_ref_sys') {
      await postgresStore.client.query(`DROP TABLE IF EXISTS "${row.tablename}" cascade`)
    }
  }
}
const files = [
  ['agency.txt', agenciesHandler],
  ['calendar.txt', calendarHandler],
  ['calendar_dates.txt', calendarDatesHandler],
  ['routes.txt', routesHandler],
  ['trips.txt', tripsHandler, 9000],
  ['stops.txt', stopsHandler, 8000],
  ['transfers.txt', transfersHandler],
  ['stop_times.txt', stopTimesHandler, 9000]
]

async function run () {
  const answer = await askUser('Are you sure you want to erase everything (N/y)')
  if (!['Y', 'y', 'yes'].includes(answer)) {
    console.log('exiting.')
    process.exit(0)
  }
  const dir = path.join(csvPath)

  await postgresStore.init(config.postgres)

  await dropEverything()
  const models = [
    Agency,
    Calendar,
    CalendarDate,
    Route,
    Trip,
    Stop,
    Transfer,
    StopTime
  ]

  for (const model of models) {
    await model.generateTable()
  }

  for (const [file, handler, batchSize = 10000] of files) {
    await importCSV(path.join(dir, file), handler, batchSize)
  }

  await StopTime.addForeignKeys()

  debug('done.')
  postgresStore.close()
}

function intOrUndef (v) {
  return v ? BigInt(v) : undefined
}

function orUndef (v) {
  return v || undefined
}

async function agenciesHandler (array, counter) {
  const agencies = array.map(_ => ({
    id: parseInt(_.agency_id),
    agency_name: orUndef(_.agency_name),
    agency_url: orUndef(_.agency_url),
    agency_timezone: orUndef(_.agency_timezone),
    agency_lang: orUndef(_.agency_lang),
    agency_phone: orUndef(_.agency_phone)
  }))

  debug('agencies', counter, agencies.length)
  return Agency.bulkCreate(agencies)
}

function calendarHandler (array, counter) {
  const calendar = array.map(_ => ({
    service_id: parseInt(_.service_id),
    monday: parseInt(_.monday),
    tuesday: parseInt(_.tuesday),
    wednesday: parseInt(_.wednesday),
    thursday: parseInt(_.thursday),
    friday: parseInt(_.friday),
    saturday: parseInt(_.saturday),
    sunday: parseInt(_.sunday),
    start_date: moment.utc(_.start_date).toDate(),
    end_date: moment.utc(_.end_date).toDate()
  }))

  debug('calendar', counter, calendar.length)
  return Calendar.bulkCreate(calendar)
}

function calendarDatesHandler (array, counter) {
  const calendar_dates = array.map(_ => ({
    service_id: parseInt(_.service_id),
    date: moment.utc(_.date).toDate(),
    exception_type: parseInt(_.exception_type)
  }))

  debug('calendar_dates', counter, calendar_dates.length)
  return CalendarDate.bulkCreate(calendar_dates)
}

function routesHandler (array, counter) {
  const routes = array.map(_ => ({
    id: parseInt(_.route_id),
    agency_id: parseInt(_.agency_id),
    route_short_name: orUndef(_.route_short_name),
    route_long_name: orUndef(_.route_long_name),
    route_desc: orUndef(_.route_desc),
    route_type: parseInt(_.route_type)
  }))

  debug('routes', counter, routes.length)
  return Route.bulkCreate(routes)
}

function tripsHandler (array, counter) {
  const trips = array.map(_ => ({
    id: BigInt(_.trip_id),
    route_id: parseInt(_.route_id),
    service_id: parseInt(_.service_id),
    trip_headsign: orUndef(_.trip_headsign),
    trip_short_name: orUndef(_.trip_short_name),
    direction_id: parseInt(_.direction_id),
    shape_id: intOrUndef(_.shape_id)
  }))

  debug('trips', counter, trips.length)
  return Trip.bulkCreate(trips)
}

async function stopsHandler (array, counter) {
  const stops = array.map(_ => ({
    id: BigInt(_.stop_id),
    stop_code: orUndef(_.stop_code),
    stop_name: orUndef(_.stop_name),
    stop_desc: orUndef(_.stop_desc),
    longitude: parseFloat(_.stop_lon),
    latitude: parseFloat(_.stop_lat),
    location_type: parseInt(_.location_type),
    parent_station: intOrUndef(_.parent_station)
  }))

  debug('stops', counter, stops.length)
  return Stop.bulkCreate(stops)
}

function toValidDate (time) {
  if (parseInt(time.slice(0, 2)) >= 24) {
    const hour = parseInt(time.slice(0, 2)) - 24
    const arrival_time = `${hour < 10 ? `0${hour}` : hour}:${time.slice(3)}`
    return moment.utc(`1970-01-02 ${arrival_time}`).toDate()
  } else {
    return moment.utc(`1970-01-01 ${time}`).toDate()
  }
}

let totalCount = 0
function stopTimesHandler (array, counter) {
  const stoptimes = array.map(_ => ({
    trip_id: BigInt(_.trip_id),
    arrival_time: toValidDate(_.arrival_time),
    departure_time: toValidDate(_.departure_time),
    stop_id: BigInt(_.stop_id),
    stop_sequence: intOrUndef(_.stop_sequence),
    stop_headsign: orUndef(_.stop_headsign),
    shape_dist_traveled: orUndef(_.shape_dist_traveled)
  }))

  totalCount += array.length
  debug('stoptimes', counter, totalCount, stoptimes.length)
  return StopTime.bulkCreate(stoptimes)
}

function transfersHandler (array, counter) {
  const transfers = array.map(_ => ({
    from_stop_id: BigInt(_.from_stop_id),
    to_stop_id: BigInt(_.to_stop_id),
    transfer_type: parseInt(_.transfer_type),
    min_transfer_time: parseInt(_.min_transfer_time)
  }))

  debug('transfers', counter, transfers.length)
  return Transfer.bulkCreate(transfers)
}

run()
