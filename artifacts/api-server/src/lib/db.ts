import mongoose from "mongoose";

/**
 * Connects to MongoDB Atlas using the MONGO_URI environment variable.
 *
 * Mongoose v9 no longer requires useNewUrlParser or useUnifiedTopology —
 * those options were removed and passing them is a no-op (or error in strict mode).
 * We simply call mongoose.connect() with the URI and no extra options.
 */
export async function connectToDatabase(): Promise<void> {
  const uri = process.env["MONGO_URI"];

  if (!uri) {
    throw new Error("MONGO_URI environment variable is required but not set.");
  }

  // Connect to the MongoDB Atlas cluster.
  // Mongoose v9 uses the modern MongoDB driver internally and manages the
  // connection pool automatically — no extra options needed.
  await mongoose.connect(uri);
}
