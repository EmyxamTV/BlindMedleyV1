import { BaseTransformer } from "@adonisjs/core/transformers";
import type Friendship from "#models/friendship";
import UserTransformer from "#transformers/user_transformer";

export default class FriendshipTransformer extends BaseTransformer<Friendship> {
  toObject() {
    return {
      ...this.pick(this.resource, ["id", "requesterId", "addresseeId", "status", "createdAt"]),
      requester: UserTransformer.transform(this.whenLoaded(this.resource.requester)),
      addressee: UserTransformer.transform(this.whenLoaded(this.resource.addressee)),
    };
  }
}
