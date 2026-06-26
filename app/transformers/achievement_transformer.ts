import { BaseTransformer } from "@adonisjs/core/transformers";
import type Achievement from "#models/achievement";

export default class AchievementTransformer extends BaseTransformer<Achievement> {
  toObject() {
    return this.pick(this.resource, [
      "id",
      "key",
      "name",
      "description",
      "icon",
      "color",
      "xpReward",
    ]);
  }
}
