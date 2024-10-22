import { mongoose } from "mongoose";

const taskMemberSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_user",
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_task",
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

const TaskMemberModel = mongoose.model("tbl_task_member", taskMemberSchema);
export default TaskMemberModel;
