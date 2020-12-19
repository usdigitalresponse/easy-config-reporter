const { ValidationItem } = require("../lib/validation-log");
const { agencyByCode, projectByCode } = require("../db");
const { currentReportingPeriodSettings } = require("../db/settings");
const { format } = require("date-fns");

const parseFilename = async filename => {
  // console.log(`filename is ${filename}`);
  const currentPeriod = await currentReportingPeriodSettings();
  // console.dir(currentPeriod);
  const endDate = (currentPeriod || {}).end_date;
  // console.log(`endDate is ${endDate}`);
  const expectedEndReportDate = format(endDate, "MMddyyyy");
  const valog = [];
  const [, name, ext] = filename.match(/^(.*)\.([^.]+)$/) || [];
  if (ext !== "xlsx") {
    valog.push(
      new ValidationItem({
        message: `Uploaded file must have ".xlsx" extension`
      })
    );
  }
  const nameParts = (name || "").split("-");

  if (nameParts.length < 4) {
    valog.push(
      new ValidationItem({
        message: `Uploaded file name must match pattern
      <agency abbrev>-<project id>-<reporting due date>-<optional-desc>-v<version number>.xlsx
      Example: EOH-013-${expectedEndReportDate}-v1.xlsx
      `
      })
    );
  }

  const agencyCode = nameParts.shift();

  if (!agencyCode) {
    valog.push(
      new ValidationItem({
        message: `First part of file name must be an agency code.`
      })
    );
  } else {
    const result = await agencyByCode(agencyCode);
    if (result.length < 1) {
      valog.push(
        new ValidationItem({
          message: `The agency code "${agencyCode}" in the filename is not valid.`
        })
      );
    }
  }
  const projectId = nameParts.shift();

  if (!projectId) {
    valog.push(
      new ValidationItem({
        message: `Second part of file name must be a project id.`
      })
    );
  } else {
    const project = await projectByCode(projectId);
    if (project.length < 1) {
      valog.push(
        new ValidationItem({
          message: `The project id "${projectId}" in the filename is not valid.`
        })
      );
    }
  }

  if (!endDate) throw new Error(`Error finding current reporting period`);
  const shortExpectedEndReportDate = format(endDate, "MMddyy");
  const reportingDate = nameParts.shift() || "";
  if (
    reportingDate !== expectedEndReportDate &&
    reportingDate !== shortExpectedEndReportDate
  ) {
    valog.push(
      new ValidationItem({
        message: `The reporting period end date in the filename is "${reportingDate}" but should be "${expectedEndReportDate}" or "${shortExpectedEndReportDate}"`
      })
    );
  }

  const version_str = ((nameParts.pop() || "").match(/^v(\d+)$/) || [])[1];
  const version = parseInt(version_str, 10);
  if (!version) {
    valog.push(
      new ValidationItem({
        message: `Filename is missing the version number`
      })
    );
  }

  return { agencyCode, projectId, reportingDate, version, valog };
};

module.exports = {
  parseFilename
};
