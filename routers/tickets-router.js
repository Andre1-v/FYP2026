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

const buildTicketsReadQuery = (id, variant) => {
  let table = `Tickets LEFT JOIN Users ON Tickets.TicketRequestedByUserID = Users.UserID LEFT JOIN Offices ON Tickets.TicketOfficeLocationID = Offices.OfficeID`;
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
      sql = `SELECT ${fields} FROM ${table} WHERE TicketRequestedByUserID=:ID`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE TicketID=:ID`;
  }
  return { sql, data: { ID: id } };
};

const buildTicketsCreateQuery = (record) => {
  let table = "Tickets";
  let mutableFields = [
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
  ];
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildTicketsUpdateQuery = (record, id) => {
  let table = "Tickets";
  let mutableFields = [
    "TicketTitle",
    "TicketDescription",
    "TicketDueDate",
    "TicketOfficeLocationID",
    "TicketRequestedByUserID",
  ];
  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE TicketID=:TicketID`;
  return { sql, data: { ...record, TicketID: id } };
};

const buildTicketsDeleteQuery = (id) => {
  let table = "Tickets";
  const sql = `DELETE FROM ${table} WHERE TicketID=:TicketID`;
  return { sql, data: { TicketID: id } };
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

const createTickets = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const readQuery = buildTicketsReadQuery(status[0].insertId, null);
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

const updateTickets = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);
    if (status[0].affectedRows === 0)
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    const readQuery = buildTicketsReadQuery(updateQuery.data.TicketID, null);
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
      message: `Failed to execute: ${error.message}`,
    };
  }
};

// Controllers -----------------------------------

const getTicketsController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildTicketsReadQuery(id, variant);
  const { isSuccess, result, message } = await read(query);
  if (!isSuccess) return res.status(404).json({ message });
  res.status(200).json(result);
};

const postTicketsController = async (req, res) => {
  const query = buildTicketsCreateQuery(req.body);
  const { isSuccess, result, message } = await createTickets(query);
  if (!isSuccess) return res.status(400).json({ message });
  res.status(201).json(result);
};

const putTicketsController = async (req, res) => {
  const id = req.params.id;
  const query = buildTicketsUpdateQuery(req.body, id);
  const { isSuccess, result, message } = await updateTickets(query);
  if (!isSuccess) return res.status(400).json({ message });
  res.status(200).json(result);
};

const deleteTicketsController = async (req, res) => {
  const id = req.params.id;
  const query = buildTicketsDeleteQuery(id);
  const { isSuccess, message } = await deleteTickets(query);
  if (!isSuccess) return res.status(400).json({ message });
  res.status(204).json({ message });
};

// Endpoints -------------------------------------

router.get("/", (req, res) => getTicketsController(req, res, null));
router.get("/:id", (req, res) => getTicketsController(req, res, null));
router.get("/users/:id", (req, res) => getTicketsController(req, res, "user"));
router.post("/", postTicketsController);
router.put("/:id", putTicketsController);
router.delete("/:id", deleteTicketsController);

export default router;
