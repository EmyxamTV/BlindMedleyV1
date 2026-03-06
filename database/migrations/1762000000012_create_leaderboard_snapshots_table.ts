import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leaderboard_snapshots'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('period', 20).notNullable() // global | weekly:YYYY-WW | monthly:YYYY-MM
      table.bigInteger('score').notNullable().defaultTo(0)
      table.integer('rank').nullable()
      table.string('country', 2).nullable()
      table.timestamp('computed_at').notNullable()
      table.unique(['user_id', 'period'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
