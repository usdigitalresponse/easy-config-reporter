const {
  dateIsInReportingPeriod,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isSum,
  isValidDate,
  isValidSubrecipient,
  matchesFilePart,
  numberIsLessThanOrEqual,
  numberIsGreaterThanOrEqual,
  validateFields,
  validateDocuments,
  whenBlank
} = requireSrc(__filename);
const expect = require("chai").expect;

describe("validation helpers", () => {
  const validateContext = {
    fileParts: {
      projectId: "DOH"
    },
    subrecipientsHash: {
      "1010": {
        name: "Payee"
      }
    },
    reportingPeriod: {
      startDate: "2020-03-01",
      endDate: "2020-12-30"
    }
  };
  const testCases = [
    ["blank string", isNotBlank(""), false],
    ["non blank string", isNotBlank("Test"), true],
    ["number", isNumber(1), true],
    ["non number", isNumber("Test"), false],
    ["positive number", isPositiveNumber(100), true],
    ["non positive number", isPositiveNumber(-100), false],
    ["valid date", isValidDate("2020-10-03"), true],
    ["invalid date", isValidDate("2020-15-99"), false],
    [
      "file part matches",
      matchesFilePart("projectId")("DOH", {}, validateContext),
      true
    ],
    [
      "file part does not match",
      matchesFilePart("projectId")("OMB", {}, validateContext),
      false
    ],
    [
      "valid subrecipient",
      isValidSubrecipient("1010", {}, validateContext),
      true
    ],
    [
      "invalid subrecipient",
      isValidSubrecipient("1020", {}, validateContext),
      false
    ],
    [
      "sum is correct",
      isSum(["amount1", "amount2"])(
        100.0,
        { amount1: 40.0, amount2: 60.0 },
        validateContext
      ),
      true
    ],
    [
      "sum is not correct",
      isSum(["amount1", "amount2"])(
        90.0,
        { amount1: 40.0, amount2: 60.0 },
        validateContext
      ),
      false
    ],
    [
      "sum convert strings to float",
      isSum(["amount1", "amount2"])(
        "100.0",
        { amount1: "40.0", amount2: "60.0" },
        validateContext
      ),
      true
    ],
    [
      "number is less than or equal",
      numberIsLessThanOrEqual("total")(100, { total: 200 }, validateContext),
      true
    ],
    [
      "number is not less than or equal",
      numberIsLessThanOrEqual("total")(500, { total: 200 }, validateContext),
      false
    ],
    [
      "number is greater than or equal",
      numberIsGreaterThanOrEqual("total")(
        1000,
        { total: 200 },
        validateContext
      ),
      true
    ],
    [
      "number is not greater than or equal",
      numberIsGreaterThanOrEqual("total")(50, { total: 200 }, validateContext),
      false
    ],
    [
      "date is in reporting period",
      dateIsInReportingPeriod(43929, {}, validateContext),
      true
    ],
    [
      "date is before reporting period",
      dateIsInReportingPeriod(43800, {}, validateContext),
      false
    ],
    [
      "date is after reporting period",
      dateIsInReportingPeriod(44197, {}, validateContext),
      false
    ],
    [
      "conditional validation passes",
      whenBlank("duns number", isNotBlank)("123", { "duns number": "" }, validateContext),
      true
    ],
    [
      "conditional validation fails",
      whenBlank("duns number", isNotBlank)("", { "duns number": "" }, validateContext),
      false
    ],
    [
      "conditional validation ignored",
      whenBlank("duns number", isNotBlank)("", { "duns number": "123" }, validateContext),
      true
    ]
  ];
  testCases.forEach(([name, b, expectedResult]) => {
    it(`${name} should return ${expectedResult}`, () => {
      expect(b).to.equal(expectedResult);
    });
  });
});

describe("validateFields", () => {
  const requiredFields = [
    ["name", isNotBlank],
    ["date", isValidDate],
    ["description", isNotBlank, "Description is required"]
  ];
  it("can validate a document", () => {
    const content = {
      name: "George",
      date: "2020-10-02",
      description: "testing"
    };
    const r = validateFields(requiredFields, content, "Test", 1);
    expect(r).to.have.length(0);
  });
  it("can report multiple errors, with custom message", () => {
    const content = { name: "", date: "2020-10-02" };
    const r = validateFields(requiredFields, content, "Test", 5);
    expect(r).to.have.length(2);
    expect(r[0].info.message).to.equal('Empty or invalid entry for name: ""');
    expect(r[0].info.tab).to.equal("Test");
    expect(r[0].info.row).to.equal(5);
    expect(r[1].info.message).to.equal('Description is required ""');
    expect(r[1].info.tab).to.equal("Test");
    expect(r[1].info.row).to.equal(5);
  });
});

describe("validateDocuments", () => {
  const documents = [
    { content: { name: "George" } },
    { content: { name: "John" } },
    { content: { name: "Thomas" } },
    { content: { name: "James" } },
    { content: { name: "" } }
  ];
  const validations = [["name", isNotBlank]];
  it("can validate a collection of documents", () => {
    const log = validateDocuments(documents, { tabName: "test", validations }, {});
    expect(log).to.have.length(1);
  });
});
