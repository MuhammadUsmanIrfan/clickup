import { mongoose } from "mongoose";

const subTaskMemberSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_user",
    },
    sub_task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_sub_task",
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

const SubTaskMemberModel = mongoose.model(
  "tbl_sub_task_member",
  subTaskMemberSchema
);
export default SubTaskMemberModel;
