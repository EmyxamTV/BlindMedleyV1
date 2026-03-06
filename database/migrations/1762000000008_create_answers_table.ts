import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'answers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('round_id').unsigned().notNullable().references('id').inTable('rounds').onDelete('CASCADE')
      table.integer('game_player_id').unsigned().notNullable().references('id').inTable('game_players').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users')
      table.text('answer_text').nullable() // réponse libre
      table.integer('answer_track_id').unsigned().nullable().references('id').inTable('tracks_cache') // choix QCM
      table.boolean('is_correct').notNullable().defaultTo(false)
      table.integer('score_earned').notNullable().defaultTo(0)
      table.integer('response_ms').notNullable() // temps de réponse côté serveur
      table.text('suspicious_flags').nullable() // JSON
      table.timestamp('submitted_at').notNullable()
      table.unique(['round_id', 'game_player_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
