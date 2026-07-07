// ============================================================
// myApp.js — MongoDB and Mongoose Checkpoint
// ============================================================

require("dotenv").config(); // Load MONGO_URI from .env file
const mongoose = require("mongoose");

// ── 1. Connect to MongoDB Atlas ──────────────────────────────
// Store your URI in .env as MONGO_URI (never commit that file)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ── 2. Person Schema & Model ─────────────────────────────────
// Define the shape of a Person document in the database
const personSchema = new mongoose.Schema({
  // name is required — every Person must have one
  name: { type: String, required: true },

  // age is optional
  age: Number,

  // favoriteFoods is an array of strings
  favoriteFoods: [String],
});

// Compile the schema into a Model (maps to the "people" collection)
const Person = mongoose.model("Person", personSchema);

// ── 3. Create and Save a Single Person ──────────────────────
// Instantiate one document and persist it with .save()
const createAndSavePerson = (done) => {
  // Build a new Person instance with the required fields
  const person = new Person({
    name: "John Doe",
    age: 25,
    favoriteFoods: ["pizza", "tacos"],
  });

  // .save() writes the document to MongoDB
  // Node-style callback: first arg is error, second is the saved document
  person.save(function (err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

// ── 4. Create Many Records with Model.create() ───────────────
// Inserts an array of Person objects in a single database call
const createManyPeople = (arrayOfPeople, done) => {
  // Model.create() accepts an array and saves all documents at once
  Person.create(arrayOfPeople, function (err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

// ── 5. Find All People with a Given Name ─────────────────────
// Model.find() returns an array of all matching documents
const findPeopleByName = (personName, done) => {
  // Pass a query object — here we filter by the name field
  Person.find({ name: personName }, function (err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

// ── 6. Find One Person by Favorite Food ──────────────────────
// Model.findOne() returns the first document that matches the query
const findOneByFood = (food, done) => {
  // Search inside the favoriteFoods array for the given food value
  Person.findOne({ favoriteFoods: food }, function (err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

// ── 7. Find a Person by _id ───────────────────────────────────
// Model.findById() is a shorthand for findOne({ _id: id })
const findPersonById = (personId, done) => {
  Person.findById(personId, function (err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

// ── 8. Classic Update: Find → Edit → Save ────────────────────
// Find a person by _id, push "hamburger" into favoriteFoods, then save
const findEditThenSave = (personId, done) => {
  // Step 1 — find the document by its _id
  Person.findById(personId, function (err, person) {
    if (err) return done(err);

    // Step 2 — mutate the in-memory document
    person.favoriteFoods.push("hamburger");

    // Step 3 — persist the change back to MongoDB with .save()
    person.save(function (err, updatedPerson) {
      if (err) return done(err);
      done(null, updatedPerson);
    });
  });
};

// ── 9. New-style Update: findOneAndUpdate() ───────────────────
// Find by name and set age to 20 in one atomic operation
const findAndUpdate = (personName, done) => {
  // { new: true } tells Mongoose to return the updated document,
  // not the original one (which is the default behavior)
  Person.findOneAndUpdate(
    { name: personName },   // filter: find by name
    { age: 20 },            // update: set age to 20
    { new: true },          // options: return the updated doc
    function (err, data) {
      if (err) return done(err);
      done(null, data);
    }
  );
};

// ── 10. Delete One Person by _id ─────────────────────────────
// findByIdAndRemove() finds and deletes in a single database call
const removeById = (personId, done) => {
  Person.findByIdAndRemove(personId, function (err, data) {
    if (err) return done(err);
    // data is the deleted document
    done(null, data);
  });
};

// ── 11. Delete Many People by Name ───────────────────────────
// Model.remove() deletes ALL documents matching the filter
// Note: it does NOT return the deleted documents — only a result summary
const removeManyPeople = (done) => {
  // Remove every Person whose name is "Mary"
  Person.remove({ name: "Mary" }, function (err, data) {
    if (err) return done(err);
    // data = { acknowledged: true, deletedCount: N }
    done(null, data);
  });
};

// ── 12. Chain Query Helpers ───────────────────────────────────
// Find burrito lovers, sort by name, limit to 2, hide age field
const queryChain = (done) => {
  Person.find({ favoriteFoods: "burritos" }) // filter: must include burritos
    .sort({ name: 1 })                        // sort A → Z by name
    .limit(2)                                 // return at most 2 documents
    .select("-age")                           // exclude the age field
    .exec(function (err, data) {              // execute and handle result
      if (err) return done(err);
      done(null, data);
    });
};

// ── Exports (required by freeCodeCamp's test runner) ─────────
exports.PersonModel = Person;
exports.createAndSavePerson = createAndSavePerson;
exports.findPeopleByName = findPeopleByName;
exports.findOneByFood = findOneByFood;
exports.findPersonById = findPersonById;
exports.findEditThenSave = findEditThenSave;
exports.findAndUpdate = findAndUpdate;
exports.createManyPeople = createManyPeople;
exports.removeById = removeById;
exports.removeManyPeople = removeManyPeople;
exports.queryChain = queryChain;
