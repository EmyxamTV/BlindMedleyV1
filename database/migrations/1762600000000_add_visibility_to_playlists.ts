import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "playlists";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("visibility", 20).notNullable().defaultTo("public");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("visibility");
    });
  }
}
