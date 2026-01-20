const model = {};

model.table = "Offices";
model.mutableFields = [
  "OfficeName",
  "AddressLine1",
  "AddressLine2",
  "City",
  "County",
  "Postcode",
  "MaxOccupancy",
  "IsActive",
];
model.idField = "OfficeID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable = model.table;
  const resolvedFields = [model.idField, ...model.mutableFields];
  let sql = "";

  switch (variant) {
    case "active":
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable} WHERE IsActive = 1`;
      break;
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE OfficeID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
