import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "reports";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().defaultTo(this.raw("uuidv7()"));
      table.uuid("reporter_id").notNullable().references("id").inTable("users");
      table.uuid("reported_id").notNullable().references("id").inTable("users");
      table.uuid("game_id").nullable().references("id").inTable("games");
      table.string("reason", 100).notNullable();
      table.text("details").nullable();
      table.string("status", 20).notNullable().defaultTo("open"); // open | reviewed | dismissed
      table.uuid("reviewed_by").nullable().references("id").inTable("users");
      table.timestamp("created_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
