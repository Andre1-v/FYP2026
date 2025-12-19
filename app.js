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

const createOffice = async (sql, record) => {
  try {
    const [status] = await database.query(sql, record);

    const recoverSql = buildOfficesSelectSql(status.insertId, null);
    const { isSuccess, result, message } = await read(recoverSql);

    return isSuccess
      ? { isSuccess: true, result, message: "Office successfully recovered" }
      : { isSuccess: false, result: null, message };
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

const updateOffice = async (sql, id, record) => {
  try {
    const [status] = await database.query(sql, { ...record, OfficeID: id });

    if (status.affectedRows === 0)
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update office: no rows affected",
      };

    const recoverSql = buildOfficesSelectSql(id, null);
    return await read(recoverSql);
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

const deleteOffice = async (sql, id) => {
  try {
    const [status] = await database.query(sql, { OfficeID: id });

    return status.affectedRows === 0
      ? { isSuccess: false, result: null, message: "Office not found" }
      : { isSuccess: true, result: null, message: "Office deleted" };
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

const updateTickets = async (sql, id, record) => {
  try {
    const status = await database.query(sql, { ...record, TicketID: id });

    if (status[0].affectedRows === 0)
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };

    const recoverRecordSql = buildTicketsSelectSql(id, null);
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
          message: `Failed to recover the updated record: ${message}`,
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const createTickets = async (sql, record) => {
  try {
    const status = await database.query(sql, record);

    const recoverRecordSql = buildTicketsSelectSql(status[0].insertId, null);
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
const buildOfficesSelectSql = (id, variant) => {
  let sql = "";
  const table = "Offices";
  const fields = [
    "OfficeID",
    "OfficeName",
    "AddressLine1",
    "AddressLine2",
    "City",
    "County",
    "Postcode",
    "MaxOccupancy",
    "IsActive",
  ];

  switch (variant) {
    case "active":
      sql = `SELECT ${fields} FROM ${table} WHERE IsActive = 1`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE OfficeID = ${id}`;
  }

  return sql;
};

const buildOfficesInsertSql = () => {
  const table = "Offices";
  const mutableFields = [
    "OfficeName",
    "AddressLine1",
    "AddressLine2",
    "City",
    "County",
    "Postcode",
    "MaxOccupancy",
    "IsActive",
  ];

  return `INSERT INTO ${table}` + buildSetFields(mutableFields);
};

const buildOfficesUpdateSql = () => {
  const table = "Offices";
  const mutableFields = [
    "OfficeName",
    "AddressLine1",
    "AddressLine2",
    "City",
    "County",
    "Postcode",
    "MaxOccupancy",
    "IsActive",
  ];

  return (
    `UPDATE ${table}` +
    buildSetFields(mutableFields) +
    ` WHERE OfficeID = :OfficeID`
  );
};

const buildOfficesDeleteSql = () => {
  return `DELETE FROM Offices WHERE OfficeID = :OfficeID`;
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
  ];
  return `INSERT INTO ${table}` + buildSetFields(mutablefields);
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

const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index < fields.length - 1 ? ", " : " "),
    " SET "
  );

const buildTicketsDeleteSql = () => {
  let table = "Tickets";
  return `DELETE FROM ${table} WHERE TicketID=:TicketID`;
};

const deleteTickets = async (sql, id) => {
  try {
    const status = await database.query(sql, { TicketID: id });

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record ${id}`,
        }
      : {
          isSuccess: true,
          result: null,
          message: "Record successfully deleted",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const buildTicketsUpdateSql = () => {
  const table = `
    Tickets
  `;
  const mutablefields = [
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
  ];
  return (
    `UPDATE ${table} ` +
    buildSetFields(mutablefields) +
    ` WHERE TicketID=:TicketID`
  );
};

const buildTicketsInsertSql = () => {
  const table = `
    Tickets
  `;
  const mutablefields = [
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
  ];
  return `INSERT INTO ${table}` + buildSetFields(mutablefields);
};

const buildTicketsSelectSql = (id, variant) => {
  let sql = "";

  const table = `
    Tickets
    LEFT JOIN Users ON Tickets.TicketRequestedByUserID = Users.UserID
    LEFT JOIN Offices ON Tickets.TicketOfficeLocationID = Offices.OfficeID
  `;

  const fields = [
    "TicketID",
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
    `CONCAT(Users.UserFirstName, " ", Users.UserMiddleName, " ", Users.UserLastName)
      AS TicketRequestedByUserName`,
    "Offices.OfficeName AS TicketOfficeName",
    "Offices.AddressLine1 AS TicketOfficeAddress1",
    "Offices.AddressLine2 AS TicketOfficeAddress2",
    "Offices.City AS TicketOfficeCity",
    "Offices.County AS TicketOfficeCounty",
    "Offices.Postcode AS TicketOfficePostcode",
    "TicketCreatedAt",
  ];

  switch (variant) {
    case "user":
      sql = `SELECT ${fields} FROM ${table} WHERE TicketRequestedByUserID = ${id}`;
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
    "AssignmentUserID",
    "AssignmentStatus",
    "AssignmentDateCreated",
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
    "AssignmentJobID",
    "AssignmentUserID",
    "AssignmentStatus",
  ];
  return `INSERT INTO ${table}` + buildSetFields(mutablefields);
};

const getTicketsController = async (req, res, variant) => {
  const id = req.params.id;

  const sql = buildTicketsSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);

  if (!isSuccess) return res.status(400).json(message);

  res.status(200).json(result);
};

const postTicketsController = async (req, res) => {
  // Validate request

  //Access data
  const sql = buildTicketsInsertSql();
  const { isSuccess, result, message } = await createTickets(sql, req.body);

  if (!isSuccess) return res.status(404).json(message);
  //Response to request
  res.status(201).json(result);
};

const putTicketsController = async (req, res) => {
  // Validate request
  const id = req.params.id;
  const record = req.body;

  //Access data
  const sql = buildTicketsUpdateSql();
  const { isSuccess, result, message } = await updateTickets(sql, id, record);
  if (!isSuccess) return res.status(404).json(message);
  //Response to request
  res.status(201).json(result);
};

const deleteTicketsController = async (req, res) => {
  // Validate request
  const id = req.params.id;

  // Access data
  const sql = buildTicketsDeleteSql();
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteTickets(sql, id);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(204).json({ message: accessorMessage });
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
  };

  const sql = buildAssignmentInsertSql(record);
  const { isSuccess, result, message } = await createAssignments(sql, record);

  if (!isSuccess) return res.status(500).json({ message });

  res.status(201).json(result);
};

const getOfficesController = async (req, res, variant) => {
  const id = req.params.id;

  const sql = buildOfficesSelectSql(id, variant);
  const { isSuccess, result, message } = await read(sql);

  if (!isSuccess) return res.status(400).json(message);
  res.status(200).json(result);
};

const postOfficesController = async (req, res) => {
  const sql = buildOfficesInsertSql();
  const { isSuccess, result, message } = await createOffice(sql, req.body);

  if (!isSuccess) return res.status(500).json({ message });
  res.status(201).json(result);
};

const putOfficesController = async (req, res) => {
  const id = req.params.id;
  const sql = buildOfficesUpdateSql();

  const { isSuccess, result, message } = await updateOffice(sql, id, req.body);

  if (!isSuccess) return res.status(404).json({ message });
  res.status(200).json(result);
};

const deleteOfficesController = async (req, res) => {
  const id = req.params.id;
  const sql = buildOfficesDeleteSql();

  const { isSuccess, message } = await deleteOffice(sql, id);

  if (!isSuccess) return res.status(400).json({ message });
  res.status(204).json();
};

// Endpoints -----------------------------------------

//Assignments
app.get("/api/assignments", (req, res) =>
  getAssignmentsController(req, res, null)
);
app.get("/api/assignments/:id", (req, res) =>
  getAssignmentsController(req, res, null)
);
app.get("/api/assignments/users/:id", (req, res) =>
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
app.get("/api/tickets/users/:id", (req, res) =>
  getTicketsController(req, res, "user")
);

app.post("/api/tickets", postTicketsController);

app.put("/api/tickets/:id", putTicketsController);

app.delete("/api/tickets/:id", deleteTicketsController);

// Jobs
app.get("/api/jobs", (req, res) => getJobsController(req, res, null));
app.get("/api/jobs/:id", (req, res) => getJobsController(req, res, null));

app.post("/api/jobs", postJobController);

// Offices
app.get("/api/offices", (req, res) => getOfficesController(req, res, null));

app.get("/api/offices/:id", (req, res) => getOfficesController(req, res, null));

app.get("/api/offices/active", (req, res) =>
  getOfficesController(req, res, "active")
);

app.post("/api/offices", postOfficesController);

app.put("/api/offices/:id", putOfficesController);

app.delete("/api/offices/:id", deleteOfficesController);

// Start server --------------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
