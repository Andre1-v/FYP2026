const model = {};

model.table = "AssignmentStatuses";
model.mutableFields = ["AssignmentStatusName"];
model.idField = "AssignmentStatusID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable = model.table;
  const resolvedFields = [model.idField, ...model.mutableFields];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE AssignmentStatusID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
