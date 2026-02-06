const model = {};

model.table = "JobFrequencies";
model.mutableFields = ["JobFrequencyName"];
model.idField = "JobFrequencyID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable = model.table;
  const resolvedFields = [model.idField, ...model.mutableFields];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE JobFrequencyID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
