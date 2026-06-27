import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "playlist_shares";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().defaultTo(this.raw("uuidv7()"));
      table
        .uuid("playlist_id")
        .notNullable()
        .references("id")
        .inTable("playlists")
        .onDelete("CASCADE");
      table
        .uuid("user_id")
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
