import { mongoose } from "mongoose";

const roleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a role name"],
    },
    key: {
      type: String,
      required: [true, "Please add a valid role"],
    },
    status: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model("tbl_role", roleSchema);
export default Role;
