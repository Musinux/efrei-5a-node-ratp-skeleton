import postgresStore from '../postgres-store.js'

export default class CalendarDate {
  /** @type {Number} */
  service_id
  /** @type {Date} */
  date
  /** @type {(0|1|2|3)} */
  exception_type

  async create (service_id, date, exception_type) {
    await postgresStore.client.query({
      text: `
      INSERT INTO calendar_date(service_id, date, exception_type)
      VALUES ($1, $2, $3)
      `,
      values: [service_id, date, exception_type]
    })
  }

  /**
   * @param {CalendarDate[]} calendarDates
   */
  static async bulkCreate (calendarDates) {
    const values = []
    const keys = []

    let i = 1
    for (const date of calendarDates) {
      const vals = [
        date.service_id,
        date.date,
        date.exception_type
      ]
      values.push(...vals)
      keys.push('(' + vals.map(_ => `$${i++}`).join(',') + ')')
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO calendar_date(service_id, date, exception_type)
      VALUES ${keys.join(',')}
      `,
      values
    })
  }

  static async generateTable () {
    await postgresStore.client.query(`
    CREATE TABLE calendar_date (
      service_id INTEGER,
      date TIMESTAMPTZ,
      exception_type SMALLINT,
      PRIMARY KEY(service_id, date)
    )
    `)
  }
}
