const model = {};

model.table = "Assignments";
model.mutableFields = [
  "AssignmentJobID",
  "AssignmentUserID",
  "AssignmentAssignmentStatusID",
];
model.idField = "AssignmentID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable =
    "Assignments LEFT JOIN Users ON Assignments.AssignmentUserID=Users.UserID LEFT JOIN Jobs ON Assignments.AssignmentJobID=Jobs.JobID LEFT JOIN AssignmentStatuses ON Assignments.AssignmentAssignmentStatusID = AssignmentStatuses.AssignmentStatusID LEFT JOIN Statuses ON Jobs.JobStatusID = Statuses.StatusID";
  const resolvedFields = [
    model.idField,
    ...model.mutableFields,
    "AssignmentStatuses.AssignmentStatusName AS AssignmentStatus",
    'CONCAT(UserFirstName," ",UserMiddleName," ",UserLastName) AS AssignmentUserName',
    "Jobs.JobTitle AS AssignmentJobTitle",
    "Jobs.JobDescription AS AssignmentJobDescription",
    "Jobs.JobDueDateTime AS AssignmentJobDueDateTime",
    "Statuses.StatusName AS AssignmentJobStatus",
    "AssignmentDateCreated",
  ];
  let sql = "";

  switch (variant) {
    case "user":
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable} WHERE AssignmentUserID=:ID`;
      break;
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE AssignmentID=:ID`;
  }

  return { sql, data: { ID: id } };
};

export default model;
