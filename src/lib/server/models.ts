import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    emailNormalized: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    authVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true, collection: "users" },
);
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true, collection: "sessions" },
);
const resetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true, collection: "password_reset_tokens" },
);
const weddingSchema = new Schema(
  {
    brideName: { type: String, required: true },
    groomName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    weddingDate: { type: String, required: true },
    timeZone: { type: String, required: true },
    location: { formattedAddress: { type: String, required: true } },
    website: {
      slug: { type: String, required: true, unique: true },
      theme: { type: String, default: "classic" },
      isPublished: { type: Boolean, default: false },
    },
    gallery: {
      tokenHash: { type: String, required: true, select: false },
      isEnabled: { type: Boolean, default: false },
      guestUploadsEnabled: { type: Boolean, default: false },
    },
    livestream: {
      youtubeUrl: { type: String, default: null },
      isEnabled: { type: Boolean, default: false },
    },
    createdByUserId: { type: Schema.Types.ObjectId, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "weddings" },
);
const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, unique: true },
    weddingId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ["ADMIN", "MANAGER"], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "wedding_memberships" },
);
membershipSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ weddingId: 1, role: 1 });
const rateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { collection: "rate_limits" },
);

export const User =
  (models.User as Model<InferSchemaType<typeof userSchema>>) ||
  model("User", userSchema);
export const Session =
  (models.Session as Model<InferSchemaType<typeof sessionSchema>>) ||
  model("Session", sessionSchema);
export const ResetToken =
  (models.ResetToken as Model<InferSchemaType<typeof resetSchema>>) ||
  model("ResetToken", resetSchema);
export const Wedding =
  (models.Wedding as Model<InferSchemaType<typeof weddingSchema>>) ||
  model("Wedding", weddingSchema);
export const Membership =
  (models.Membership as Model<InferSchemaType<typeof membershipSchema>>) ||
  model("Membership", membershipSchema);
export const RateLimit =
  (models.RateLimit as Model<InferSchemaType<typeof rateSchema>>) ||
  model("RateLimit", rateSchema);
export const allModels = [
  User,
  Session,
  ResetToken,
  Wedding,
  Membership,
  RateLimit,
];
