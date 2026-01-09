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
      if (id) sql += ` WHERE OfficeID=:ID`;
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
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
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
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE OfficeID=:OfficeID`;
  return { sql, data: { ...record, OfficeID: id } };
};

const buildOfficesDeleteQuery = (id) => {
  let table = "Offices";
  const sql = `DELETE FROM ${table} WHERE OfficeID=:OfficeID`;
  return { sql, data: { OfficeID: id } };
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

const createOffice = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);
    const readQuery = buildOfficesReadQuery(status[0].insertId, null);
    const { isSuccess, result, message } = await read(readQuery);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Office successfully recovered",
        }
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

    const readQuery = buildOfficesReadQuery(updateQuery.data.OfficeID, null);
    return await read(readQuery);
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

// Controllers -----------------------------------

const getOfficesController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildOfficesReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

const postOfficesController = async (req, res) => {
  const record = req.body;
  const query = buildOfficesCreateQuery(record);
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
  const record = req.body;
  const query = buildOfficesUpdateQuery(record, id);
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

// Endpoints -------------------------------------

router.get("/", (req, res) => getOfficesController(req, res, null));
router.get("/active", (req, res) => getOfficesController(req, res, "active"));
router.get("/:id", (req, res) => getOfficesController(req, res, null));

router.post("/", postOfficesController);
router.put("/:id", putOfficesController);
router.delete("/:id", deleteOfficesController);

export default router;
