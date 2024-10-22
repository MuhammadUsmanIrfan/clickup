import asyncHandler from "express-async-handler";
import UserModel from "../models/UserModel.js";
import AuthController from "./AuthController.js";
import TaskModel from "../models/TaskModel.js";
import TaskMemberModel from "../models/TaskMemberModel.js";
import WorkspaceMemberModel from "../models/WorkspaceMemberModel.js";
import { inviteTokenGenerator } from "../helpers/tokenGenerator.js";
import dueDateValidator from "../helpers/dueDateValidator.js";
import daysLeftUntilDueDate from "../helpers/dueDateCounter.js";
import jwt from "jsonwebtoken";
import fs from "fs";

class TaskController extends AuthController {

  static createTask = asyncHandler(async (req, res) => {
    try {
      const {
        workspace_member_id,
        task_name,
        take_description,
        status,
        due_date,
        priority,
      } = req.body;

      if (!workspace_member_id || !task_name || !take_description) {
        res.status(404);
        throw new Error("All fields required");
      }

      if (status) {
        if (!status === "in_process" || !status === "complete") {
          res.status(400);
          throw new Error("Invalid status value");
        }
      }

      if (priority) {
        if (
          !priority === "urgent" ||
          !priority === "high" ||
          !priority === "normal" ||
          !priority === "low"
        ) {
          res.status(400);
          throw new Error("Invalid priority value");
        }
      }

      let checkDate = "";

      if (due_date) {
        checkDate = dueDateValidator(due_date);
      }

      const checkWorkspaceMember = await WorkspaceMemberModel.findOne({
        _id: workspace_member_id,
      });

      if (!checkWorkspaceMember || checkWorkspaceMember.is_deleted) {
        res.status(404);
        throw new Error("Workspace member not found");
      }

      const task = await TaskModel.create({
        workspace_member_id,
        task_name,
        take_description,
        status,
        due_date: checkDate,
        attachments: req?.files.map((attachment) => ({
          attachment_name: attachment.originalname,
          attachment_path: `uploads/${attachment.filename}`,
        })),
        priority,
      });

      if (!task) {
        res.status(400);
        throw new Error("Failed to create task");
      }

      const taskMember = await TaskMemberModel.create({
        user_id: req.user._id,
        task_id: task._id,
      });

      if (taskMember) {
        res.status(201);
        res.json(
          AuthController.generateResponse(
            201,
            "workspace and associted member is successfuly added",
            {
              workspace_member_id: task.workspace_member_id,
              task_id: taskMember._id,
              task_name: task.task_name,
              take_description: task.take_description,
              status: task.status,
              due_date: task.due_date,
              priority: task.priority,
              task_associated_with: taskMember.user_id,
              attachments: task.attachments,
            }
          )
        );
      } else {
        res.status(400);
        throw new Error("Failed to add workspace member");
      }
    } catch (error) {
      // Remove files if any error occour
      const files = req.files;
      files.forEach((file) => {
        fs.unlink(`uploads/${file.filename}`, () => { });
      });
      // ---***---
      throw new Error(error);
    }
  });

