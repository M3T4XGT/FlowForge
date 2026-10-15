
import mongoose, { Schema } from "mongoose";

export type OrganizationRole =
  | "owner"
  | "admin"
  | "manager"
  | "employee";

export interface IMembership {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "employee"],
      default: "employee",
      required: true,
    },
  },
  { timestamps: true }
);

membershipSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true }
);

export const Membership = mongoose.model<IMembership>(
  "Membership",
  membershipSchema
);
