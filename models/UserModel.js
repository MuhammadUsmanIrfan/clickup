import { mongoose } from "mongoose";

const userSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "Full name is required"],
    },
    last_name: {
      type: String,
      required: [true, "last name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    status: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    plan: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_role",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("tbl_user", userSchema);
export default User;
