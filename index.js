import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import bodyParser from "body-parser";
import { errorHandler } from "./middleware/errorMiddleware.js";
import accessroutes from "./routes/accessRoutes.js";
import rolesRoutes from "./routes/rolesRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import subTaskRoutes from "./routes/subTaskRoutes.js";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({ silent: process.env.NODE_ENV === "production" });

const port = process.env.PORT || 5000;
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const corsOpts = {
  origin: "*",
};

app.use(cors(corsOpts));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: false, limit: "25mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json());

app.use("/", accessroutes);
app.use("/users", userRoutes);
app.use("/roles", rolesRoutes);
app.use("/workspace", workspaceRoutes);
app.use("/task", taskRoutes);
app.use("/subtask", subTaskRoutes);

app.use(errorHandler);
app.listen(port, () => console.log(`Server started on port ${port}`));
