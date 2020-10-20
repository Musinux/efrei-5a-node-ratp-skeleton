import postgresStore from '../postgres-store.js'

export default class Transfer {
  /** @type {Number} */
  from_stop_id
  /** @type {Number} */
  to_stop_id
  /** @type {(0|1|2|3)} */
  transfer_type
  /** @type {Number} */
  min_transfer_time

  async create (fromStopId, toStopId, transferType, minTransferTime) {
    await postgresStore.client.query({
      text: `
      INSERT INTO transfer(from_stop_id, to_stop_id, transfer_type, min_transfer_time)
      VALUES ($1, $2, $3, $4)
      `,
      values: [fromStopId, toStopId, transferType, minTransferTime]
    })
  }

  /**
   * @param {Transfer[]} transfers
   */
  static async bulkCreate (transfers) {
    const values = []
    const keys = []

    let i = 1
    for (const transfer of transfers) {
      const vals = [
        transfer.from_stop_id,
        transfer.to_stop_id,
        transfer.transfer_type,
        transfer.min_transfer_time
      ]
      values.push(...vals)
      keys.push('(' + vals.map(_ => `$${i++}`).join(',') + ')')
    }

    await postgresStore.client.query({
      text: `
      INSERT INTO transfer(from_stop_id, to_stop_id, transfer_type, min_transfer_time)
      VALUES ${keys.join(',')}
      `,
      values
    })
  }

  static async generateTable () {
    // we don't use FOREIGN KEYS here because
    // some transfer refer to out-of-bounds stops (not in the ratp given set)
    await postgresStore.client.query(`
    CREATE TABLE transfer (
      from_stop_id BIGINT,
      to_stop_id BIGINT,
      transfer_type SMALLINT,
      min_transfer_time SMALLINT
    )
    `)
  }
}
