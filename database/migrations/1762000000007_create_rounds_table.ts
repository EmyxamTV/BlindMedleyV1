import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "rounds";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().defaultTo(this.raw("uuidv7()"));
      table
        .uuid("game_id")
        .notNullable()
        .references("id")
        .inTable("games")
        .onDelete("CASCADE");
      table.uuid("track_id").notNullable().references("id").inTable("tracks_cache");
      table.integer("round_number").notNullable();
      table.string("round_token", 64).notNullable().unique(); // token anti-triche
      table.text("distractors").notNullable().defaultTo("[]"); // JSON: IDs des faux choix
      table.timestamp("starts_at").nullable();
      table.timestamp("ends_at").nullable();
      table.timestamp("revealed_at").nullable();
      table.unique(["game_id", "round_number"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
