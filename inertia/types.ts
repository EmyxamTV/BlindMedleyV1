import { type Data } from "@generated/data";
import { type JSONDataTypes } from "@adonisjs/core/types/transformers";

export type InertiaProps<T extends Record<string, JSONDataTypes> = {}> = Record<
  string,
  JSONDataTypes
> &
  Partial<Data.SharedProps> &
  T;
