import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "reports";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").notNullable();
      table.integer("reporter_id").unsigned().notNullable().references("id").inTable("users");
      table.integer("reported_id").unsigned().notNullable().references("id").inTable("users");
      table.integer("game_id").unsigned().nullable().references("id").inTable("games");
      table.string("reason", 100).notNullable();
      table.text("details").nullable();
      table.string("status", 20).notNullable().defaultTo("open"); // open | reviewed | dismissed
      table.integer("reviewed_by").unsigned().nullable().references("id").inTable("users");
      table.timestamp("created_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
