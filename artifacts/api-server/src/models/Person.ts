import mongoose, { Schema, Document } from "mongoose";

/**
 * Interface representing a Person document in MongoDB.
 * Extends mongoose Document to include all Mongoose document methods.
 */
export interface IPerson extends Document {
  name: string;
  age?: number;
  favoriteFoods: string[];
}

/**
 * Mongoose Schema for the Person model.
 *
 * Fields:
 *  - name: required string
 *  - age: optional number
 *  - favoriteFoods: array of strings
 */
const personSchema = new Schema<IPerson>({
  // name is required — a Person must always have a name
  name: { type: String, required: true },

  // age is optional
  age: { type: Number },

  // favoriteFoods is an array of strings, defaults to an empty array
  favoriteFoods: { type: [String], default: [] },
});

/**
 * The Person model compiled from the schema.
 * Used to interact with the "people" collection in MongoDB.
 */
const Person = mongoose.model<IPerson>("Person", personSchema);

export default Person;
