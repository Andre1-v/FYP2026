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
  let mutableFields = [
    "JobID",
    "JobTitle",
    "JobDescription",
    "JobTicketsID",
    "JobJobTypeID",
    "JobStatus",
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

const createJobs = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const readQuery = buildJobsReadQuery(status[0].insertId, null);
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
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute: ${error.message}`,
    };
  }
};

// Controllers -----------------------------------

const getJobsController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildJobsReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const postJobController = async (req, res) => {
  const record = req.body;
  const query = buildJobsCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createJobs(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });
  res.status(201).json(result);
};

// Endpoints -------------------------------------

router.get("/", (req, res) => getJobsController(req, res, null));
router.get("/:id", (req, res) => getJobsController(req, res, null));
router.post("/", postJobController);

export default router;
