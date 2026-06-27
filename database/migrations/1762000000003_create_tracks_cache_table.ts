import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "tracks_cache";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().defaultTo(this.raw("uuidv7()"));
      table.string("spotify_id", 100).notNullable().unique();
      table.string("title", 500).notNullable();
      table.string("artist", 500).notNullable();
      table.string("album", 500).nullable();
      table.text("preview_url").nullable();
      table.text("cover_url").nullable();
      table.integer("duration_ms").nullable();
      table.integer("release_year").nullable();
      table.string("genre", 100).nullable();
      table.integer("popularity").nullable(); // 0-100
      table.boolean("has_preview").notNullable().defaultTo(false);
      table.text("metadata").nullable(); // JSON
      table.timestamp("cached_at").notNullable();
      table.timestamp("expires_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
