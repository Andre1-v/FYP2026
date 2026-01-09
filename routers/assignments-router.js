import { Router } from "express";
import database from "../database.js";

const router = Router();

// Query builders --------------------------------

const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    "SET "
  );

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
      sql = `SELECT ${fields} FROM ${table} WHERE AssignmentUserID=:ID`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE AssignmentID=:ID`;
  }

  return { sql, data: { ID: id } };
};

const buildAssignmentsCreateQuery = (record) => {
  let table = "Assignments";
  let mutableFields = [
    "AssignmentJobID",
    "AssignmentUserID",
    "AssignmentStatus",
  ];
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

// Data accessors --------------------------------

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

const createAssignments = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const readQuery = buildAssignmentsReadQuery(status[0].insertId, null);
    const { isSuccess, result, message } = await read(readQuery);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
        }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover: ${message}`,
        };
  } catch (error) {
    return { isSuccess: false, result: null, message: error.message };
  }
};

// Controllers -----------------------------------

const getAssignmentsController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildAssignmentsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const postAssignmentController = async (req, res) => {
  const record = req.body;
  const query = buildAssignmentsCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createAssignments(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(201).json(result);
};

// Endpoints -------------------------------------

router.get("/", (req, res) => getAssignmentsController(req, res, null));
router.get("/:id", (req, res) => getAssignmentsController(req, res, null));
router.get("/users/:id", (req, res) =>
  getAssignmentsController(req, res, "user")
);
router.post("/", postAssignmentController);

export default router;
