import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values"  //v is validate

export default defineSchema({
    todos: defineTable({
        text: v.string(),
        isCompleted: v.boolean(),
    }),
})