import { SAMPLE_DB_ID } from "e2e/support/cypress_data";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import {
  restore,
  visitDashboard,
  filterWidget,
  editDashboard,
  getDashboardCard,
  setFilter,
} from "e2e/support/helpers";

const { PRODUCTS } = SAMPLE_DATABASE;

describe("issue 9299, 16181", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should handle mismatch between filter types (metabase#9299, metabase#16181)", () => {
    const questionDetails = {
      name: "16181",
      native: {
        query: "select count(*) from products where {{filter}}",
        "template-tags": {
          filter: {
            id: "0b004110-d64a-a413-5aa2-5a5314fc8fec",
            name: "filter",
            "display-name": "Native Filter",
            type: "dimension",
            dimension: ["field", PRODUCTS.CATEGORY, null],
            "widget-type": "string/=",
            default: null,
          },
        },
      },
      display: "scalar",
    };

    const matchingFilterType = {
      name: "Text",
      slug: "text",
      id: "d245671f",
      type: "string/=",
      sectionId: "string",
      default: "Gadget",
    };

    const dashboardDetails = {
      parameters: [matchingFilterType],
    };

    cy.createNativeQuestionAndDashboard({
      questionDetails,
      dashboardDetails,
    }).then(({ body: { id, card_id, dashboard_id } }) => {
      cy.request("PUT", `/api/dashboard/${dashboard_id}`, {
        dashcards: [
          {
            id,
            card_id,
            row: 0,
            col: 0,
            size_x: 11,
            size_y: 6,
            parameter_mappings: [
              {
                parameter_id: matchingFilterType.id,
                card_id,
                target: ["dimension", ["template-tag", "filter"]],
              },
            ],
          },
        ],
      });

      visitDashboard(dashboard_id);
      cy.findByTestId("scalar-value").invoke("text").should("eq", "53");

      // Confirm you can't map wrong parameter type the native question's field filter (metabase#16181)
      editDashboard();

      setFilter("ID");

      cy.findByText(/Add a variable to this question/).should("be.visible");

      // Confirm that the correct parameter type is connected to the native question's field filter
      cy.findByText(matchingFilterType.name).find(".Icon-gear").click();

      getDashboardCard().within(() => {
        cy.findByText("Column to filter on");
        cy.findByText("Native Filter");
      });

      // Update the underlying question's query
      cy.request("PUT", `/api/card/${card_id}`, {
        dataset_query: {
          type: "native",
          native: {
            query: "select 1",
            "template-tags": {},
          },
          database: SAMPLE_DB_ID,
        },
      });

      // Upon visiting the dashboard again the filter preserves its value
      visitDashboard(dashboard_id);

      cy.location("search").should("eq", "?text=Gadget");
      filterWidget().contains("Gadget");

      // But the question should display the new value and is not affected by the filter
      cy.findByTestId("scalar-value").invoke("text").should("eq", "1");

      // Confirm that it is not possible to connect filter to the updated question anymore (metabase#9299)
      cy.icon("pencil").click();
      cy.findByText(matchingFilterType.name).find(".Icon-gear").click();
      cy.findByText(
        /A text variable in this card can only be connected to a text filter with Is operator/,
      ).should("be.visible");
    });
  });
});
