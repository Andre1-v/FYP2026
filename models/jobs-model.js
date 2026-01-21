const model = {};

model.table = "Jobs";
model.mutableFields = [
  "JobTitle",
  "JobDueDateTime",
  "JobDescription",
  "JobTicketID",
  "JobJobTypeID",
  "JobStatus",
];
model.idField = "JobID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable =
    "Jobs LEFT JOIN Tickets ON JobTicketID=TicketID LEFT JOIN JobTypes ON JobJobTypeID=JobTypeID";
  const resolvedFields = [
    model.idField,
    ...model.mutableFields,
    "TicketTitle AS JobTicketTitle",
    "JobTypeName AS JobJobTypeName",
    "JobCreatedAt",
  ];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE JobID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
