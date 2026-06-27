import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "profiles";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().defaultTo(this.raw("uuidv7()"));
      table
        .uuid("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.string("username", 50).notNullable().unique();
      table.text("avatar_url").nullable();
      table.string("country", 2).nullable();
      table.text("bio").nullable();
      table.integer("level").notNullable().defaultTo(1);
      table.integer("xp").notNullable().defaultTo(0);
      table.integer("xp_to_next_level").notNullable().defaultTo(100);
      table.integer("total_games").notNullable().defaultTo(0);
      table.integer("total_wins").notNullable().defaultTo(0);
      table.integer("total_correct").notNullable().defaultTo(0);
      table.integer("total_answers").notNullable().defaultTo(0);
      table.float("avg_score").notNullable().defaultTo(0);
      table.integer("avg_response_ms").notNullable().defaultTo(0);
      table.integer("best_streak").notNullable().defaultTo(0);
      table.text("favorite_genres").nullable(); // JSON array as text
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
