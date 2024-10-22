import express from "express";
const router = express.Router();
import WorkspaceController from "../controllers/WorkspaceController.js";
import TokenVerification from "../middleware/TokenVerification.js";

router.post(
  "/createworkspace",
  TokenVerification,
  WorkspaceController.createWorkspace
);

router.get(
  "/getworkspacemembers",
  TokenVerification,
  WorkspaceController.getWorkSpaceMemberWithWorkspaces
);

router.get(
  "/getworkspace",
  TokenVerification,
  WorkspaceController.getWorkspaceWithWorkspaceMembers
);

router.get(
  "/getworkspaceassociatetasks",
  TokenVerification,
  WorkspaceController.getWorkSpaceAssociateTasks
);

router.post(
  "/sendworkspaceinvite",
  TokenVerification,
  WorkspaceController.sendInvite
);

router.post(
  "/acceptinvite",
  TokenVerification,
  WorkspaceController.acceptInvite
);

router.patch(
  "/updateworkspace",
  TokenVerification,
  WorkspaceController.updateWorkspace
);

router.delete(
  "/deleteworkspacemember",
  TokenVerification,
  WorkspaceController.deleteWorkspaceMember
);

router.delete(
  "/deleteworkspace",
  TokenVerification,
  WorkspaceController.deleteWorkspace
);

export default router;
