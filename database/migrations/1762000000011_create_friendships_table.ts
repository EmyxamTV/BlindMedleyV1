import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "friendships";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").notNullable();
      table
        .integer("requester_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("addressee_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.string("status", 20).notNullable().defaultTo("pending"); // pending | accepted | blocked
      table.timestamp("created_at").notNullable();
      table.unique(["requester_id", "addressee_id"]);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
