import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_achievements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('achievement_id').unsigned().notNullable().references('id').inTable('achievements')
      table.timestamp('unlocked_at').notNullable()
      table.unique(['user_id', 'achievement_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
