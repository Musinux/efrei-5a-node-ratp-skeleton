import postgresStore from '../postgres-store.js'
import Debug from 'debug'
const debug = Debug('ratp')

export default class Agency {
  /** @type {Number} */
  id
  /** @type {String} */
  agency_name
  /** @type {String} */
  agency_url
  /** @type {String} */
  agency_timezone
  /** @type {String} */
  agency_lang
  /** @type {String} */
  agency_phone

  async create (id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone) {
    await postgresStore.client.query({
      text: `
      INSERT INTO agency(id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      values: [id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone]
    })
  }

  /**
   * @param {Agency[]} agencies
   */
  static async bulkCreate (agencies) {
    const values = []
    const keys = []

    let i = 1
    for (const agency of agencies) {
      const vals = [
        agency.id,
        agency.agency_name,
        agency.agency_url,
        agency.agency_timezone,
        agency.agency_lang,
        agency.agency_phone
      ]
      values.push(...vals)
      keys.push('(' + vals.map(_ => `$${i++}`).join(',') + ')')
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO agency(id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone)
      VALUES ${keys.join(',')}
      `,
      values
    })
  }

  static async generateTable () {
    await postgresStore.client.query(`
    CREATE TABLE agency (
      id INTEGER PRIMARY KEY,
      agency_name TEXT,
      agency_url TEXT,
      agency_timezone TEXT,
      agency_lang TEXT,
      agency_phone TEXT
    )
    `)
  }
}
