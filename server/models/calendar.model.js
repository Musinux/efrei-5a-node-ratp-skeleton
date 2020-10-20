import postgresStore from '../postgres-store.js'

export default class Calendar {
  /** @type {Number} */
  service_id
  /** @type {(0|1)} */
  monday
  /** @type {(0|1)} */
  tuesday
  /** @type {(0|1)} */
  wednesday
  /** @type {(0|1)} */
  thursday
  /** @type {(0|1)} */
  friday
  /** @type {(0|1)} */
  saturday
  /** @type {(0|1)} */
  sunday
  /** @type {Date} */
  start_date
  /** @type {Date} */
  end_date

  async create (serviceId, monday, tuesday, wednesday, thursday, friday, saturday, sunday, startDate, endDate) {
    await postgresStore.client.query({
      text: `
      INSERT INTO calendar(service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      values: [serviceId, monday, tuesday, wednesday, thursday, friday, saturday, sunday, startDate, endDate]
    })
  }

  /**
   * @param {Calendar[]} calendar
   */
  static async bulkCreate (calendar) {
    const values = []
    const keys = []

    let i = 1
    for (const cal of calendar) {
      const vals = [
        cal.service_id,
        cal.monday,
        cal.tuesday,
        cal.wednesday,
        cal.thursday,
        cal.friday,
        cal.saturday,
        cal.sunday,
        cal.start_date,
        cal.end_date
      ]
      values.push(...vals)
      keys.push('(' + vals.map(_ => `$${i++}`).join(',') + ')')
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO calendar(service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
      VALUES ${keys.join(',')}
      RETURNING *
      `,
      values
    })
  }

  static async generateTable () {
    await postgresStore.client.query(`
    CREATE TABLE calendar (
      service_id INTEGER,
      monday SMALLINT,
      tuesday SMALLINT,
      wednesday SMALLINT,
      thursday SMALLINT,
      friday SMALLINT,
      saturday SMALLINT,
      sunday SMALLINT,
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ
    )
    `)
  }
}
