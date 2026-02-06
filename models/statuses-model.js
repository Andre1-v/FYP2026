const model = {};

model.table = "Statuses";
model.mutableFields = ["StatusName"];
model.idField = "StatusID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable = model.table;
  const resolvedFields = [model.idField, ...model.mutableFields];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE StatusID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
