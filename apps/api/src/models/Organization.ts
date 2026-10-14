
import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      maxlength: 500
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema
);
