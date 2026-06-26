import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "answers";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("title_correct").notNullable().defaultTo(false);
      table.boolean("artist_correct").notNullable().defaultTo(false);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("title_correct");
      table.dropColumn("artist_correct");
    });
  }
}
