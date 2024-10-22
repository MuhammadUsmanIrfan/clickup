import asyncHandler from "express-async-handler";
import RoleModel from "../models/RoleModel.js";
import AuthController from "./AuthController.js";

class RoleController {
  static addRole = asyncHandler(async (req, res) => {
    try {
      if (req.user.role_key === "super-admin") {
        const { name, key } = req.body;

        if (!name || !key) {
          res.status(404);
          throw new Error("Please provide all details");
        }

        // Checking is this Role alreay existed or not
        const checkRole = await RoleModel.findOne({ key });

        if (checkRole) {
          res.status(409);
          throw new Error("This role is already present");
        }

        const role = await RoleModel.create({
          name,
          key,
        });

        const roleCreationResponse = await RoleModel.aggregate([
          {
            $match: { _id: role._id },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              key: 1,
            },
          },
        ]);

        if (role) {
          res.status(201);
          res.json(
            AuthController.generateResponse(
              201,
              "Role added successfuly",
              roleCreationResponse
            )
          );
        }
      } else {
        res.status(401);
        throw new Error("Not Allowed to set role");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  static getRoles = asyncHandler(async (req, res) => {
    try {
      // const getRoles = await RoleModel.find({});
      if (req.user.role_key === "super-admin") {
        const getAllRolesResponse = await RoleModel.aggregate([
          {
            $match: {},
          },
          {
            $project: {
              _id: 1,
              name: 1,
              key: 1,
            },
          },
        ]);

        if (getAllRolesResponse) {
          res.status(200);
          res.json(AuthController.generateResponse(200, "", getAllRolesResponse));
        }
      } else {
        res.status(401);
        throw new Error("Not allowed to get roles");
      }
    } catch (error) {
      res.status(404);
      throw new Error("roles not found");
    }
  });

  static editRole = asyncHandler(async (req, res) => {
    try {
      if (req.user.role_key === "super-admin") {
        const { roleId, newName, newKey } = req.body;

        if (!newName && !roleId && !newKey) {
          res.status(404);
          throw new Error("Please provide all details");
        }

        const checkRole = await RoleModel.findOneAndUpdate(
          { _id: roleId, is_deleted: false },
          { name: newName, key: newKey }
        );

        if (!checkRole) {
          res.status(404);
          throw new Error("This role not found");
        }

        const editedRoleResponse = await RoleModel.aggregate([
          {
            $match: {
              _id: checkRole._id,
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              key: 1,
            },
          },
        ]);

        res.status(200);
        res.json(
          AuthController.generateResponse(
            200,
            "Role edited successfuly",
            editedRoleResponse
          )
        );
      }
    } catch (error) {
      res.status(400);
      throw new Error("Unable to set role");
    }
  });

  static deleteRole = asyncHandler(async (req, res) => {
    try {
      if (req.user.role_key === "super-admin") {
        const { role_id } = req.body;

        if (!role_id) {
          res.status(404);
          throw new Error("Role id not found");
        }

        const checkRole = await RoleModel.findOneAndUpdate(
          { _id: role_id },
          { is_deleted: true }
        );

        if (!checkRole) {
          res.status(400);
          throw new Error("Failed To delete role");
        }

        res.status(200);
        res.json(
          AuthController.generateResponse(
            200,
            "Role deleted successfuly",
          )
        );
      }
    } catch (error) {

      throw new Error(error);
    }
  });
}

export default RoleController;
