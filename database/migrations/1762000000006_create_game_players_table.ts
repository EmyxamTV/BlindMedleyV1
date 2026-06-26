import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "game_players";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").notNullable();
      table
        .integer("game_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("games")
        .onDelete("CASCADE");
      table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
      table.integer("score").notNullable().defaultTo(0);
      table.integer("correct").notNullable().defaultTo(0);
      table.integer("incorrect").notNullable().defaultTo(0);
      table.integer("streak").notNullable().defaultTo(0);
      table.integer("best_streak").notNullable().defaultTo(0);
      table.integer("rank").nullable();
      table.integer("xp_earned").notNullable().defaultTo(0);
      table.boolean("is_connected").notNullable().defaultTo(true);
      table.timestamp("joined_at").notNullable();
      table.timestamp("left_at").nullable();
      table.unique(["game_id", "user_id"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
