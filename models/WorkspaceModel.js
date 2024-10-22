import { mongoose } from "mongoose";

const workspaceSchema = mongoose.Schema(
  {
    workspace_name: {
      type: String,
      required: [true, "Full name is required"],
    },
    workspace_description: {
      type: String,
      required: [true, "last name is required"],
    },
    is_private: {
      type: Boolean,
      default: false,
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

const Workspace = mongoose.model("tbl_workspace", workspaceSchema);
export default Workspace;
