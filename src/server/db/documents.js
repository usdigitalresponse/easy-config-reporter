const knex = require("./connection");
const _ = require("lodash");
const { currentReportingPeriod } = require("./settings");
function documents() {
  return knex("documents").select("*");
}

function documentsInCurrentReportingPeriod() {
  return currentReportingPeriod().then(reportingPeriod => {
    console.log(`reporting period is ${reportingPeriod.start_date} to ${reportingPeriod.end_date}`);
    // TODO!
    // we really need to do periods 1 and 2 together for now ...
    // so best way is to fix the start and end dates reported by
    // currentReportingPeriod()
    return knex("documents").select("*");
  });
}

function documentsOfType(type) {
  return knex("documents")
    .select("*")
    .where("type", type);
}

function documentsForAgency(agency_id) {
  return knex("documents")
    .select("*")
    .join("users", { "documents.user_id": "users.id" })
    .where("users.agency_id", agency_id);
}

function createDocument(document) {
  return knex
    .insert(document)
    .into("documents")
    .returning("id")
    .then(id => {
      const result = {
        ...document,
        id: id[0]
      };
      return result;
    });
}

function createDocuments(documents, queryBuilder = knex) {
  return queryBuilder.insert(documents).into("documents");
}

async function deleteDocuments({ agencyCode, projectId, reportingDate }) {
  const uploads = await knex("uploads")
    .select("id")
    .where("filename", "like", `${agencyCode}-${projectId}-${reportingDate}-%`);
  const uploadIds = _.map(uploads, "id");
  const delResult = await knex("documents")
    .del()
    .whereIn("upload_id", uploadIds);
  return delResult;
}

module.exports = {
  createDocument,
  createDocuments,
  deleteDocuments,
  documents,
  documentsInCurrentReportingPeriod,
  documentsForAgency,
  documentsOfType
};
