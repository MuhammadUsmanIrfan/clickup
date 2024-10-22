import asyncHandler from "express-async-handler";
import UserModel from "../models/UserModel.js";
import AuthController from "./AuthController.js";
import SubTaskModel from "../models/SubTaskModel.js";
import TaskMemberModel from "../models/TaskMemberModel.js";
import SubTaskMemberModel from "../models/SubTaskMemberModel.js";
import { inviteTokenGenerator } from "../helpers/tokenGenerator.js";
import dueDateValidator from "../helpers/dueDateValidator.js";
import daysLeftUntilDueDate from "../helpers/dueDateCounter.js";
import jwt from "jsonwebtoken";
import fs from "fs";
class SubTaskController extends AuthController {
  static createSubTask = asyncHandler(async (req, res) => {
    try {
      const {
        task_member_id,
        sub_task_name,
        sub_task_description,
        status,
        due_date,
        priority,
      } = req.body;

      const subTaskObject = {};

      if (!task_member_id || !sub_task_name || !sub_task_description) {
        res.status(404);
        throw new Error("All fields required");
      }

      // Check task_member_id
      const checkTaskMemeberId = await TaskMemberModel.findOne({
        _id: task_member_id,
        is_deleted: false,
      });

      if (!checkTaskMemeberId) {
        res.status(404);
        throw new Error("task member not found");
      }

      subTaskObject.task_member_id = task_member_id;
      subTaskObject.sub_task_name = sub_task_name;
      subTaskObject.sub_task_description = sub_task_description;

      if (status) {
        if (!status === "in_process" || !status === "complete") {
          res.status(400);
          throw new Error("Invalid status value");
        } else {
          subTaskObject.status = status;
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
          subTaskObject.priority = priority;
        }
      }

      let checkDate = "";

      if (due_date) {
        checkDate = dueDateValidator(due_date);
        if (checkDate) {
          subTaskObject.due_date = checkDate;
        }
      }

      const checkTaskMember = await TaskMemberModel.findOne({
        _id: task_member_id,
        is_deleted: false,
      });

      if (!checkTaskMember) {
        res.status(404);
        throw new Error("Task member not found");
      }

      if (req.files.length >= 1) {
        subTaskObject.attachments = req?.files.map((attachment) => ({
          attachment_name: attachment.originalname,
          attachment_path: `uploads/${attachment.filename}`,
        }));
      }

      const subTask = await SubTaskModel.create(subTaskObject);

      if (!subTask) {
        res.status(400);
        throw new Error("Failed to create sub task");
      }

      const subTaskMember = await SubTaskMemberModel.create({
        user_id: req.user._id,
        sub_task_id: subTask._id,
      });

      if (subTaskMember) {
        res.status(201);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task and associted member is successfuly added",
            {
              task_member_id: subTask.task_member_id,
              sub_task_id: subTaskMember._id,
              sub_task_name: subTask.sub_task_name,
              sub_task_description: subTask.sub_task_description,
              status: subTask.status,
              attachments: subTask.attachments,
              due_date: subTask.due_date,
              priority: subTask.priority,
              task_associated_with: subTaskMember.user_id,
            }
          )
        );
      } else {
        res.status(400);
        throw new Error("Failed to add sub task member");
      }
    } catch (error) {
      // Remove files if any error occour
      const files = req.files;
      files.forEach((file) => {
        fs.unlink(`uploads/${file.filename}`, () => { });
      });
      throw new Error(error);
    }
  });

  static getSubTaskMemberWithSubTasks = asyncHandler(async (req, res) => {
    try {
      // Check task_member_id
      const getSubTaskMemberWithSubTasks = await SubTaskMemberModel.aggregate([
        {
          $match: {
            user_id: req.user._id,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_sub_tasks",
            localField: "sub_task_id",
            foreignField: "_id",
            as: "all_sub_tasks",
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


      if (getSubTaskMemberWithSubTasks.length > 0) {
        res.status(201);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task member with sub tasks are successfuly get",
            getSubTaskMemberWithSubTasks
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

  static getSubTaskWithSubTaskMembers = asyncHandler(async (req, res) => {
    try {
      // Check task_member_id
      const getSubTaskWithSubTaskMembers = await SubTaskModel.aggregate([
        {
          $match: {
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "tbl_sub_task_members",
            localField: "_id",
            foreignField: "sub_task_id",
            as: "all_sub_task_members",
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


      if (getSubTaskWithSubTaskMembers.length > 0) {
        res.status(201);
        res.json(
          AuthController.generateResponse(
            201,
            "Sub task member with sub tasks are successfuly get",
            getSubTaskWithSubTaskMembers
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

  static getNumberOfDays = asyncHandler(async (req, res) => {
    try {

      const { sub_task_id } = req.body;

      if (!sub_task_id) {
        res.status(404);
        throw new Error("task id is required");
      }

      const subTask = await SubTaskModel.findOne({
        _id: sub_task_id,
      });

      if (!subTask) {
        res.status(404)
        throw new Error("task not found")
      }

      if (!subTask.due_date) {
        res.status(400)
        throw new Error("due date not set")
      }

      const numberOfDays = daysLeftUntilDueDate(subTask.due_date)
      if (!numberOfDays) {
        res.status(400)
        throw new Error("something went wrong getting number of days")
      }

      if (subTask) {
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

  static sendSubTaskInvite = asyncHandler(async (req, res) => {
    try {
      const { sub_task_id, email } = req.body;

      if (!sub_task_id || !email) {
        res.status(404);
        throw new Error("All fields required");
      }

      const subTask = await SubTaskModel.findOne({
        _id: sub_task_id,
        is_deleted: false,
      });

      const userEmail = await UserModel.findOne({
        email: email.toLocaleLowerCase(),
        is_deleted: false,
      });

      const checkSubTaskMember = await SubTaskMemberModel.findOne({
        user_id: userEmail._id,
        is_deleted: false,
      });

      if (checkSubTaskMember) {
        res.status(400);
        throw new Error("this email is already member of this sub task");
      }

      if (!subTask) {
        res.status(404);
        throw new Error("sub task not found");
      }

      if (!userEmail) {
        res.status(404);
        throw new Error("User with this email not found");
      }

      const invitation = inviteTokenGenerator(subTask._id, email, req.user._id);

      if (!invitation) {
        res.status(400);
        throw new Error("something went wrong in invitation token creation");
      }

      res.status(200);
      res.json(
        AuthController.generateResponse(201, "invition sent successfuly", {
          invited_user_email: userEmail.email,
          invited_task_id: subTask._id,
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

  static acceptSubTaskInvite = asyncHandler(async (req, res) => {
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


      if (invitedUserEmail != req.user.email) {
        res.status(401);
        throw new Error("you are unauthorized user");
      }

      const subTask = await SubTaskModel.findOne({
        _id: memberId,
        is_deleted: false,
      });

      if (!subTask) {
        res.status(404);
        throw new Error("sub task not found");
      }

      const checkSubTaskMember = await SubTaskMemberModel.findOne({
        user_id: req.user._id,
        is_deleted: false,
      });

      if (checkSubTaskMember) {
        res.status(400);
        throw new Error("this email is already member of this sub task");
      }


      const subTaskMember = await SubTaskMemberModel.create({
        user_id: req.user._id,
        sub_task_id: subTask._id,
      });

      if (!subTaskMember) {
        res.status(400);
        throw new Error("adding to sub task failed");
      }

      res.status(201);
      res.json(
        AuthController.generateResponse(
          201,
          "sub task inivition successfuly accepted and user added in sub task",
          {
            task_id: subTaskMember.task_id,
            associate_member_id: subTaskMember.user_id,
            invitedByUserID,
          }
        )
      );
    } catch (error) {
      throw new Error(error);
    }
  });

  static updateSubTask = asyncHandler(async (req, res) => {
    try {
      const {
        sub_task_id,
        sub_task_name,
        sub_task_description,
        status,
        due_date,
        priority,
      } = req.body;

      const updatedSubTask = {};

      // Check is the user member of this task
      const checkSubTaskMember = await SubTaskMemberModel.findOne({
        user_id: req.user._id,
        is_deleted: false,
      });

      if (!checkSubTaskMember) {
        res.status(401);
        throw new Error("you are not member of this sub task");
      }

      if (!sub_task_id) {
        res.status(400);
        throw new Error("task id is required");
      }

      const checkSubTask = await SubTaskModel.findOne({
        _id: sub_task_id,
        is_deleted: false,
      });

      if (!checkSubTask) {
        res.status(404);
        throw new Error("sub task not found");
      }

      if (sub_task_name) {
        updatedSubTask.sub_task_name = sub_task_name;
      }

      if (sub_task_description) {
        updatedSubTask.sub_task_description = sub_task_description;
      }

      if (status) {
        if (!status === "in_process" || !status === "complete") {
          res.status(400);
          throw new Error("Invalid status value");
        } else {
          updatedSubTask.status = status;
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
          updatedSubTask.priority = priority;
        }
      }

      let checkDate = "";

      if (due_date) {
        checkDate = dueDateValidator(due_date);
        updatedSubTask.due_date = checkDate;
      }

      // Check if files updated
      if (req.files.length >= 1) {
        const files = req.files;
        files.forEach((file) => {
          fs.unlink(`uploads/${file.filename}`, () => { });
        });

        updatedSubTask.attachments = req?.files.map((attachment) => ({
          attachment_name: attachment.originalname,
          attachment_path: `uploads/${attachment.filename}`,
        }));
      }

      const subTask = await SubTaskModel.findOneAndUpdate(
        { _id: sub_task_id, is_deleted: false },
        updatedSubTask,
        { new: true }
      );

      if (subTask) {
        res.status(201);
        res.json(
          AuthController.generateResponse(
            201,
            "sub task is successfuly updated",
            {
              task_id: subTask._id,
              task_name: subTask.sub_task_name,
              take_description: subTask.sub_task_description,
              status: subTask.status,
              due_date: subTask.due_date,
              priority: subTask.priority,
              attachments: subTask.attachments,
            }
          )
        );
      } else {
        res.status(400);
        throw new Error("Failed to update task");
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  static deleteSubTaskMember = asyncHandler(async (req, res) => {
    try {

      const { sub_task_id } = req.body

      // Check is the user member of this task
      const checkSubTaskMember = await SubTaskMemberModel.findOne({
        user_id: req.user._id,
        sub_task_id: sub_task_id,
        is_deleted: false,
      });

      if (!checkSubTaskMember) {
        res.status(401);
        throw new Error("you are not member of this sub task");
      }

      const deleteAssociatedMember = await SubTaskMemberModel.findOneAndUpdate(
        {
          user_id: req.user._id,
          sub_task_id: sub_task_id,
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

  static deleteSubTask = asyncHandler(async (req, res) => {
    try {
      const { sub_task_id } = req.body;

      if (!sub_task_id) {
        res.status(404);
        throw new Error("sub task id is required");
      }

      // Check is the user member of this task
      const checkSubTaskMember = await SubTaskMemberModel.findOne({
        user_id: req.user._id,
        is_deleted: false,
      });

      if (!checkSubTaskMember) {
        res.status(401);
        throw new Error("you are not member of this sub task");
      }

      const subTask = await SubTaskModel.findOneAndUpdate(
        {
          _id: sub_task_id,
        },
        {
          is_deleted: true,
        },
        { new: true }
      );

      const deleteAssociatedMembers = await SubTaskMemberModel.updateMany(
        {
          sub_task_id: sub_task_id
        },
        {
          is_deleted: true
        }
      )

      if (subTask && deleteAssociatedMembers) {
        res.status(200);
        res.json(
          AuthController.generateResponse(
            200,
            "sub task and its associted members successfuly deleted"
          )
        );
      } else {
        res.status(400);
        throw new Error("something went wrong deleting this sub task");
      }
    } catch (error) {
      throw new Error(error);
    }
  });
}

export default SubTaskController;
