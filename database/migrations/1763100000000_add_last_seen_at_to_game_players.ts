import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "game_players";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp("last_seen_at").nullable();
      table.index(["game_id", "is_connected", "last_seen_at"]);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(["game_id", "is_connected", "last_seen_at"]);
      table.dropColumn("last_seen_at");
    });
  }
}
