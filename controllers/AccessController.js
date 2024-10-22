import asyncHandler from "express-async-handler";
import AuthController from "./AuthController.js";
import UserModel from "../models/UserModel.js";
import RoleModel from "../models/RoleModel.js";
import { tokenGenerator } from "../helpers/tokenGenerator.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
//@ts-check
class AccessController extends AuthController {
  static validate = asyncHandler(async (req, res) => {
    try {
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        const token = req.headers.authorization.split(" ")[1];
        let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        let user = await UserModel.findOne({ _id: decoded.id }).select(
          "-password"
        );

        const role = await RoleModel.findOne({ _id: user.role_id });

        if (role.key == "super-admin") {

          res.status(200).json(
            this.generateResponse(200, "Validated!", {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role_key: role.key,
              role_name: role.name,
            })
          );
        } else if (role.key == "admin") {
          res.status(200).json(
            this.generateResponse(
              200,
              "Validated!",
              {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role_key: role.key,
                role_name: role.name,
              },
              token
            )
          );
        } else if (role.key == "user") {
          res.status(200).json(
            this.generateResponse(
              200,
              "Validated!",
              {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role_key: role.key,
                role_name: role.name,
              },
              token
            )
          );
        }
      } else {
        res.status(404);
        throw new Error("no token found");
      }
    } catch (e) {
      // res.status(401);
      throw new Error(e);
    }
  });

  static userRegistration = asyncHandler(async (req, res) => {
    try {
      const { first_name, last_name, email, password } = req.body;

      if (!first_name || !last_name || !email || !password) {
        res.status(404);
        throw new Error("All fields are required");
      }

      // Check if user already exsited or nor
      const checkUser = await UserModel.find({
        email: email,
        isDeleted: false,
      });

      console.log(checkUser.length)
      if (checkUser.length) {
        res.status(409);
        throw new Error("This user is already existed");
      }
      // ****     ****

      // Password Encryption
      let salt = await bcrypt.genSalt(10);
      let hashedPassword = await bcrypt.hash(password, salt);
      // ****     ****

      // Getting role so we can assign a default role
      const roles = await RoleModel.findOne({ key: "user" });
      // ****     ****

      let user = await UserModel.create({
        first_name,
        last_name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role_id: roles._id,
      });

      res.status(201);
      res.json(
        AuthController.generateResponse(
          201,
          "User has been created successfully",
          {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role_id: user.role_id,
            role_key: roles.key,
          }
        )
      );
    } catch (error) {
      throw new Error(error);
    }
  });

  static login = asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(404);
        throw new Error("All details are required");
      }

      let user = await UserModel.findOne({
        email: email.toLowerCase(),
      });

      if (user) {
        if (!user.is_deleted) {
          if (user.status) {

            let checkPassword = await bcrypt.compare(password, user.password);

            if (checkPassword) {
              // Generating Token
              const roles = await RoleModel.findOne({ _id: user.role_id });




              const token = tokenGenerator(user._id);

              res.status(200);
              res.json(
                AuthController.generateResponse(
                  200,
                  "Successful",
                  {
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    plan: user.plan,
                    role_id: user.role_id,
                    role_key: roles.key,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                  },
                  token
                )
              );
            } else {
              res.status(404);
              throw new Error("Invalid credentials");
            }
          } else {
            res.status(404);
            throw new Error("You are not allowed to login");
          }
        } else {
          res.status(404);
          throw new Error(
            "Your account has been deleted, please contact support."
          );
        }
      } else {
        res.status(404);
        throw new Error("email not exist");
      }
    } catch (error) {
      throw new Error(error);
    }
  });
}

export default AccessController;