import { mongoose } from "mongoose";

const taskSchema = mongoose.Schema(
  {
    workspace_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_workspace_member",
    },
    task_name: {
      type: String,
      default: "",
    },
    take_description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["in_process", "complete"],
      default: "in_process",
    },
    due_date: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["urgent", "high", "normal", "low"],
      default: "normal",
    },

    attachments: [
      {
        attachment_name: { type: String, default: "" },
        attachment_path: { type: String, default: "" },
      },
    ],

    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const TaskModel = mongoose.model("tbl_task", taskSchema);
export default TaskModel;
