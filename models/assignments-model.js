const model = {};

model.table = "Assignments";
model.mutableFields = [
  "AssignmentJobID",
  "AssignmentUserID",
  "AssignmentStatus",
];
model.idField = "AssignmentID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable =
    "Assignments LEFT JOIN Users ON Assignments.AssignmentUserID=Users.UserID LEFT JOIN Jobs ON Assignments.AssignmentJobID=Jobs.JobID";
  const resolvedFields = [
    model.idField,
    ...model.mutableFields,
    'CONCAT(UserFirstName," ",UserMiddleName," ",UserLastName) AS AssignmentUserName',
    "Jobs.JobTitle AS AssignmentJobTitle",
    "Jobs.JobDescription AS AssignmentJobDescription",
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
