import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "playlist_shares";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").notNullable();
      table
        .integer("playlist_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("playlists")
        .onDelete("CASCADE");
      table
        .integer("user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.boolean("can_edit").notNullable().defaultTo(false);
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").nullable();

      table.unique(["playlist_id", "user_id"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
