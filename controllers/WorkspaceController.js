import asyncHandler from "express-async-handler";
import WorkspaceModel from "../models/WorkspaceModel.js";
import WorkspaceMemberModel from "../models/WorkspaceMemberModel.js";
import UserModel from "../models/UserModel.js";
import AuthController from "./AuthController.js";
import { inviteTokenGenerator } from "../helpers/tokenGenerator.js";
import jwt from "jsonwebtoken";

class WorkspaceController extends AuthController {

  static createWorkspace = asyncHandler(async (req, res) => {
    try {
      const { workspace_name, workspace_description, is_private } = req.body;

      if (!workspace_name || !workspace_description) {
        res.status(404);
        throw new Error("All fields required");
      }

      const workspaceData = {};

      workspaceData.workspace_name = workspace_name;
      workspaceData.workspace_description = workspace_description;

      if (is_private) {
        if (is_private === "true" || is_private === "false") {
          workspaceData.is_private = is_private;
        } else {
          res.status(400);
          throw new Error("is_private can only be true or false");
        }
      }

      const workspace = await WorkspaceModel.create(workspaceData);

      if (workspace) {
        const workspaceMember = await WorkspaceMemberModel.create({
          user_id: req.user._id,
          workspace_id: workspace._id,
        });

        if (workspaceMember) {
          res.status(201);
          res.json(
            AuthController.generateResponse(
              201,
              "workspace and associted member is successfuly added",
              {
                workspace_name: workspace.workspace_name,
                workspace_description: workspace.workspace_description,
                private: workspace.is_private,
                associate_member_id: workspaceMember.user_id,
              }
            )
          );
        } else {
          res.status(400);
          throw new Error("Failed to add workspace member");
        }
      } else {
        res.status(400);
        throw new Error("Failed to create workspace");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  static getWorkSpaceMemberWithWorkspaces = asyncHandler(async (req, res) => {
    try {
      // Check task_member_id
      const getWorkSpaceMemberWithWorkspaces = await WorkspaceMemberModel.aggregate([
        {
          $match: {
            user_id: req.user._id,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_workspaces",
            localField: "workspace_id",
            foreignField: "_id",
            as: "all_workspaces",
            pipeline: [
              {
                $match: {
                  is_deleted: false,
                },
              },
              {
                $project: {
                  is_deleted: 0,
                  __v: 0
                }
              }
            ],
          },
        },
        {
          $project: {
            is_deleted: 0,
            __v: 0
          }
        }

      ]);


      if (getWorkSpaceMemberWithWorkspaces.length > 0) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task member with sub tasks are successfuly get",
            getWorkSpaceMemberWithWorkspaces
          )
        );
      } else {
        res.status(404)
        throw new Error("No task found")
      }

    } catch (error) {
      throw new Error(error);
    }
  });

  static getWorkspaceWithWorkspaceMembers = asyncHandler(async (req, res) => {
    try {
      // Check task_member_id
      const getWorkspaceWithWorkspaceMembers = await WorkspaceModel.aggregate([
        {
          $match: {
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_workspace_members",
            localField: "_id",
            foreignField: "workspace_id",
            as: "all_workspaces_members",
            pipeline: [
              {
                $match: {
                  user_id: req.user._id,
                  is_deleted: false,
                },
              },
              {
                $project: {
                  is_deleted: 0,
                  __v: 0
                }
              }
            ],
          },
        },
        {
          $project: {
            is_deleted: 0,
            __v: 0
          }
        }

      ]);


      if (getWorkspaceWithWorkspaceMembers.length > 0) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task member with sub tasks are successfuly get",
            getWorkspaceWithWorkspaceMembers
          )
        );
      } else {
        res.status(404)
        throw new Error("No task found")
      }

    } catch (error) {
      throw new Error(error);
    }
  });

  static getWorkSpaceAssociateTasks = asyncHandler(async (req, res) => {

    try {
      // Check user 
      const checkUser = await WorkspaceMemberModel.findOne({ user_id: req.user._id })

      if (!checkUser) {
        res.status(401)
        throw new Error("you are unauthorized user")
      }

      const getWorkSpaceAssociateTasks = await WorkspaceMemberModel.aggregate([
        {
          $match: {
            user_id: req.user._id,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_tasks",
            localField: "_id",
            foreignField: "workspace_member_id",
            as: "all_workspaces_tasks",
            pipeline: [
              {
                $match: {
                  is_deleted: false,
                },
              },
              {
                $project: {
                  is_deleted: 0,
                  __v: 0
                }
              }
            ],
          },
        },
        {
          $project: {
            is_deleted: 0,
            __v: 0
          }
        }

      ]);


      if (getWorkSpaceAssociateTasks.length > 0) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task member with sub tasks are successfuly get",
            getWorkSpaceAssociateTasks
          )
        );
      } else {
        res.status(404)
        throw new Error("No task found")
      }

    } catch (error) {
      throw new Error(error);
    }
  });

  static sendInvite = asyncHandler(async (req, res) => {
    try {
      const { workspace_id, email } = req.body;

      if (!workspace_id || !email) {
        res.status(404);
        throw new Error("All fields required");
      }

      const workspace = await WorkspaceModel.findOne({
        _id: workspace_id,
        is_deleted: false,
      });

      const userEmail = await UserModel.findOne({
        email: email.toLocaleLowerCase(),
      });

      const checkWorkspaceMember = await WorkspaceMemberModel.findOne({
        user_id: userEmail._id,
        is_deleted: false,
      });

      if (checkWorkspaceMember) {
        res.status(400);
        throw new Error("This email is already member of this workpspace");
      }

      if (!workspace) {
        res.status(404);
        throw new Error("workspace not found");
      }

      if (!userEmail) {
        res.status(404);
        throw new Error("User with this email not found");
      }

      const invitation = inviteTokenGenerator(
        workspace_id,
        email,
        req.user._id
      );

      if (!invitation) {
        res.status(400);
        throw new Error("something went wrong in invitation token creation");
      }

      res.status(200);
      res.json(
        AuthController.generateResponse(201, "invition sent successfuly", {
          invited_user_email: userEmail.email,
          invited_workspace_id: workspace._id,
          invitation_token: invitation,
          invitation_send_by: {
            id: req.user._id,
            name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
          },
        })
      );
    } catch (error) {
      throw new Error(error);
    }
  });

  static acceptInvite = asyncHandler(async (req, res) => {
    try {
      const { invitation_token } = req.body;

      if (!invitation_token) {
        res.status(404);
        throw new Error("Invitation token required");
      }

      const tokenDecode = jwt.verify(
        invitation_token,
        process.env.JWT_SECRET_KEY
      );

      const { invitedByUserID, memberId, invitedUserEmail } = tokenDecode;

      const userEmail = await UserModel.findOne({
        email: invitedUserEmail.toLocaleLowerCase(),
        is_deleted: false,
      });

      if (!userEmail) {
        res.status(404);
        throw new Error("Email not found");
      } else if (req.user.email != userEmail) {
        res.status(401);
        throw new Error("you are unauthorized user");
      }

      const workspace = await WorkspaceModel.findOne({
        _id: memberId,
        is_deleted: false,
      });

      if (!workspace) {
        res.status(404);
        throw new Error("Workspace not found");
      }

      const checkWorkspaceMember = await WorkspaceMemberModel.findOne({
        user_id: req.user._id,
        is_deleted: false
      });

      if (checkWorkspaceMember) {
        res.status(400);
        throw new Error("you already member of this workpspace");
      }

      const workspaceMember = await WorkspaceMemberModel.create({
        user_id: userEmail._id,
        workspace_id: workspace._id,
      });

      if (!workspaceMember) {
        res.status(400);
        throw new Error("adding workspace failed");
      }

      res.status(201);
      res.json(
        AuthController.generateResponse(
          201,
          "workspace inivition successfuly accepted and user added in workpspace",
          {
            invited_by_user_id: invitedByUserID,
            workspace_id: workspaceMember.workspace_id,
            associate_member_id: workspaceMember.user_id,
          }
        )
      );
    } catch (error) {
      throw new Error(error);
    }
  });

  static updateWorkspace = asyncHandler(async (req, res) => {
    try {
      const {
        workspace_id,
        workspace_name,
        workspace_description,
        is_private,
      } = req.body;

      const updateFields = {};

      if (!workspace_id) {
        res.status(404);
        throw new Error("workspace id is required");
      }

      // Check is this user is a member of this workspace
      const CheckUser = await WorkspaceMemberModel.findOne({
        user_id: req.user._id,
      });

      if (!CheckUser && !CheckUser.is_deleted) {
        res.status(401);
        throw new Error("unauthorized to update the workspace");
      }
      // -----***------

      if (workspace_name) {
        updateFields.workspace_name = workspace_name;
      }
      if (workspace_description) {
        updateFields.workspace_name = workspace_description;
      }

      if (is_private) {
        if (is_private === "true" || is_private === "false") {
          updateFields.is_private = is_private;
        } else {
          res.status(400);
          throw new Error("is_private can only be true or false");
        }
      }

      const workspace = await WorkspaceModel.findOneAndUpdate(
        {
          _id: workspace_id,
          is_deleted: false,
        },
        updateFields,
        {
          new: true,
        }
      );

      if (workspace) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            201,
            "workspace is successfuly updated",
            {
              workspace_name: workspace.workspace_name,
              workspace_description: workspace.workspace_description,
              private: workspace.is_private,
            }
          )
        );
      } else {
        res.status(400);
        throw new Error("Failed to update workspace");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  static deleteWorkspaceMember = asyncHandler(async (req, res) => {
    try {

      const { workspace_id } = req.body

      // Check is the user member of this work space
      const checkWorkspaceMember = await WorkspaceMemberModel.findOne({
        user_id: req.user._id,
        workspace_id: workspace_id,
        is_deleted: false,
      });

      if (!checkWorkspaceMember) {
        res.status(401);
        throw new Error("you are not member of this workp space");
      }

      const deleteAssociatedMember = await WorkspaceMemberModel.findOneAndUpdate(
        {
          user_id: req.user._id,
          workspace_id: workspace_id,
        },
        {
          is_deleted: true
        }
      )

      if (deleteAssociatedMember) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            200,
            "work space associted members successfuly deleted"
          )
        );
      } else {
        res.status(400);
        throw new Error("something went wrong deleting this work space");
      }


    } catch (error) {
      throw new Error(error);
    }
  });

  static deleteWorkspace = asyncHandler(async (req, res) => {
    try {
      const { workspace_id } = req.body;

      if (!workspace_id) {
        res.status(404);
        throw new Error("sub task id is required");
      }

      // Check is the user member of this task
      const checkWorkspaceMember = await WorkspaceMemberModel.findOne({
        user_id: req.user._id,
        is_deleted: false,
      });


      if (!checkWorkspaceMember) {
        res.status(401);
        throw new Error("you are not member of this sub task");
      }

      const workspace = await WorkspaceModel.findOneAndUpdate(
        {
          _id: workspace_id,
        },
        {
          is_deleted: true,
        },
        { new: true }
      );

      const deleteAssociatedMembers = await WorkspaceMemberModel.updateMany(
        {
          workspace_id: workspace_id
        },
        {
          is_deleted: true
        }
      )

      if (workspace && deleteAssociatedMembers) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            200,
            "sub task and its associted members successfuly deleted"
          )
        );
      } else {
        res.status(400);
        throw new Error("something went wrong deleting workpspace");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

}

export default WorkspaceController;
