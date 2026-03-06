import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'games'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('code', 8).nullable().unique() // lobby privé
      table.string('mode', 20).notNullable() // solo | public | private | matchmaking
      table.string('status', 20).notNullable().defaultTo('waiting')
      // waiting | starting | active | finished | cancelled
      table.integer('playlist_id').unsigned().nullable().references('id').inTable('playlists')
      table.string('genre_filter', 100).nullable()
      table.string('decade_filter', 6).nullable()
      table.integer('difficulty').notNullable().defaultTo(2)
      table.integer('max_players').notNullable().defaultTo(8)
      table.integer('round_count').notNullable().defaultTo(10)
      table.integer('round_duration_ms').notNullable().defaultTo(30000)
      table.integer('current_round').notNullable().defaultTo(0)
      table.integer('host_id').unsigned().nullable().references('id').inTable('users')
      table.integer('winner_id').unsigned().nullable().references('id').inTable('users')
      table.timestamp('started_at').nullable()
      table.timestamp('finished_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
