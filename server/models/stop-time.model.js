import Debug from 'debug'
import postgresStore from '../postgres-store.js'
const debug = Debug('ratp:stop-time')

export default class StopTime {
  /** @type {Number} */
  trip_id
  /** @type {Date} */
  arrival_time
  /** @type {Date} */
  departure_time
  /** @type {Number} */
  stop_id
  /** @type {Number} */
  stop_sequence
  /** @type {String} */
  stop_headsign
  /** @type {Number} */
  shape_dist_traveled

  async create (tripId, arrivalTime, departureTime, stopId, stopSequence, stopHeadsign, shapeDistTraveled) {
    await postgresStore.client.query({
      text: `
      INSERT INTO stop_time(trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign, shape_dist_traveled)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      values: [tripId, arrivalTime, departureTime, stopId, stopSequence, stopHeadsign, shapeDistTraveled]
    })
  }

  /**
   * @param {StopTime[]} stopTimes
   */
  static async bulkCreate (stopTimes) {
    const values = []
    const keys = []

    let i = 1
    for (const time of stopTimes) {
      const vals = [
        time.trip_id,
        time.arrival_time,
        time.departure_time,
        time.stop_id,
        time.stop_sequence,
        time.stop_headsign,
        time.shape_dist_traveled
      ]
      values.push(...vals)
      keys.push('(' + vals.map(_ => `$${i++}`).join(',') + ')')
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO stop_time(trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign, shape_dist_traveled)
      VALUES ${keys.join(',')}
      `,
      values
    })
  }

  static async generateTable () {
    await postgresStore.client.query(`
    CREATE TABLE stop_time (
      trip_id BIGINT,
      arrival_time TIMESTAMPTZ,
      departure_time TIMESTAMPTZ,
      stop_id INTEGER,
      stop_sequence INTEGER,
      stop_headsign TEXT,
      shape_dist_traveled INTEGER
    )
    `)
  }

  static async addForeignKeys () {
    await postgresStore.client.query(`
      ALTER TABLE stop_time
      ADD CONSTRAINT stop_time_trip_id
      FOREIGN KEY (trip_id)
      REFERENCES trip(id)
    `)
    await postgresStore.client.query(`
      ALTER TABLE stop_time
      ADD CONSTRAINT stop_time_stop_id
      FOREIGN KEY (stop_id)
      REFERENCES stop(id)
    `)
  }
}
