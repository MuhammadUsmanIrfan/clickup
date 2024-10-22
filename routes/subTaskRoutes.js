import express from "express";
const router = express.Router();
import SubTaskController from "../controllers/SubTaskController.js";
import TokenVerification from "../middleware/TokenVerification.js";
import { storageMultiple } from "../helpers/storage.js";

router.post(
  "/createsubtask",
  TokenVerification,
  storageMultiple,
  SubTaskController.createSubTask
);

router.get(
  "/getallsubtaskmembers",
  TokenVerification,
  SubTaskController.getSubTaskMemberWithSubTasks
);

router.get(
  "/getallsubtasks",
  TokenVerification,
  SubTaskController.getSubTaskWithSubTaskMembers
);

router.post(
  "/getsubtaskdays",
  TokenVerification,
  SubTaskController.getNumberOfDays
);

router.post(
  "/subtaskcontroller",
  TokenVerification,
  SubTaskController.sendSubTaskInvite
);

router.post(
  "/acceptsubtaskinvite",
  TokenVerification,
  SubTaskController.acceptSubTaskInvite
);

router.patch(
  "/updatesubtask",
  TokenVerification,
  storageMultiple,
  SubTaskController.updateSubTask
);


router.delete(
  "/deletesubtaskmember",
  TokenVerification,
  SubTaskController.deleteSubTaskMember
);

router.delete(
  "/deletesubtask",
  TokenVerification,
  SubTaskController.deleteSubTask
);

export default router;
