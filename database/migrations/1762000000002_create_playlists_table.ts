import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "playlists";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().defaultTo(this.raw("uuidv7()"));
      table.string("spotify_id", 100).nullable().unique();
      table.string("name", 255).notNullable();
      table.text("description").nullable();
      table.text("cover_url").nullable();
      table.string("genre", 100).nullable();
      table.string("decade", 6).nullable(); // "1980s"
      table.integer("difficulty").notNullable().defaultTo(2); // 1-5
      table.integer("track_count").notNullable().defaultTo(0);
      table.boolean("is_active").notNullable().defaultTo(true);
      table.boolean("is_curated").notNullable().defaultTo(false);
      table.uuid("created_by").nullable().references("id").inTable("users");
      table.timestamp("last_synced_at").nullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