  static getNumberOfDays = asyncHandler(async (req, res) => {
    try {

      const { task_id } = req.body;

      if (!task_id) {
        res.status(404);
        throw new Error("task id is required");
      }

      const task = await TaskModel.findOne({
        _id: task_id,
      });

      if (!task) {
        res.status(404)
        throw new Error("task not found")
      }

      if (!task.due_date) {
        res.status(400)
        throw new Error("due date not set")
      }

      const numberOfDays = daysLeftUntilDueDate(task.due_date)
      if (!numberOfDays) {
        res.status(400)
        throw new Error("something went wrong getting number of days")
      }

      if (task) {
        res.status(201);
        res.json(
          AuthController.generateResponse(
            201,
            "successfuly get number of days",
            {
              numberOfDays
            }
          )
        );
      } else {
        res.status(400);
        throw new Error("Failed to add workspace member");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  static getTaskMemberWithTasks = asyncHandler(async (req, res) => {
    try {
      // Check task_member_id
      const getTaskMemberWithTasks = await TaskMemberModel.aggregate([
        {
          $match: {
            user_id: req.user._id,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_tasks",
            localField: "task_id",
            foreignField: "_id",
            as: "all_tasks",
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


      if (getTaskMemberWithTasks.length > 0) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task member with sub tasks are successfuly get",
            getTaskMemberWithTasks
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

  static getTaskWithTaskMembers = asyncHandler(async (req, res) => {
    try {
      // Check task_member_id
      const getTaskWithTaskMembers = await TaskModel.aggregate([
        {
          $match: {
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_task_members",
            localField: "_id",
            foreignField: "task_id",
            as: "all_task_members",
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


      if (getTaskWithTaskMembers.length > 0) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task member with sub tasks are successfuly get",
            getTaskWithTaskMembers
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

  static getWorkSpaceAssociateWithTasks = asyncHandler(async (req, res) => {

    try {
      // Check user 
      const checkUser = await TaskMemberModel.findOne({ user_id: req.user._id })
      if (!checkUser) {
        res.status(401)
        throw new Error("you are unauthorized user")
      }

      const getWorkSpaceAssociateTasks = await TaskMemberModel.aggregate([
        {
          $match: {
            user_id: req.user._id,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_sub_tasks",
            localField: "_id",
            foreignField: "task_member_id",
            as: "all_task_subtasks",
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

  static sendTaskInvite = asyncHandler(async (req, res) => {
    try {
      const { task_id, email } = req.body;

      if (!task_id || !email) {
        res.status(404);
        throw new Error("All fields required");
      }

      const task = await TaskModel.findOne({
        _id: task_id,
      });

      const userEmail = await UserModel.findOne({
        email: email.toLocaleLowerCase(),
      });

      const checkTaskMember = await TaskMemberModel.findOne({
        user_id: userEmail._id,
        is_deleted: false
      });

      if (checkTaskMember) {
        res.status(400);
        throw new Error("This email is already member of this Task");
      }

      if (!task || task.is_deleted) {
        res.status(404);
        throw new Error("Task not found");
      }

      if (!userEmail) {
        res.status(404);
        throw new Error("User with this email not found");
      }

      const invitation = inviteTokenGenerator(task._id, email, req.user._id);

      if (!invitation) {
        res.status(400);
        throw new Error("something went wrong in invitation token creation");
      }

      res.status(200);
      res.json(
        AuthController.generateResponse(201, "invition sent successfuly", {
          invited_user_email: userEmail.email,
          invited_task_id: task._id,
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

  static acceptTaskInvite = asyncHandler(async (req, res) => {
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

      const { memberId, invitedUserEmail, invitedByUserID } = tokenDecode;

      const userEmail = await UserModel.findOne({
        email: invitedUserEmail.toLocaleLowerCase(),
      });

      if (req.user.email != userEmail) {
        res.status(401);
        throw new Error("you are unauthorized user");
      }

      const task = await TaskModel.findOne({
        _id: memberId,
      });

      if (!task) {
        res.status(404);
        throw new Error("task not found");
      }

      const taskMember = await TaskMemberModel.create({
        user_id: req.user._id,
        task_id: task._id,
      });

      if (!taskMember) {
        res.status(400);
        throw new Error("adding to task failed");
      }

      res.status(200);
      res.json(
        AuthController.generateResponse(
          201,
          "task inivition successfuly accepted and user added in task",
          {
            task_id: taskMember.task_id,
            associate_member_id: taskMember.user_id,
            invitedByUserID,
          }
        )
      );
    } catch (error) {
      throw new Error(error);
    }
  });

  static updateTask = asyncHandler(async (req, res) => {
    try {
      const {
        task_id,
        task_name,
        take_description,
        status,
        due_date,
        priority,
      } = req.body;

      const updatedTask = {};

      // Check is the user member of this task
      const checkTaskMember = await TaskMemberModel.findOne({
        user_id: req.user._id,
        is_deleted: false,
      });

      if (!checkTaskMember) {
        res.status(404);
        throw new Error("Task member not found");
      }

      if (!task_id) {
        res.status(400);
        throw new Error("task id is required");
      }

      if (task_name) {
        updatedTask.task_name = task_name;
      }
      if (take_description) {
        updatedTask.take_description = take_description;
      }

      if (status) {
        if (!status === "in_process" || !status === "complete") {
          res.status(400);
          throw new Error("Invalid status value");
        } else {
          updatedTask.status = status;
        }
      }

      if (priority) {
        if (
          !priority === "urgent" ||
          !priority === "high" ||
          !priority === "normal" ||
          !priority === "low"
        ) {
          res.status(400);
          throw new Error("Invalid priority value");
        } else {
          updatedTask.priority = priority;
        }
      }

      let checkDate = "";

      if (due_date) {
        checkDate = dueDateValidator(due_date);
        updatedTask.due_date = checkDate;
      }

      // Check if files updated
      if (req.files.length >= 1) {
        const files = req.files;
        files.forEach((file) => {
          fs.unlink(`uploads/${file.filename}`, () => { });
        });

        updatedTask.attachments = req?.files.map((attachment) => ({
          attachment_name: attachment.originalname,
          attachment_path: `uploads/${attachment.filename}`,
        }));
      }

      const task = await TaskModel.findOneAndUpdate(
        { _id: task_id, is_deleted: false },
        updatedTask,
        { new: true }
      );

      if (task) {
        res.status(200);
        res.json(
          AuthController.generateResponse(201, "task is successfuly updated", {
            task_id: task._id,
            task_name: task.task_name,
            take_description: task.take_description,
            status: task.status,
            due_date: task.due_date,
            priority: task.priority,
            attachments: task.attachments,
          })
        );
      } else {
        res.status(400);
        throw new Error("Failed to update task");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  static deleteTaskMember = asyncHandler(async (req, res) => {
    try {

      const { task_id } = req.body

      // Check is the user member of this task
      const checkTaskMember = await TaskMemberModel.findOne({
        user_id: req.user._id,
        task_id: task_id,
        is_deleted: false,
      });

      if (!checkTaskMember) {
        res.status(401);
        throw new Error("you are not member of this sub task");
      }

      const deleteAssociatedMember = await TaskMemberModel.findOneAndUpdate(
        {
          user_id: req.user._id,
          task_id: task_id,
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
            "task associted members successfuly deleted"
          )
        );
      } else {
        res.status(400);
        throw new Error("something went wrong deleting this task");
      }


    } catch (error) {
      throw new Error(error);
    }
  });

  static deleteTask = asyncHandler(async (req, res) => {
    try {
      const { task_id } = req.body;

      if (!task_id) {
        res.status(404);
        throw new Error("task id is required");
      }

      // Check is the user member of this task
      const checkTaskMember = await TaskMemberModel.findOne({
        user_id: req.user._id,
        is_deleted: false,
      });

      if (!checkTaskMember) {
        res.status(401);
        throw new Error("you are not member of this task");
      }

      const task = await TaskModel.findOneAndUpdate(
        {
          _id: task_id,
        },
        {
          is_deleted: true,
        },
        { new: true }
      );

      const deleteAssociatedMembers = await TaskMemberModel.updateMany(
        {
          task_id: task_id
        },
        {
          is_deleted: true
        }
      )

      if (task && deleteAssociatedMembers) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            200,
            "task and its associted members successfuly deleted"
          )
        );
      } else {
        res.status(400);
        throw new Error("something went wrong deleting this task");
      }
    } catch (error) {
      throw new Error(error);
    }
  });
}

export default TaskController;
