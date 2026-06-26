import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "playlist_tracks";

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
        .integer("track_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("tracks_cache")
        .onDelete("CASCADE");
      table.integer("position").nullable();
      table.unique(["playlist_id", "track_id"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
