const model = {};

model.table = "Users";
model.mutableFields = [
  "UserFirstName",
  "UserMiddleName",
  "UserLastName",
  "UserEmail",
  "UserPassword",
  "UserUserTypeID",
];

model.idField = "UserID";

model.buildReadQuery = (id, variant) => {
  const reservedTable =
    "Users LEFT JOIN UserTypes ON UserUserTypeID=UserTypeID";
  const reservedFields = [
    model.idField,
    ...model.mutableFields,
    'CONCAT(UserFirstName," ",UserMiddleName," ",UserLastName) AS FullName',
    "UserTypeName AS UserUserTypeName",
  ];
  let sql = "";

  const CLIENT = 1;
  const DISPATCHER = 2;
  const TRADESPERSON = 3;
  const ADMINISTRATOR = 4;

  switch (variant) {
    case "client":
      sql = `SELECT ${reservedFields} FROM ${reservedTable} WHERE UserTypeID=${CLIENT}`;
      break;
    case "dispatcher":
      sql = `SELECT ${reservedFields} FROM ${reservedTable} WHERE UserTypeID=${DISPATCHER}`;
      break;
    case "tradesperson":
      sql = `SELECT ${reservedFields} FROM ${reservedTable} WHERE UserTypeID=${TRADESPERSON}`;
      break;
    case "administrator":
      sql = `SELECT ${reservedFields} FROM ${reservedTable} WHERE UserTypeID=${ADMINISTRATOR}`;
      break;
    default:
      sql = `SELECT ${reservedFields} FROM ${reservedTable}`;
      if (id) sql += ` WHERE UserID=:ID`;
  }
  return { sql, data: { ID: id } };
};

export default model;
