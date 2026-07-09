import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "games";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp("auto_starts_at").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("auto_starts_at");
    });
  }
}
