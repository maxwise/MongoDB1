import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import Person from "../models/Person";

/**
 * Maps a caught error to the appropriate HTTP status code.
 *
 *  - 400 Bad Request  → Mongoose validation failures, invalid ObjectId casts,
 *                       or malformed input that the client must fix before retrying.
 *  - 500 Internal     → Unexpected server/DB errors the client cannot resolve.
 */
function errorStatus(err: unknown): number {
  if (err instanceof mongoose.Error.ValidationError) return 400;
  if (err instanceof mongoose.Error.CastError) return 400;
  return 500;
}

const personRouter = Router();

/* ─────────────────────────────────────────────────────────────
   POST /api/people
   Create and Save a Record of a Model
   Instantiates one Person document and persists it via .save()
   Node-style callback convention is emulated via async/await
   (Mongoose v9 removed all callback overloads; use promises)
───────────────────────────────────────────────────────────── */
personRouter.post("/people", async (req: Request, res: Response) => {
  try {
    // Build a new Person document from the request body
    const person = new Person({
      name: req.body.name,
      age: req.body.age,
      favoriteFoods: req.body.favoriteFoods,
    });

    // document.save() persists the document to the MongoDB collection
    const data = await person.save();

    res.status(201).json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/people/many
   Create Many Records with model.create()
   Accepts an array of people objects and inserts them all at once
───────────────────────────────────────────────────────────── */
personRouter.post("/people/many", async (req: Request, res: Response) => {
  try {
    // arrayOfPeople is expected to be an array in the request body
    const arrayOfPeople = req.body;

    // Model.create() takes an array and saves every document in one call
    const data = await Person.create(arrayOfPeople);

    res.status(201).json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/people?name=<name>
   Use model.find() to Search Your Database
   Returns ALL people whose name matches the query param
───────────────────────────────────────────────────────────── */
personRouter.get("/people", async (req: Request, res: Response) => {
  try {
    const name = req.query.name as string;

    // Find all documents where the name field equals the provided name
    const data = await Person.find({ name });

    res.json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/people/likes/burritos
   Chain Search Query Helpers to Narrow Search Results
   Finds people who like burritos, sorted by name,
   limited to 2 results, with age hidden from the output.
   NOTE: this route must be declared BEFORE /people/:personId
   so Express does not mistake "likes" for a personId segment.
───────────────────────────────────────────────────────────── */
personRouter.get("/people/likes/burritos", async (req: Request, res: Response) => {
  try {
    const data = await Person
      .find({ favoriteFoods: "burritos" }) // filter: must include burritos
      .sort({ name: 1 })                   // sort alphabetically by name (asc)
      .limit(2)                            // return at most 2 documents
      .select("-age")                      // hide the age field from results
      .exec();                             // execute the query and return a promise

    res.json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/people/food/:food
   Use model.findOne() — Return a Single Matching Document
   Finds the first person who has :food in their favoriteFoods
───────────────────────────────────────────────────────────── */
personRouter.get("/people/food/:food", async (req: Request, res: Response): Promise<void> => {
  try {
    const food = req.params.food;

    // findOne returns only the first matching document (or null)
    const data = await Person.findOne({ favoriteFoods: food });

    if (!data) {
      res.status(404).json({ message: `No person found who likes ${food}` });
      return;
    }
    res.json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/people/name/mary
   Delete Many Documents with model.deleteMany()
   Removes ALL documents where name === "Mary"
   NOTE: Model.remove() was removed in Mongoose v8+; use deleteMany()
   deleteMany() returns an outcome object { acknowledged, deletedCount }
   rather than the deleted documents themselves.
   NOTE: declared before /:personId to avoid route-param collision.
───────────────────────────────────────────────────────────── */
personRouter.delete("/people/name/mary", async (req: Request, res: Response) => {
  try {
    // deleteMany removes all documents matching the filter
    // It does NOT return the deleted documents — only a result summary
    const data = await Person.deleteMany({ name: "Mary" });

    // data is { acknowledged: true, deletedCount: N }
    res.json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/people/:personId
   Use model.findById() to Search Your Database By _id
───────────────────────────────────────────────────────────── */
personRouter.get("/people/:personId", async (req: Request, res: Response): Promise<void> => {
  try {
    const personId = req.params.personId;

    // findById is a shorthand for findOne({ _id: personId })
    const data = await Person.findById(personId);

    if (!data) {
      res.status(404).json({ message: "Person not found" });
      return;
    }
    res.json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/people/:personId/hamburger
   Perform Classic Updates — Find, Edit, then Save
   Finds a person by _id, pushes "hamburger" into favoriteFoods,
   then calls .save() to persist the change
───────────────────────────────────────────────────────────── */
personRouter.put("/people/:personId/hamburger", async (req: Request, res: Response): Promise<void> => {
  try {
    const personId = req.params.personId;

    // Step 1: find the document by id
    const person = await Person.findById(personId);

    if (!person) {
      res.status(404).json({ message: "Person not found" });
      return;
    }

    // Step 2: mutate the in-memory document — push "hamburger" onto the array
    person.favoriteFoods.push("hamburger");

    // Step 3: save the updated document back to MongoDB
    const updatedData = await person.save();

    res.json(updatedData);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/people/name/:personName/age
   Perform New Updates Using model.findOneAndUpdate()
   Finds a person by name and sets their age to 20
   { new: true } ensures the updated document is returned
───────────────────────────────────────────────────────────── */
personRouter.put("/people/name/:personName/age", async (req: Request, res: Response): Promise<void> => {
  try {
    const personName = req.params.personName;

    // findOneAndUpdate(filter, update, options)
    // { new: true } → return the document AFTER the update, not before
    const data = await Person.findOneAndUpdate(
      { name: personName }, // filter: match by name
      { age: 20 },          // update: set age to 20
      { new: true },        // options: return updated doc
    );

    if (!data) {
      res.status(404).json({ message: "Person not found" });
      return;
    }
    res.json(data);
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/people/:personId
   Delete One Document Using model.findByIdAndDelete()
   Removes a single Person identified by their _id.
   NOTE: findByIdAndRemove() was removed in Mongoose v8+;
   use findByIdAndDelete() which is functionally identical.
───────────────────────────────────────────────────────────── */
personRouter.delete("/people/:personId", async (req: Request, res: Response): Promise<void> => {
  try {
    const personId = req.params.personId;

    // findByIdAndDelete locates and deletes the document in one operation
    const data = await Person.findByIdAndDelete(personId);

    if (!data) {
      res.status(404).json({ message: "Person not found" });
      return;
    }
    // Return the deleted document as confirmation
    res.json({ message: "Deleted successfully", data });
  } catch (err: unknown) {
    res.status(errorStatus(err)).json({ error: (err as Error).message });
  }
});

export default personRouter;
