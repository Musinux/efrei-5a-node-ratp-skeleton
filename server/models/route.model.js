import postgresStore from '../postgres-store.js'

export default class Route {
  /** @type {Number} */
  id
  /** @type {Number} */
  agency_id
  /** @type {String} */
  route_short_name
  /** @type {String} */
  route_long_name
  /** @type {String} */
  route_desc
  /** @type {(0|1|2|3|4|5|6|7} */
  route_type

  async create (id, agencyId, routeShortName, routeLongName, routeDesc, routeType) {
    await postgresStore.client.query({
      text: `
      INSERT INTO route(id, agency_id, route_short_name, route_long_name, route_desc, route_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      values: [id, agencyId, routeShortName, routeLongName, routeDesc, routeType]
    })
  }

  /**
   * @param {Route[]} routes
   */
  static async bulkCreate (routes) {
    const values = []
    const keys = []

    let i = 1
    for (const route of routes) {
      const vals = [
        route.id,
        route.agency_id,
        route.route_short_name,
        route.route_long_name,
        route.route_desc,
        route.route_type
      ]
      values.push(...vals)
      keys.push('(' + vals.map(_ => `$${i++}`).join(',') + ')')
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO route(id, agency_id, route_short_name, route_long_name, route_desc, route_type)
      VALUES ${keys.join(',')}
      `,
      values
    })
  }

  static async generateTable () {
    await postgresStore.client.query(`
    CREATE TABLE route (
      id INTEGER PRIMARY KEY,
      agency_id INTEGER REFERENCES agency(id),
      route_short_name TEXT,
      route_long_name TEXT,
      route_desc TEXT,
      route_type SMALLINT
    )
    `)
  }
}
