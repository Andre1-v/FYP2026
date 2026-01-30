const model = {};

model.table = "Tickets";
model.mutableFields = [
  "TicketTitle",
  "TicketDescription",
  "TicketStatus",
  "TicketDueDate",
  "TicketOfficeLocationID",
  "TicketRequestedByUserID",
];
model.idField = "TicketID";

model.buildReadQuery = (id, variant) => {
  const resolvedTable = `Tickets LEFT JOIN Users ON Tickets.TicketRequestedByUserID = Users.UserID LEFT JOIN Offices ON Tickets.TicketOfficeLocationID = Offices.OfficeID`;
  const resolvedFields = [
    model.idField,
    ...model.mutableFields,
    `CONCAT(Users.UserFirstName, " ", Users.UserMiddleName, " ", Users.UserLastName) AS TicketRequestedByUserName`,
    "Offices.OfficeName AS TicketOfficeName",
    "Offices.AddressLine1 AS TicketOfficeAddress1",
    "Offices.AddressLine2 AS TicketOfficeAddress2",
    "Offices.City AS TicketOfficeCity",
    "Offices.County AS TicketOfficeCounty",
    "Offices.Postcode AS TicketOfficePostcode",
    "TicketCreatedAt",
    "TicketStatus",
  ];
  let sql = "";

  switch (variant) {
    case "user":
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable} WHERE TicketRequestedByUserID=:ID`;
      break;
    case "open":
      const tableWithJobs = `Tickets LEFT JOIN Jobs ON Tickets.TicketID = Jobs.JobTicketID LEFT JOIN Users ON Tickets.TicketRequestedByUserID = Users.UserID LEFT JOIN Offices ON Tickets.TicketOfficeLocationID = Offices.OfficeID`;
      sql = `SELECT ${resolvedFields} FROM ${tableWithJobs} WHERE Jobs.JobID IS NULL AND Tickets.TicketStatus='Open' ORDER BY Tickets.TicketDueDate ASC`;
      break;
    default:
      sql = `SELECT ${resolvedFields} FROM ${resolvedTable}`;
      if (id) sql += ` WHERE TicketID=:ID`;
  }
  return { sql, data: { ID: id } };
};

export default model;
