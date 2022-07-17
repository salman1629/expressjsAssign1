const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
var isValid = require("date-fns/isValid");
var parseISO = require("date-fns/parseISO");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertRequestTodosObjectToResponseTodoObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos", async (request, response) => {
  const { priority, status, category, search_q } = request.query;
  if (status !== undefined && priority === undefined) {
    const getToDoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    status = '${status}';`;
    const todoItems = await database.all(getToDoQuery);
    if (todoItems !== undefined) {
      response.send(
        todoItems.map((eachItem) =>
          convertRequestTodosObjectToResponseTodoObject(eachItem)
        )
      );
    } else {
      response.status(400);
      response.send("Invalid status");
    }
  } else if (priority !== undefined && status === undefined) {
    const getTodoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    priority = '${priority}';`;
    const todoItems = await database.all(getTodoQuery);
    if (todoItems !== undefined) {
      response.send(
        todoItems.map((eachItem) =>
          convertRequestTodosObjectToResponseTodoObject(eachItem)
        )
      );
    } else {
      response.status(400);
      response.send("Invalid priority");
    }
  } else if (status !== undefined && priority !== undefined) {
    const getTodoQuery = `
      SELECT
      *
      FROM 
      todo
      WHERE
      status = '${status}'
      AND priority = '${priority}';`;
    const todoItems = await database.all(getTodoQuery);
    console.log(todoItems.length);
    if (todoItems.length >= 1) {
      response.send(
        todoItems.map((eachItem) =>
          convertRequestTodosObjectToResponseTodoObject(eachItem)
        )
      );
    } else {
      response.send("Nothing to Do");
    }
  } else if (search_q !== undefined) {
    const getSerchTodoQuery = `
      SELECT 
      *
      FROM
      todo
      WHERE
      todo Like '%${search_q}%';`;

    const todoItems = await database.all(getSerchTodoQuery);
    if (todoItems !== undefined) {
      response.send(
        todoItems.map((eachItem) =>
          convertRequestTodosObjectToResponseTodoObject(eachItem)
        )
      );
    } else {
      response.send("No todo Item found");
    }
  } else if (category !== undefined && status !== undefined) {
    const getCateAndStaMatchedTod = `
      SELECT 
      *
      FROM
      todo
      WHERE
      category = '${category}'
      AND status = '${status}';`;

    const todoItems = await database.all(getCateAndStaMatchedTod);
    if (todoItems.length >= 1) {
      response.send(
        todoItems.map((each) =>
          convertRequestTodosObjectToResponseTodoObject(each)
        )
      );
    } else {
      response.send("No todo found");
    }
  } else if (
    category !== undefined &&
    priority === undefined &&
    status === undefined
  ) {
    const getCateMatchedQuery = `
      SELECT * FROM todo WHERE category = '${category}';`;
    const todoItems = await database.all(getCateMatchedQuery);
    if (todoItems.length >= 1) {
      response.send(
        todoItems.map((each) =>
          convertRequestTodosObjectToResponseTodoObject(each)
        )
      );
    } else {
      response.send("No todo Item found");
    }
  } else if (category !== undefined && priority !== undefined) {
    const getCateAndPrioMatchedQuery = `SELECT * FROM todo WHERE category = '${category} AND priority ='${priority}';`;
    const todoItems = await database.all(getCateAndPrioMatchedQuery);
    if (todoItems.length >= 1) {
      response.send(
        todoItems.map((each) =>
          convertRequestTodosObjectToResponseTodoObject(each)
        )
      );
    } else {
      response.send("No todo found");
    }
  }
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodo = `SELECT * FROM todo WHERE id = '${todoId}';`;
  const todoItems = await database.all(getSpecificTodo);
  if (todoItems.length >= 1) {
    response.send(
      todoItems.map((each) =>
        convertRequestTodosObjectToResponseTodoObject(each)
      )
    );
  } else {
    response.send("No todo found");
  }
});

app.get("/agenda", async (request, response) => {
  let { date } = request.query;
  date = parseISO(date);
  if (isValid(date)) {
    const date1 = format(new Date(date), "yyyy-MM-dd");
    const getSelectedDateQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  due_date = ${date1};`;

    const todoItems = await database.all(getSelectedDateQuery);
    if (todoItems !== undefined) {
      response.send(
        todoItems.map((each) =>
          convertRequestTodosObjectToResponseTodoObject(each)
        )
      );
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
    INSERT INTO 
    todo (id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}',${dueDate});`;
  const todoItem = await database.run(postTodoQuery);
  if (todoItem.lastID !== undefined) {
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  if (status !== undefined) {
    const getUpdateStatusQuery = `
        UPDATE 
        todo
        SET 
        status = '${status}'
        WHERE 
        id = ${todoId};`;

    const todoItem = await database.run(getUpdateStatusQuery);
    response.send("Status Updated");
  } else if (priority !== undefined) {
    const getUpdateStatusQuery = `
        UPDATE 
        todo
        SET 
        priority = '${priority}'
        WHERE 
        id = ${todoId};`;

    const todoItem = await database.run(getUpdateStatusQuery);
    response.send("Priority Updated");
  } else if (category !== undefined) {
    const getUpdateStatusQuery = `
        UPDATE 
        todo
        SET 
        category = '${category}'
        WHERE 
        id = ${todoId};`;

    const todoItem = await database.run(getUpdateStatusQuery);
    response.send("Category Updated");
  } else if (dueDate !== undefined) {
    const getUpdateStatusQuery = `
        UPDATE 
        todo
        SET 
        due_date = '${dueDate}'
        WHERE 
        id = ${todoId};`;

    const todoItem = await database.run(getUpdateStatusQuery);
    response.send("Due Date Updated");
  } else if (todo !== undefined) {
    const getUpdateStatusQuery = `
        UPDATE 
        todo
        SET 
        todo = '${todo}'
        WHERE 
        id = ${todoId};`;

    const todoItem = await database.run(getUpdateStatusQuery);
    response.send("Todo Updated");
  }
});

app.delete("todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getDeleteQuery = `
    DELETE FROM
    todo
    WHERE
    id = ${todId};`;
  await database.run(getDeleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
