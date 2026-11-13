import "server-only";
import mongoose from "mongoose";
import { config } from "./config";
import { allModels } from "./models";

const globalDb = globalThis as typeof globalThis & {
  databasePromise?: Promise<typeof mongoose>;
};
export async function database() {
  if (!globalDb.databasePromise) {
    globalDb.databasePromise = (async () => {
      await mongoose.connect(config().MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      // Unique constraints must exist before accepting concurrent signup/onboarding.
      await Promise.all(allModels.map((model) => model.init()));
      return mongoose;
    })().catch((error) => {
      globalDb.databasePromise = undefined;
      throw error;
    });
  }
  return globalDb.databasePromise;
}
