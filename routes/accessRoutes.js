import express from "express";
const router = express.Router();
import AccessController from "../controllers/AccessController.js";

router.post("/register", AccessController.userRegistration);
router.post("/login", AccessController.login);
router.post("/validate", AccessController.validate);

export default router;
