import { mongoose } from "mongoose";

const workspaceMemberSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_user",
    },
    workspace_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_workspace",
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

const WorkspaceMember = mongoose.model(
  "tbl_workspace_member",
  workspaceMemberSchema
);
export default WorkspaceMember;
