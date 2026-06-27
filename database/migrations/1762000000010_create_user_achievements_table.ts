import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "user_achievements";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().defaultTo(this.raw("uuidv7()"));
      table
        .uuid("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .uuid("achievement_id")
        .notNullable()
        .references("id")
        .inTable("achievements");
      table.timestamp("unlocked_at").notNullable();
      table.unique(["user_id", "achievement_id"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
