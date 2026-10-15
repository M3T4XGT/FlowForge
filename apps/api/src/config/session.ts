
import session from "express-session";
import MongoStore from "connect-mongo";

export function configureSession() {
  const secret = process.env.SESSION_SECRET;
  const mongoUrl = process.env.MONGODB_URI;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters"
    );
  }

  if (!mongoUrl) {
    throw new Error("MONGODB_URI is missing");
  }

  const isProduction =
    process.env.NODE_ENV === "production";

  return session({
    name: "flowforge.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,

    store: MongoStore.create({
      mongoUrl,
      collectionName: "sessions",
      ttl: 24 * 60 * 60,
    }),

    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}
