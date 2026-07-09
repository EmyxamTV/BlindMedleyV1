import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "games";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("source", 20).notNullable().defaultTo("player");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("source");
    });
  }
}
