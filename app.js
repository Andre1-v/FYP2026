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

// Controllers -----------------------------

// SQL prepared statement builders

const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    " SET "
  );

// --- Offices ---
const buildOfficesReadQuery = (id, variant) => {
  let table = "Offices";
  let fields = [
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
  let sql = "";

  switch (variant) {
    case "active":
      sql = `SELECT ${fields} FROM ${table} WHERE IsActive = 1`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE OfficeID = :ID`;
  }
  return { sql, data: { ID: id } };
};

const buildOfficesCreateQuery = (record) => {
  let table = "Offices";
  let mutableFields = [
    "OfficeName",
    "AddressLine1",
    "AddressLine2",
    "City",
    "County",
    "Postcode",
    "MaxOccupancy",
    "IsActive",
  ];
  const sql = `INSERT INTO ${table}` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildOfficesUpdateQuery = (record, id) => {
  let table = "Offices";
  let mutableFields = [
    "OfficeName",
    "AddressLine1",
    "AddressLine2",
    "City",
    "County",
    "Postcode",
    "MaxOccupancy",
    "IsActive",
  ];
  const sql =
    `UPDATE ${table}` +
    buildSetFields(mutableFields) +
    ` WHERE OfficeID = :OfficeID`;
  return { sql, data: { ...record, OfficeID: id } };
};

const buildOfficesDeleteQuery = (id) => {
  let table = "Offices";
  const sql = `DELETE FROM ${table} WHERE OfficeID = :OfficeID`;
  return { sql, data: { OfficeID: id } };
};

// --- Jobs ---
const buildJobsReadQuery = (id, variant) => {
  let table =
    "Jobs LEFT JOIN Tickets ON JobTicketID=TicketID LEFT JOIN JobTypes ON JobJobTypeID=JobTypeID";
  let fields = [
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
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE JobID=:ID`;
  }
  return { sql, data: { ID: id } };
};

const buildJobsCreateQuery = (record) => {
  let table = "Jobs";
  let mutablefields = [
    "JobID",
    "JobTitle",
    "JobDescription",
    "JobTicketsID",
    "JobJobTypeID",
    "JobStatus",
  ];
  const sql = `INSERT INTO ${table}` + buildSetFields(mutablefields);
  return { sql, data: record };
};

// --- Users ---
const buildUsersReadQuery = (id, variant) => {
  let table = "Users LEFT JOIN UserTypes ON UserUserTypeID=UserTypeID";
  let fields = [
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
  let sql = "";

  const CLIENT = 1;
  const DISPATCHER = 2;
  const TRADESPERSON = 3;
  const ADMINISTRATOR = 4;

  switch (variant) {
    case "client":
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${CLIENT}`;
      break;
    case "dispatcher":
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${DISPATCHER}`;
      break;
    case "tradesperson":
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${TRADESPERSON}`;
      break;
    case "administrator":
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID= ${ADMINISTRATOR}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE UserID=:ID`;
  }
  return { sql, data: { ID: id } };
};

// --- Tickets ---
const buildTicketsReadQuery = (id, variant) => {
  let table = `
    Tickets
    LEFT JOIN Users ON Tickets.TicketRequestedByUserID = Users.UserID
    LEFT JOIN Offices ON Tickets.TicketOfficeLocationID = Offices.OfficeID
  `;
  let fields = [
    "TicketID",
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
    `CONCAT(Users.UserFirstName, " ", Users.UserMiddleName, " ", Users.UserLastName) AS TicketRequestedByUserName`,
    "Offices.OfficeName AS TicketOfficeName",
    "Offices.AddressLine1 AS TicketOfficeAddress1",
    "Offices.AddressLine2 AS TicketOfficeAddress2",
    "Offices.City AS TicketOfficeCity",
    "Offices.County AS TicketOfficeCounty",
    "Offices.Postcode AS TicketOfficePostcode",
    "TicketCreatedAt",
  ];
  let sql = "";

  switch (variant) {
    case "user":
      sql = `SELECT ${fields} FROM ${table} WHERE TicketRequestedByUserID = :ID`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE TicketID = :ID`;
  }
  return { sql, data: { ID: id } };
};

const buildTicketsCreateQuery = (record) => {
  let table = "Tickets";
  let mutablefields = [
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
  ];
  const sql = `INSERT INTO ${table}` + buildSetFields(mutablefields);
  return { sql, data: record };
};

const buildTicketsUpdateQuery = (record, id) => {
  let table = "Tickets";
  let mutablefields = [
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
  ];
  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutablefields) +
    ` WHERE TicketID=:TicketID`;
  return { sql, data: { ...record, TicketID: id } };
};

const buildTicketsDeleteQuery = (id) => {
  let table = "Tickets";
  const sql = `DELETE FROM ${table} WHERE TicketID=:TicketID`;
  return { sql, data: { TicketID: id } };
};

// --- Assignments ---
const buildAssignmentsReadQuery = (id, variant) => {
  let table =
    "Assignments LEFT JOIN Users ON Assignments.AssignmentUserID=Users.UserID LEFT JOIN Jobs ON Assignments.AssignmentJobID=Jobs.JobID";
  let fields = [
    "AssignmentID",
    "AssignmentJobID",
    "AssignmentUserID",
    "AssignmentStatus",
    "AssignmentDateCreated",
    'CONCAT(UserFirstName," ",UserMiddleName," ",UserLastName) AS AssignmentUserName',
    "Jobs.JobTitle AS AssignmentJobTitle",
    "Jobs.JobDescription AS AssignmentJobDescription",
  ];
  let sql = "";

  switch (variant) {
    case "user":
      sql = `SELECT ${fields} FROM ${table} WHERE AssignmentUserID= :ID`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE AssignmentID=:ID`;
  }
  return { sql, data: { ID: id } };
};

const buildAssignmentsCreateQuery = (record) => {
  let table = "Assignments";
  let mutablefields = [
    "AssignmentJobID",
    "AssignmentUserID",
    "AssignmentStatus",
  ];
  const sql = `INSERT INTO ${table}` + buildSetFields(mutablefields);
  return { sql, data: record };
};

// Data Accessors -----------------------------

const read = async (readQuery) => {
  try {
    const [result] = await database.query(readQuery.sql, readQuery.data);
    return result.length === 0
      ? { isSuccess: false, result: null, message: "No record(s) found" }
      : {
          isSuccess: true,
          result: result,
          message: "Record(s) successfully recovered",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const createOffice = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const recoverQuery = buildOfficesReadQuery(status[0].insertId, null);
    const { isSuccess, result, message } = await read(recoverQuery);

    return isSuccess
      ? { isSuccess: true, result, message: "Office successfully recovered" }
      : { isSuccess: false, result: null, message };
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

const updateOffice = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0)
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update office: no rows affected",
      };

    const recoverQuery = buildOfficesReadQuery(updateQuery.data.OfficeID, null);
    return await read(recoverQuery);
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

const deleteOffice = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? { isSuccess: false, result: null, message: "Office not found" }
      : { isSuccess: true, result: null, message: "Office deleted" };
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

const createJobs = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const recoverQuery = buildJobsReadQuery(status[0].insertId, null);
    const { isSuccess, result, message } = await read(recoverQuery);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
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
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const createTickets = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const recoverQuery = buildTicketsReadQuery(status[0].insertId, null);
    const { isSuccess, result, message } = await read(recoverQuery);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
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
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

const updateTickets = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0)
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };

    const recoverQuery = buildTicketsReadQuery(updateQuery.data.TicketID, null);
    const { isSuccess, result, message } = await read(recoverQuery);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
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

const deleteTickets = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record ${deleteQuery.data.TicketID}`,
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

const createAssignments = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const recoverQuery = buildAssignmentsReadQuery(status[0].insertId, null);
    const { isSuccess, result, message } = await read(recoverQuery);
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

// Controllers ---------------------------------------

const getOfficesController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildOfficesReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const postOfficesController = async (req, res) => {
  const query = buildOfficesCreateQuery(req.body);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createOffice(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(201).json(result);
};

const putOfficesController = async (req, res) => {
  const id = req.params.id;
  const query = buildOfficesUpdateQuery(req.body, id);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateOffice(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(200).json(result);
};

const deleteOfficesController = async (req, res) => {
  const id = req.params.id;
  const query = buildOfficesDeleteQuery(id);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteOffice(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(204).json({ message: accessorMessage });
};

const getJobsController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildJobsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const postJobController = async (req, res) => {
  const query = buildJobsCreateQuery(req.body);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createJobs(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(201).json(result);
};

const getUsersController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildUsersReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const getTicketsController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildTicketsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const postTicketsController = async (req, res) => {
  const query = buildTicketsCreateQuery(req.body);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createTickets(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(201).json(result);
};

const putTicketsController = async (req, res) => {
  const id = req.params.id;
  const query = buildTicketsUpdateQuery(req.body, id);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateTickets(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(200).json(result);
};

const deleteTicketsController = async (req, res) => {
  const id = req.params.id;
  const query = buildTicketsDeleteQuery(id);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteTickets(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(204).json({ message: accessorMessage });
};

const getAssignmentsController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildAssignmentsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const postAssignmentController = async (req, res) => {
  const query = buildAssignmentsCreateQuery(req.body);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createAssignments(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(201).json(result);
};

// Endpoints -----------------------------------------

// Assignments
app.get("/api/assignments", (req, res) =>
  getAssignmentsController(req, res, null)
);
app.get("/api/assignments/users/:id", (req, res) =>
  getAssignmentsController(req, res, "user")
);
app.get("/api/assignments/:id", (req, res) =>
  getAssignmentsController(req, res, null)
);
app.post("/api/assignments", postAssignmentController);

// Users
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
app.get("/api/tickets/users/:id", (req, res) =>
  getTicketsController(req, res, "user")
);
app.get("/api/tickets/:id", (req, res) => getTicketsController(req, res, null));
app.post("/api/tickets", postTicketsController);
app.put("/api/tickets/:id", putTicketsController);
app.delete("/api/tickets/:id", deleteTicketsController);

// Jobs
app.get("/api/jobs", (req, res) => getJobsController(req, res, null));
app.get("/api/jobs/:id", (req, res) => getJobsController(req, res, null));
app.post("/api/jobs", postJobController);

// Offices
app.get("/api/offices", (req, res) => getOfficesController(req, res, null));
app.get("/api/offices/active", (req, res) =>
  getOfficesController(req, res, "active")
);
app.get("/api/offices/:id", (req, res) => getOfficesController(req, res, null));
app.post("/api/offices", postOfficesController);
app.put("/api/offices/:id", putOfficesController);
app.delete("/api/offices/:id", deleteOfficesController);

// Start server --------------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
