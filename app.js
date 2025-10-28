// Imports -------------------------------------------
import express from "express";
import cors from "cors";
import database from "./database.js";

// Configure express app -----------------------------
const app = new express();

// Configure middleware ------------------------------

app.use(function (req, res, next) {
  res.header("Acess-Control-Allow-Origin", "*");
  res.header(
    "Acess-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(cors({ origin: "*" }));

// Controllers ---------------------------------------

const read = async (selectSql) => {
  try {
    const [result] = await database.query(selectSql);
    return result.length === 0
      ? { isSuccess: false, result: null, message: "No record(s) found" }
      : {
          isSuccess: true,
          result: result,
          message: "Record(s) successfully recovered ",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execude query: ${error.message}`,
    };
  }
};

const buildUsersSelectSql = (id, variant) => {
  let sql = "";
  let table = "Users LEFT JOIN UserTypes ON UserUserTypeID=UserTypeID";
  const fields = [
    "UserID",
    "UserFirstName",
    "UserMiddleName",
    "UserLastName",
    'CONCAT(UserFirstName," ",UserMiddleName," ",UserLastName) AS FullName',
    "UserEmail",
    "UserPassword",
    "UserUserTypeID",
    "UserTypeName AS UserUserTypeName",
  ];

  switch (variant) {
    case "client":
      const CLIENT = 1;
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${CLIENT}`;
      break;
    case "dispatcher":
      const DISPATCHER = 2;
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${DISPATCHER}`;
      break;
    case "tradesperson":
      const TRADESPERSON = 3;
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${TRADESPERSON}`;
      break;
    case "administrator":
      const ADMINISTRATOR = 4;
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${ADMINISTRATOR}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE UserID=${id}`;
  }
  return sql;
};

const buildAssigmentsSelectSql = (id, variant) => {
  let sql = "";
  let table =
    "Assignments LEFT JOIN Users ON Assignments.AssignmentUserID=Users.UserID LEFT JOIN Jobs ON Assignments.AssignmentJobID=Jobs.JobID";
  const fields = [
    "AssignmentID",
    "AssignmentJobID",
    "AssignedAt",
    "AssignmentUserID",
    "AssignmentStatus",
    'CONCAT(UserFirstName," ",UserMiddleName," ",UserLastName) AS AssignmentUserName',
    "Jobs.JobTitle AS AssignmentJobTitle",
  ];

  switch (variant) {
    case "user":
      sql = `SELECT ${fields} FROM ${table} WHERE AssignmentUserID= ${id}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE AssignmentID=${id}`;
  }
  return sql;
};

const getUsersController = async (req, res, varient) => {
  const id = req.params.id; // Undefined in the case of /api/users endpoint

  // Validate request

  //Access data
  const sql = buildUsersSelectSql(id, varient);
  const { isSuccess, result, message } = await read(sql);
  if (!isSuccess) return res.stats(404).json(message);

  //Response to request
  res.status(200).json(result);
};

const getAssignmentsController = async (req, res, varient) => {
  const id = req.params.id; // Undefined in the case of /api/assignments endpoint

  // Validate request

  //Access data
  const sql = buildAssigmentsSelectSql(id, varient);
  const { isSuccess, result, message } = await read(sql);
  if (!isSuccess) return res.stats(404).json(message);

  //Response to request
  res.status(200).json(result);
};

// Endpoints -----------------------------------------

//Assignments
app.get("/api/assignments", (req, res) =>
  getAssignmentsController(req, res, null)
);
app.get("/api/assignments/:id", (req, res) =>
  getAssignmentsController(req, res, null)
);
app.get("/api/assignments/user/:id", (req, res) =>
  getAssignmentsController(req, res, "user")
);

//Users
app.get("/api/users", (req, res) => getUsersController(req, res, null));
app.get("/api/users/:id", (req, res) => getUsersController(req, res, null));
app.get("/api/users/client", (req, res) =>
  getUsersController(req, res, "client")
);
app.get("/api/users/dispatcher", (req, res) =>
  getUsersController(req, res, "dispatcher")
);
app.get("/api/users/tradesperson", (req, res) =>
  getUsersController(req, res, "tradesperson")
);
app.get("/api/users/administrator", (req, res) =>
  getUsersController(req, res, "administrator")
);
// Start server --------------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
