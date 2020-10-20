import postgresStore from '../postgres-store.js'
import Debug from 'debug'
const debug = Debug('ratp')

export default class Trip {
  /** @type {Number} */
  id
  /** @type {Number} */
  route_id
  /** @type {Number} */
  service_id
  /** @type {String} */
  trip_headsign
  /** @type {String} */
  trip_short_name
  /** @type {(0|1)} */
  direction_id
  /** @type {Number} */
  shape_id

  async create (id, routeId, serviceId, tripHeadsign, tripShortName, directionId, shapeId) {
    await postgresStore.client.query({
      text: `
      INSERT INTO trip(id, route_id, service_id, trip_headsign, trip_short_name, direction_id, shape_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      values: [id, routeId, serviceId, tripHeadsign, tripShortName, directionId, shapeId]
    })
  }

  /**
   * @param {Trip[]} Trip
   */
  static async bulkCreate (trips) {
    const values = []
    const keys = []

    let i = 1
    for (const trip of trips) {
      const vals = [
        trip.id,
        trip.route_id,
        trip.service_id,
        trip.trip_headsign,
        trip.trip_short_name,
        trip.direction_id,
        trip.shape_id
      ]
      values.push(...vals)
      keys.push('(' + vals.map(_ => `$${i++}`).join(',') + ')')
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO trip(id, route_id, service_id, trip_headsign, trip_short_name, direction_id, shape_id)
      VALUES ${keys.join(',')}
      `,
      values
    })
  }

  static async generateTable () {
    await postgresStore.client.query(`
    CREATE TABLE trip (
      id BIGINT PRIMARY KEY,
      route_id INTEGER REFERENCES route(id),
      service_id INTEGER,
      trip_headsign TEXT,
      trip_short_name TEXT,
      direction_id SMALLINT,
      shape_id SMALLINT
    )
    `)
  }
}
