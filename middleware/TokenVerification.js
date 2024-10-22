import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import UserModel from "../models/UserModel.js";
import RoleModel from "../models/RoleModel.js";

const TokenVerification = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const bearerToken = authHeader.split(" ")[1];
      const tokenDecode = jwt.verify(bearerToken, process.env.JWT_SECRET_KEY);

      const user = await UserModel.findOne({ _id: tokenDecode.id });
      const role_key = await RoleModel.findOne({ _id: user.role_id });

      if (user && role_key) {
        req.user = user;
        req.user.role_key = role_key.key;
      }
      next();
    }
  } catch (error) {
    res.status(401);
    throw new Error("Unauthorized user");
  }
});

export default TokenVerification;
