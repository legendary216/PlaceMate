import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    company: { type: String, required: true },
    expertise: { type: String, required: true },
    approved: { type: Boolean, default: false }, // admin approval
    experience:{type:Number , default : 0},
  },
  { timestamps: true }
);

export default mongoose.model("Mentor", mentorSchema);