import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTodos = query ({
    handler: async (ctx) => {
        const todos = await ctx.db.query("todos").order("desc").collect();
        return todos;
    }
})

export const addTodo = mutation({
    args:{text:v.string()},  // here user can add the todos via this
    handler:async(ctx, args) => {
        const todoId = await ctx.db.insert("todos", {
            text: args.text,
            isCompleted:false,  // by default the task will be shown as not completed if its not started
        });
        return todoId;
    },
});

export const toggleTodo = mutation({  // the tick mark if the task is done
    args:{id:v.id("todos")},
    handler: async(ctx,args) => {
        const todo = await ctx.db.get(args.id)
        if(!todo) throw new ConvexError("Todo not found")

        await ctx.db.patch(args.id, {
            isCompleted: !todo.isCompleted
        });
    },
});

export const deleteTodo = mutation({  // del the todo if req
    args: {id:v.id("todos")},
    handler: async (convexToJson, args) => {
        await convexToJson.db.delete(args.id);
    },
});

export const updateTodo = mutation({
  args: {
    id: v.id("todos"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {  // id of the todo to be updated
      text: args.text,
    });
  },
});

export const clearAllTodos = mutation({
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").collect();  // fetch all todos

    for (const todo of todos) {  // del all todos (reset all the tasks)
      await ctx.db.delete(todo._id);
    }

    return { deletedCount: todos.length };
  },
});
