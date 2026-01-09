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
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID=${CLIENT}`;
      break;
    case "dispatcher":
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID=${DISPATCHER}`;
      break;
    case "tradesperson":
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID=${TRADESPERSON}`;
      break;
    case "administrator":
      sql = `SELECT ${fields} FROM ${table} WHERE UserTypeID=${ADMINISTRATOR}`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE UserID=:ID`;
  }
  return { sql, data: { ID: id } };
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

// Controllers -----------------------------------

const getUsersController = async (req, res, variant) => {
  const id = req.params.id;
  const query = buildUsersReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });
  res.status(200).json(result);
};

// Endpoints -------------------------------------

router.get("/", (req, res) => getUsersController(req, res, null));
router.get("/client", (req, res) => getUsersController(req, res, "client"));
router.get("/dispatcher", (req, res) =>
  getUsersController(req, res, "dispatcher")
);
router.get("/tradesperson", (req, res) =>
  getUsersController(req, res, "tradesperson")
);
router.get("/administrator", (req, res) =>
  getUsersController(req, res, "administrator")
);
router.get("/:id", (req, res) => getUsersController(req, res, null));

export default router;
