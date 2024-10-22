import express from "express";
const router = express.Router();
import TokenVerification from "../middleware/TokenVerification.js";
import UserController from "../controllers/UserController.js";

// Get all users
router.post(
  "/superadmin/getallusers",
  TokenVerification,
  UserController.superAdminGetAllUsers
);

// Update User details
router.patch(
  "/updateuserdetails",
  TokenVerification,
  UserController.updateUserDetails
);

// change user user role
router.patch(
  "/superadmin/changerole",
  TokenVerification,
  UserController.superAdminChangeRole
);

router.patch(
  "/superadmin/changestatus",
  TokenVerification,
  UserController.superAdminChangeStatus
);

router.patch(
  "/superadmin/deleteuser",
  TokenVerification,
  UserController.superAdminDeleteUser
);

export default router;
