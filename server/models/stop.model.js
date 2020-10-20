import postgresStore from '../postgres-store.js'

export default class Stop {
  /** @type {Number} */
  id
  /** @type {Number} */
  stop_code
  /** @type {String} */
  stop_name
  /** @type {String} */
  stop_desc
  /** @type {Number} */
  longitude
  /** @type {Number} */
  latitude
  /** @type {(0|1|2|3|4)} */
  location_type
  /** @type {Number} */
  parent_station

  async create (id, stopCode, stopName, stopDesc, longitude, latitude, locationType, parentStation) {
    await postgresStore.client.query({
      text: `
      INSERT INTO stop(id, stop_code, stop_name, stop_desc, coords, location_type, parent_station)
      VALUES ($1, $2, $3, $4, ST_MakePoint($5, $6), $7, $8)
      `,
      values: [id, stopCode, stopName, stopDesc, longitude, latitude, locationType, parentStation]
    })
  }

  /**
   * @param {Stop[]} Stop
   */
  static async bulkCreate (stops) {
    const values = []
    const keys = []

    let i = 1
    for (const stop of stops) {
      const vals = [
        stop.id,
        stop.stop_code,
        stop.stop_name,
        stop.stop_desc,
        stop.longitude,
        stop.latitude,
        stop.location_type,
        stop.parent_station
      ]
      values.push(...vals)
      keys.push(`($${i++}, $${i++}, $${i++}, $${i++}, ST_MakePoint($${i++}, $${i++}), $${i++}, $${i++})`)
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO stop(id, stop_code, stop_name, stop_desc, coords, location_type, parent_station)
      VALUES ${keys.join(',')}
      `,
      values
    })
  }

  /**
   * @param {String} name
   * @returns {Promise<Stop[]>}
   */
  static async getStops (name) {
    const result = await postgresStore.client.query({
      text: `SELECT
      id,
      stop_code,
      stop_name,
      stop_desc,
      ST_X(coords) AS longitude,
      ST_Y(coords) AS latitude,
      location_type,
      parent_station
      FROM stop
      WHERE stop_name ~* $1
      `,
      values: [`^${name}.*`]
    })
    return result.rows
  }

  /**
   * @param {Stop} s1
   * @param {Stop} s2
   * @async
   * @returns {Promise<Stop[]>}
   */
  static async getStopsBetweenTwoStops (s1, s2) {
    const lonCenter = (s1.longitude + s2.longitude) / 2
    const latCenter = (s1.latitude + s2.latitude) / 2
    const radius = Math.sqrt(((s1.longitude - lonCenter) ** 2) + ((s1.latitude - latCenter) ** 2)) * 1.4
    const result = await postgresStore.client.query({
      text: `SELECT
      id,
      stop_code,
      stop_name,
      stop_desc,
      ST_X(coords) AS longitude,
      ST_Y(coords) AS latitude,
      location_type,
      parent_station
      FROM stop
      WHERE ST_Within(coords, ST_Buffer(ST_MakePoint($1, $2), $3, 'quad_segs=8')) = TRUE
      `,
      values: [lonCenter, latCenter, radius]
    })
    return result.rows
  }

  static async generateTable () {
    await postgresStore.client.query(`
    CREATE TABLE stop (
      id BIGINT PRIMARY KEY,
      stop_code INTEGER,
      stop_name TEXT,
      stop_desc TEXT,
      coords GEOMETRY,
      location_type SMALLINT,
      parent_station BIGINT REFERENCES stop(id)
    )
    `)
  }
}
