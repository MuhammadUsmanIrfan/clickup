import express from "express";
const router = express.Router();
import RoleController from "../controllers/RoleController.js";
import TokenVerification from "../middleware/TokenVerification.js";

router.post("/addrole", TokenVerification, RoleController.addRole);

router.get("/getroles", TokenVerification, RoleController.getRoles);

router.patch("/updaterole", TokenVerification, RoleController.editRole);

router.delete("/deleterole", TokenVerification, RoleController.deleteRole);

export default router;
