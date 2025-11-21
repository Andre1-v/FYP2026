// Imports -------------------------------------------
import express from "express";
import cors from "cors";
import database from "./database.js";

// Configure express app -----------------------------
const app = new express();

// Configure middleware ------------------------------

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Controllers ---------------------------------------
const createTickets = async (sql, record) => {
  try {
    const status = await database.query(sql, record);

    const recoverRecordSql = buildTicketSelectSql(status[0].insertId, null);
    const { isSuccess, result, message } = await read(recoverRecordSql);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered ",
        }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover the inserted record: ${message}`,
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execude query: ${error.message}`,
    };
  }
};

const createAssignments = async (sql, record) => {
  try {
    const [status] = await database.query(sql, record);
    const recoverSql = buildAssignmentSelectSql(status.insertId, null);
    const { isSuccess, result, message } = await read(recoverSql);
    return isSuccess
      ? { isSuccess: true, result, message: "Record successfully recovered" }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover: ${message}`,
        };
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

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

const buildJobsSelectSql = (id, variant) => {
  let sql = "";
  let table =
    "Jobs LEFT JOIN Tickets ON JobTicketID=TicketID LEFT JOIN JobTypes ON JobJobTypeID=JobTypeID";
  const fields = [
    "JobID",
    "JobTitle",
    "JobDescription",
    "JobTicketID",
    "JobJobTypeID",
    "JobStatus",
    "JobCreatedAt",
    "TicketTitle AS JobTicketTitle",
    "JobTypeName AS JobJobTypeName",
  ];

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE JobID=${id}`;
  }
  return sql;
};

const buildJobInsertSql = (record) => {
  const table = `
    Jobs
  `;
  const mutablefields = [
    "JobID",
    "JobTitle",
    "JobDescription",
    "JobTicketsID",
    "JobJobTypeID",
    "JobStatus",
    "JobCreatedAt",
  ];
  return `INSERT INTO ${table}` + buildsSetFields(mutablefields);
};

// GET Jobs
const getJobsController = async (req, res, variant) => {
  const id = req.params.id;

  const sql = buildJobsSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);

  if (!isSuccess) return res.status(400).json(message);

  res.status(200).json(result);
};

// POST Jobs
const postJobController = async (req, res) => {
  // Validate request ()

  // Access data
  const sql = buildJobInsertSql(req.body);
  const { isSuccess, result, message } = await createJobs(sql, req.body);

  if (!isSuccess) return res.status(404).json(message);

  // Response to request
  res.status(201).json(result);
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

const buildsSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index < fields.length - 1 ? ", " : " "),
    " SET "
  );

const buildTicketInsertSql = (record) => {
  const table = `
    Tickets
  `;
  const mutablefields = [
    "TicketID",
    "TicketTitle",
    "TicketDescription",
    "TicketOfficeLocationID",
    "RequestedByUserID",
    "CreatedAt",
  ];
  return `INSERT INTO ${table}` + buildsSetFields(mutablefields);
};
const buildTicketSelectSql = (id, variant) => {
  let sql = "";

  const table = `
    Tickets
    LEFT JOIN Users ON Tickets.RequestedByUserID = Users.UserID
    LEFT JOIN Offices ON Tickets.TicketOfficeLocationID = Offices.OfficeID
  `;

  const fields = [
    "TicketID",
    "TicketTitle",
    "TicketDescription",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
    `CONCAT(Users.UserFirstName, " ", Users.UserMiddleName, " ", Users.UserLastName)
      AS RequestedByUserName`,
    "Offices.OfficeName AS TicketOfficeName",
    "Offices.AddressLine1 AS TicketOfficeAddress1",
    "Offices.AddressLine2 AS TicketOfficeAddress2",
    "Offices.City AS TicketOfficeCity",
    "Offices.County AS TicketOfficeCounty",
    "Offices.Postcode AS TicketOfficePostcode",
    "CreatedAt",
  ];

  switch (variant) {
    case "user":
      sql = `SELECT ${fields} FROM ${table} WHERE RequestedByUserID = ${id}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE TicketID = ${id}`;
  }
  return sql;
};

const buildAssignmentSelectSql = (id, variant) => {
  let sql = "";
  let table =
    "Assignments LEFT JOIN Users ON Assignments.AssignmentUserID=Users.UserID LEFT JOIN Jobs ON Assignments.AssignmentJobID=Jobs.JobID";
  const fields = [
    "AssignmentID",
    "AssignmentJobID",
    "AssignmentDateCreated",
    "AssignmentUserID",
    "AssignmentStatus",
    'CONCAT(UserFirstName," ",UserMiddleName," ",UserLastName) AS AssignmentUserName',
    "Jobs.JobTitle AS AssignmentJobTitle",
    "Jobs.JobDescription AS AssignmentJobDescription",
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

const buildAssignmentInsertSql = (record) => {
  const table = `
    Assignments
  `;
  const mutablefields = [
    "AssignmentID",
    "AssignmentJobID",
    "AssignmentDateCreated",
    "AssignmentUserID",
    "AssignmentStatus",
  ];
  return `INSERT INTO ${table}` + buildsSetFields(mutablefields);
};

const getTicketsController = async (req, res, variant) => {
  const id = req.params.id;

  const sql = buildTicketSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);

  if (!isSuccess) return res.status(400).json(message);

  res.status(200).json(result);
};

const postTicketController = async (req, res) => {
  // Validate request

  //Access data
  const sql = buildTicketInsertSql(req.body);
  const { isSuccess, result, message } = await createTickets(sql, req.body);

  if (!isSuccess) return res.status(404).json(message);
  //Response to request
  res.status(201).json(result);
};

const getUsersController = async (req, res, variant) => {
  const id = req.params.id; // Undefined in the case of /api/users endpoint

  // Validate request

  //Access data
  const sql = buildUsersSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);
  if (!isSuccess) return res.status(400).json(message);

  //Response to request
  res.status(200).json(result);
};

const getAssignmentsController = async (req, res, variant) => {
  const id = req.params.id; // Undefined in the case of /api/assignments endpoint
  // Validate request

  //Access data
  const sql = buildAssignmentSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);
  if (!isSuccess) return res.status(400).json(message);

  //Response to request
  res.status(200).json(result);
};

const postAssignmentController = async (req, res) => {
  const record = {
    ...req.body,
    AssignmentDateCreated: new Date(),
  };

  const sql = buildAssignmentInsertSql(record);
  const { isSuccess, result, message } = await createAssignments(sql, record);

  if (!isSuccess) return res.status(500).json({ message });

  res.status(201).json(result);
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

app.post("/api/assignments", postAssignmentController);

//Users
app.get("/api/users", (req, res) => getUsersController(req, res, null));

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

app.get("/api/users/:id", (req, res) => getUsersController(req, res, null));
// Tickets
app.get("/api/tickets", (req, res) => getTicketsController(req, res, null));
app.get("/api/tickets/:id", (req, res) => getTicketsController(req, res, null));
app.get("/api/tickets/user/:id", (req, res) =>
  getTicketsController(req, res, "user")
);

app.post("/api/tickets", postTicketController);

// Jobs
app.get("/api/jobs", (req, res) => getJobsController(req, res, null));
app.get("/api/jobs/:id", (req, res) => getJobsController(req, res, null));

app.post("/api/jobs", postJobController);

// Start server --------------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
