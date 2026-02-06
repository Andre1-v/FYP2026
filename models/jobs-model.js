const model = {};

model.table = "Jobs";
model.mutableFields = [
  "JobTitle",
  "JobDueDateTime",
  "JobDescription",
  "JobTicketID",
  "JobJobTypeID",
  "JobFrequencyID",
  "JobStatusID",
];
model.idField = "JobID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable =
    "Jobs LEFT JOIN Tickets ON JobTicketID=TicketID LEFT JOIN JobTypes ON JobJobTypeID=JobTypeID LEFT JOIN Statuses ON Jobs.JobStatusID = Statuses.StatusID LEFT JOIN JobFrequencies ON Jobs.JobFrequencyID = JobFrequencies.JobFrequencyID";
  const resolvedFields = [
    "Jobs.JobID",
    "Jobs.JobTitle",
    "Jobs.JobDueDateTime",
    "Jobs.JobDescription",
    "Jobs.JobTicketID",
    "Jobs.JobJobTypeID",
    "Jobs.JobFrequencyID",
    "Jobs.JobStatusID",
    "Statuses.StatusName AS JobStatus",
    "JobFrequencies.JobFrequencyName AS JobFrequency",
    "Tickets.TicketTitle AS JobTicketTitle",
    "JobTypes.JobTypeName AS JobJobTypeName",
    "Jobs.JobCreatedAt",
  ];
  let sql = "";

  switch (variant) {
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE Jobs.JobID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
