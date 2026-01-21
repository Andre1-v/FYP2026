const model = {};

model.table = "JobTypes";
model.mutableFields = ["JobTypeName", "JobPriority"];
model.idField = "JobTypeID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable = model.table;
  const resolvedFields = [model.idField, ...model.mutableFields];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE JobTypeID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
