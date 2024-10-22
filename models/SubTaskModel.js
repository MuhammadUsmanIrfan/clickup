import { mongoose } from "mongoose";

const subTaskSchema = mongoose.Schema(
  {
    task_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_task_member",
    },
    sub_task_name: {
      type: String,
      default: "",
    },
    sub_task_description: {
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

const SubTaskModel = mongoose.model("tbl_sub_task", subTaskSchema);
export default SubTaskModel;
