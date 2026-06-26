import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "users";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("spotify_id").nullable().unique();
      table.text("spotify_access_token").nullable();
      table.text("spotify_refresh_token").nullable();
      table.timestamp("spotify_token_expires_at").nullable();
      table.string("role", 20).notNullable().defaultTo("player");
      table.string("status", 20).notNullable().defaultTo("active");
      table.text("ban_reason").nullable();
      table.timestamp("ban_expires_at").nullable();
      table.timestamp("last_login_at").nullable();
      table.integer("login_attempts").notNullable().defaultTo(0);
      table.timestamp("locked_until").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("spotify_id");
      table.dropColumn("spotify_access_token");
      table.dropColumn("spotify_refresh_token");
      table.dropColumn("spotify_token_expires_at");
      table.dropColumn("role");
      table.dropColumn("status");
      table.dropColumn("ban_reason");
      table.dropColumn("ban_expires_at");
      table.dropColumn("last_login_at");
      table.dropColumn("login_attempts");
      table.dropColumn("locked_until");
    });
  }
}
