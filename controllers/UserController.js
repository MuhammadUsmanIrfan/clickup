import asyncHandler from "express-async-handler";
import UserModel from "../models/UserModel.js";
import RoleModel from "../models/RoleModel.js";
import AuthController from "./AuthController.js";

class UserController {

  static superAdminGetAllUsers = asyncHandler(async (req, res) => {
    try {
      const userRole = await req.user.populate("role_id");

      if (userRole.role_id.key === "super-admin") {

        let { page, limit } = req.body

        if (!page) {
          page = 1;
        }
        if (!limit) {
          limit = 2
        }
        if (limit && limit <= 20) {
          limit = Number(limit);
        } else {
          res.status(400)
          throw new Error("max limit is 20")
        }



        page = Number(page);

        let skip = 0;
        if (page >= 1) {
          skip = (page - 1) * limit;
        } else {
          res.status(400);
          throw new Error("Page should be greater than 0");
        }

        const totalCount = await UserModel.aggregate([
          {
            $match: {},
          },
          {
            $count: "totalCount"
          }
        ]);



        const allUsers = await UserModel.aggregate([
          {
            $match: {},
          },
          {
            $project: {
              is_deleted: 0,
              __v: 0,
              status: 0,
              password: 0,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          }
        ]);

        if (allUsers) {
          res.status(200);
          res.json(
            AuthController.generateResponse(
              200,
              "User role is set",
              {
                total_users: totalCount[0].totalCount,
                all_users: allUsers
              }
            )
          );
        } else {
          res.status(404);
          res.send("users not found");
        }
      } else {
        res.status(401);
        res.send("you are unauthorized");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  static updateUserDetails = asyncHandler(async (req, res) => {
    try {
      const { first_name, last_name, email, } = req.body;

      if (!first_name && !last_name && !email) {
        res.status(400);
        throw new Error("All fields are required");
      }
      const { status, is_deleted } = req.user;

      if (!is_deleted) {
        if (status) {
          const updateUser = await UserModel.findOneAndUpdate(
            {
              _id: req.user._id,
            },
            {
              first_name,
              last_name,
              email,
            },
            {
              new: true,
            }
          );

          if (updateUser) {
            const getRole = await RoleModel.findOne({ _id: req.user.role_id });

            res.status(200);
            res.json(
              AuthController.generateResponse(
                200,
                "Account updated successful",
                {
                  first_name: updateUser.first_name,
                  last_name: updateUser.last_name,
                  email: updateUser.email,
                  role_id: updateUser.role_id,
                  role_name: getRole.name,
                  role_key: getRole.key,
                  createdAt: updateUser.createdAt,
                  updatedAt: updateUser.updatedAt,
                }
              )
            );
          }
        } else {
          res.status(401);
          throw new Error("You are not allowed to login");
        }
      } else {
        res.status(404);
        throw new Error(
          "Your account has been deleted, please contact support."
        );
      }
    } catch (e) {
      // res.status(400);
      throw new Error(e);
    }
  });

  static superAdminChangeRole = asyncHandler(async (req, res) => {
    try {
      const userRole = await req.user.populate("role");

      if (userRole.role.key === "super-admin") {
        const { userId, roleId } = req.body;

        const roles = await RoleModel.findOne({ _id: roleId });
        if (!roles) {
          res.status(404)
          throw new Error("role not found")
        }

        const updateUser = await UserModel.findOneAndUpdate(
          { _id: userId.toString() },
          { role: roleId },
          { new: true }
        );

        if (updateUser) {


          const updatedUserResponse = {
            first_name: updateUser.first_name,
            last_name: updateUser.last_name,
            email: updateUser.email,
            plan: updateUser.plan,
            role_id: updateUser.role,
            role_key: roles.key,
            createdAt: updateUser.createdAt,
            updatedAt: updateUser.updatedAt,
          };

          res.status(200);
          res.json(
            AuthController.generateResponse(
              200,
              "User role is set",
              updatedUserResponse
            )
          );
        }
      } else {
        res.status(401);
        res.send("You are unauthorized");
      }
    } catch (error) {
      res.status(400);
      throw new Error("Failed to change Role");
    }
  });

  static superAdminChangeStatus = asyncHandler(async (req, res) => {
    try {
      const userRole = await req.user.populate("role");

      if (userRole.role.key === "super-admin") {
        const { userId, status } = req.body;

        if (status != "active" && status != "inactive") {
          res.status(404);
          throw new Error("Invalid Status Value");
        }

        const updateUser = await UserModel.findOneAndUpdate(
          { _id: userId.toString() },
          { status: status },
          { new: true }
        );

        const currentUserRoleKey = await UserModel.findOne({
          _id: userId,
        }).populate("role");

        const updatedUserResponse = {
          first_name: updateUser.first_name,
          last_name: updateUser.last_name,
          email: updateUser.email,
          plan: updateUser.plan,
          role_id: updateUser.role,
          role_key: currentUserRoleKey.role.key,
          createdAt: updateUser.createdAt,
          updatedAt: updateUser.updatedAt,
        };

        if (updateUser) {
          res.status(200);
          res.json(
            AuthController.generateResponse(
              200,
              `User status is now ${status}`,
              updatedUserResponse
            )
          );
        } else {
          res.status(404);
          res.send("User not found");
        }
      } else {
        res.status(401);
        res.send("You are unauthorized");
      }
    } catch (error) {
      res.status(400);
      throw new Error("Failed to change Role");
    }
  });

  static superAdminDeleteUser = asyncHandler(async (req, res) => {
    try {
      const userRole = await req.user.populate("role");

      if (userRole.role.key === "super-admin") {
        const { userId, isDeleted } = req.body;

        if (isDeleted === "false" || isDeleted === "true") {
          const updateUser = await UserModel.findOneAndUpdate(
            { _id: userId.toString() },
            { isDeleted },
            { new: true }
          );

          const currentUserRoleKey = await UserModel.findOne({
            _id: userId,
          }).populate("role");

          const updatedUserResponse = {
            first_name: updateUser.first_name,
            last_name: updateUser.last_name,
            email: updateUser.email,
            plan: updateUser.plan,
            role_id: updateUser.role,
            role_key: currentUserRoleKey.role.key,
            isDeleted: updateUser.isDeleted,
            status: updateUser.status,
            createdAt: updateUser.createdAt,
            updatedAt: updateUser.updatedAt,
          };

          if (updateUser) {
            res.status(200);
            res.json(
              AuthController.generateResponse(
                200,
                `User Account is now ${isDeleted}`,
                updatedUserResponse
              )
            );
          } else {
            res.status(404);
            res.send("User not found");
          }
        } else {
          res.status(400);
          throw new Error("Invalid value");
        }
      } else {
        res.status(401);
        res.send("You are unauthorized");
      }
    } catch (error) {
      res.status(400);
      throw new Error("Failed to change Role");
    }
  });
}

export default UserController;
