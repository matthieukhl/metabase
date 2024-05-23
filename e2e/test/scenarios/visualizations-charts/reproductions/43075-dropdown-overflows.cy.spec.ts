import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import {
  createQuestion,
  popover,
  restore,
  type StructuredQuestionDetails,
} from "e2e/support/helpers";

const { PRODUCTS, PRODUCTS_ID } = SAMPLE_DATABASE;

const questionDetails: StructuredQuestionDetails = {
  name: "20548",
  query: {
    "source-table": PRODUCTS_ID,
    aggregation: [["count"]],
    breakout: [["field", PRODUCTS.CATEGORY, null]],
  },
};

describe("issue 43075", () => {
  beforeEach(() => {
    cy.viewport(1000, 300);
    cy.intercept("POST", "/api/dataset").as("dataset");

    restore();
    cy.signInAsAdmin();

    createQuestion(questionDetails, { visitQuestion: true });
  });

  it("the breakthrough popover should fit within the window (metabase#43075)", () => {
    cy.get("[data-testid=cell-data]").contains("54").click();
    popover().findByText("Break out by…").click();
    popover().findByText("Category").click();

    cy.window().then(win => {
      expect(win.document.documentElement.scrollHeight).to.be.lte(
        win.document.documentElement.offsetHeight,
      );
    });
  });
});
