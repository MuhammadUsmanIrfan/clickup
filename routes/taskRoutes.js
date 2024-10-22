import express from "express";
const router = express.Router();
import TaskController from "../controllers/TaskController.js";
import TokenVerification from "../middleware/TokenVerification.js";
import { storageMultiple } from "../helpers/storage.js";

router.post(
  "/createtask",
  TokenVerification,
  storageMultiple,
  TaskController.createTask
);

router.get(
  "/gettaskmembers",
  TokenVerification,
  TaskController.getTaskMemberWithTasks
);

router.get(
  "/gettasks",
  TokenVerification,
  TaskController.getTaskWithTaskMembers
);

router.get(
  "/getsubtasks",
  TokenVerification,
  TaskController.getWorkSpaceAssociateWithTasks
);

router.post(
  "/gettaskdays",
  TokenVerification,
  TaskController.getNumberOfDays
);

router.post(
  "/sendtaskinvite",
  TokenVerification,
  TaskController.sendTaskInvite
);

router.post(
  "/accepttaskinvite",
  TokenVerification,
  TaskController.acceptTaskInvite
);

router.patch(
  "/updatetask",
  TokenVerification,
  storageMultiple,
  TaskController.updateTask
);


router.delete("/deletetaskmember", TokenVerification, TaskController.deleteTaskMember);

router.delete("/deletetask", TokenVerification, TaskController.deleteTask);

export default router;
