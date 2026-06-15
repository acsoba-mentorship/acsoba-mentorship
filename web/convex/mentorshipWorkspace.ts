import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as WorkspaceModel from "./model/mentorshipWorkspace";

export const getWorkspace = query({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: (ctx, args) => WorkspaceModel.getWorkspace(ctx, args),
});

export const createGoal = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: (ctx, args) => WorkspaceModel.createGoal(ctx, args),
});

export const updateGoal = mutation({
  args: {
    goalId: v.id("mentorshipGoals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: (ctx, args) => WorkspaceModel.updateGoal(ctx, args),
});

export const toggleGoalComplete = mutation({
  args: {
    goalId: v.id("mentorshipGoals"),
    completed: v.boolean(),
  },
  handler: (ctx, args) => WorkspaceModel.toggleGoalComplete(ctx, args),
});

export const deleteGoal = mutation({
  args: {
    goalId: v.id("mentorshipGoals"),
  },
  handler: (ctx, args) => WorkspaceModel.deleteGoal(ctx, args),
});

export const createTodo = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
    goalId: v.optional(v.id("mentorshipGoals")),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: (ctx, args) => WorkspaceModel.createTodo(ctx, args),
});

export const updateTodo = mutation({
  args: {
    todoId: v.id("mentorshipTodos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: (ctx, args) => WorkspaceModel.updateTodo(ctx, args),
});

export const toggleTodoComplete = mutation({
  args: {
    todoId: v.id("mentorshipTodos"),
    completed: v.boolean(),
  },
  handler: (ctx, args) => WorkspaceModel.toggleTodoComplete(ctx, args),
});

export const deleteTodo = mutation({
  args: {
    todoId: v.id("mentorshipTodos"),
  },
  handler: (ctx, args) => WorkspaceModel.deleteTodo(ctx, args),
});