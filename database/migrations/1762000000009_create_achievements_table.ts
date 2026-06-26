import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "achievements";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").notNullable();
      table.string("key", 100).notNullable().unique();
      table.string("name", 255).notNullable();
      table.text("description").nullable();
      table.string("icon", 10).nullable(); // emoji ou code
      table.string("color", 20).nullable();
      table.integer("xp_reward").notNullable().defaultTo(0);
      table.text("condition").notNullable(); // JSON: { type, threshold }
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
