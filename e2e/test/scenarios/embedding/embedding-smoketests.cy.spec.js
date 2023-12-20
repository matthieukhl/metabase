import {
  restore,
  visitQuestion,
  visitDashboard,
  modal,
  visitIframe,
} from "e2e/support/helpers";
import { METABASE_SECRET_KEY } from "e2e/support/cypress_data";
import {
  ORDERS_QUESTION_ID,
  ORDERS_DASHBOARD_ID,
} from "e2e/support/cypress_sample_instance_data";

const embeddingPage = "/admin/settings/embedding-in-other-applications";
const standalonePath =
  "/admin/settings/embedding-in-other-applications/standalone";
const upgradeUrl = "https://www.metabase.com/upgrade";
const embeddingDescription =
  "Embed dashboards, questions, or the entire Metabase app into your application. Integrate with your server code to create a secure environment, limited to specific users or organizations.";

// These tests will run on both OSS and EE instances. Both without a token!
describe("scenarios > embedding > smoke tests", { tags: "@OSS" }, () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should not offer to share or embed models (metabase#20815)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");

    cy.request("PUT", `/api/card/${ORDERS_QUESTION_ID}`, { dataset: true });

    cy.visit(`/model/${ORDERS_QUESTION_ID}`);
    cy.wait("@dataset");

    cy.findByTestId("view-footer").within(() => {
      cy.icon("download").should("exist");
      cy.icon("bell").should("exist");
      cy.icon("share").should("not.exist");
    });
  });

  context("embedding disabled", () => {
    beforeEach(() => {
      // We enable embedding by default in the default snapshot that all tests are using.
      // That's why we need to disable it here.
      resetEmbedding();
    });

    it("should display the embedding page correctly", () => {
      cy.visit("/admin/settings/setup");
      sidebar().within(() => {
        cy.findByRole("link", { name: "Embedding" }).click();
      });

      cy.location("pathname").should("eq", embeddingPage);
      cy.findByTestId("enable-embedding-setting").within(() => {
        cy.findByText(embeddingDescription);

        cy.findByLabelText("Embedding Enabled").click({ force: true });
      });
      // The URL should stay the same
      cy.location("pathname").should("eq", embeddingPage);

      cy.findByTestId("enable-embedding-setting").within(() => {
        cy.findByRole("checkbox").should("be.checked");
      });

      cy.log(
        "With the embedding enabled, we should now see two new sections on the main page",
      );
      cy.log("The first section: 'Static embedding'");
      cy.findByTestId("-static-embedding-setting").within(() => {
        // FE unit tests are making sure this section doesn't exist when a valid token is provided,
        // so we don't have to do it here usign a conditional logic
        assertLinkMatchesUrl("upgrade to a paid plan", upgradeUrl);

        cy.findByRole("link", { name: "Manage" })
          .should("have.attr", "href")
          .and("eq", standalonePath);
        cy.findByText("Static embedding");
        cy.findByText("Manage").click();
        cy.location("pathname").should("eq", standalonePath);
      });

      cy.log("Standalone embeds page");
      mainPage().within(() => {
        cy.findByTestId("embedding-secret-key-setting").within(() => {
          cy.findByText(/Embedding secret key/i);
          cy.findByText(
            "Standalone Embed Secret Key used to sign JSON Web Tokens for requests to /api/embed endpoints. This lets you create a secure environment limited to specific users or organizations.",
          );
          getTokenValue().should("have.length", 64);
          cy.button("Regenerate key");
        });

        cy.findByTestId("-embedded-dashboards-setting").within(() => {
          cy.findByText(/Embedded dashboards/i);
          cy.findByText("No dashboards have been embedded yet.");
        });

        cy.findByTestId("-embedded-questions-setting").within(() => {
          cy.findByText(/Embedded questions/i);
          cy.findByText("No questions have been embedded yet.");
        });
      });

      cy.go("back");
      cy.location("pathname").should("eq", embeddingPage);

      cy.log("The second section: 'Interactive embedding'");
      cy.findByTestId("-interactive-embedding-setting").within(() => {
        cy.findByText("Interactive embedding");

        cy.findByRole("link", { name: "Learn More" })
          .should("have.attr", "href")
          .and(
            "eq",
            "https://www.metabase.com/product/embedded-analytics?utm_source=product&utm_medium=CTA&utm_campaign=embed-settings-oss-cta",
          );
      });
    });

    it("should not let you embed the question", () => {
      visitQuestion(ORDERS_QUESTION_ID);
      cy.icon("share").click();

      ensureEmbeddingIsDisabled();
    });

    it("should not let you embed the dashboard", () => {
      visitDashboard(ORDERS_DASHBOARD_ID);
      cy.icon("share").click();

      ensureEmbeddingIsDisabled();
    });
  });

  context("embedding enabled", () => {
    const ids = {
      question: ORDERS_QUESTION_ID,
      dashboard: ORDERS_DASHBOARD_ID,
    };
    ["question", "dashboard"].forEach(object => {
      it(
        `should be able to publish/embed and then unpublish a ${object} without filters`,
        { tags: "@flaky" },
        () => {
          const embeddableObject = object === "question" ? "card" : "dashboard";
          const objectName =
            object === "question" ? "Orders" : "Orders in a dashboard";

          cy.intercept("PUT", `/api/${embeddableObject}/${ids[object]}`).as(
            "embedObject",
          );
          cy.intercept("GET", `/api/${embeddableObject}/embeddable`).as(
            "currentlyEmbeddedObject",
          );

          visitAndEnableSharing(object);

          cy.findByTestId("embedding-settings").within(() => {
            cy.findByRole("heading", { name: "Style" });
            cy.findByRole("heading", { name: "Appearance" });
            cy.findByRole("heading", { name: "Font" }).should("not.exist");
            cy.findByRole("heading", { name: "Download data" }).should(
              "not.exist",
            );

            cy.findByText("Parameters");
            cy.findByText(
              /This (question|dashboard) doesn't have any parameters to configure yet./,
            );
            cy.findByText("Parameters");
          });

          cy.findByTestId("embedding-preview").within(() => {
            cy.findByText(
              /You will need to publish this (question|dashboard) before you can embed it in another application./,
            );

            cy.button("Publish").click();
            cy.wait("@embedObject");
          });

          visitIframe();

          cy.findByTestId("embed-frame").within(() => {
            cy.findByRole("heading", { name: objectName });
            cy.get(".cellData").contains("37.65");
          });

          cy.findByRole("contentinfo").within(() => {
            cy.findByRole("link")
              .should("have.text", "Powered by Metabase")
              .and("have.attr", "href")
              .and("eq", "https://metabase.com/");
          });

          cy.log(
            `Make sure the ${object} shows up in the standalone embeds page`,
          );
          cy.signInAsAdmin();
          cy.visit(standalonePath);
          cy.wait("@currentlyEmbeddedObject");

          const sectionTestId = new RegExp(`-embedded-${object}s-setting`);

          cy.findByTestId(sectionTestId)
            .find("tbody tr")
            .should("have.length", 1)
            .and("contain", objectName);

          cy.log(`Unpublish ${object}`);
          visitAndEnableSharing(object);

          cy.findByTestId("embedding-settings").within(() => {
            cy.findByRole("heading", { name: "Danger zone" });
            cy.findByText(`This will disable embedding for this ${object}.`);
            cy.button("Unpublish").click();
            cy.wait("@embedObject");
          });

          visitIframe();
          cy.findByTestId("embed-frame").findByText(
            "Embedding is not enabled for this object.",
          );

          cy.signInAsAdmin();
          cy.visit(standalonePath);
          cy.wait("@currentlyEmbeddedObject");

          mainPage()
            .findAllByText(/No (questions|dashboards) have been embedded yet./)
            .should("have.length", 2);
        },
      );
    });

    it("should regenerate embedding token and invalidate previous embed url", () => {
      cy.request("PUT", `/api/card/${ORDERS_QUESTION_ID}`, {
        enable_embedding: true,
      });
      visitAndEnableSharing("question");

      cy.document().then(doc => {
        const iframe = doc.querySelector("iframe");

        cy.signOut();
        cy.visit(iframe.src);

        cy.findByTestId("embed-frame").contains("37.65");

        cy.signInAsAdmin();
        cy.visit(standalonePath);

        cy.findByLabelText("Embedding secret key").should(
          "have.value",
          METABASE_SECRET_KEY,
        );

        cy.button("Regenerate key").click();

        modal().within(() => {
          cy.intercept("GET", "/api/util/random_token").as("regenerateKey");
          cy.findByRole("heading", { name: "Regenerate embedding key?" });
          cy.findByText(
            "This will cause existing embeds to stop working until they are updated with the new key.",
          );
          cy.findByText("Are you sure you want to do this?");
          cy.button("Yes").click();
        });

        cy.wait("@regenerateKey").then(
          ({
            response: {
              body: { token },
            },
          }) => {
            expect(token).to.have.length(64);
            expect(token).to.not.eq(METABASE_SECRET_KEY);

            cy.findByDisplayValue(token);
          },
        );

        cy.log("Visit the embedding url generated with the old token");
        cy.visit(iframe.src);
        cy.findByTestId("embed-frame").findByText(
          "Message seems corrupt or manipulated",
        );
      });
    });
  });
});

function resetEmbedding() {
  cy.request("PUT", "/api/setting/enable-embedding", { value: false });
  cy.request("PUT", "/api/setting/embedding-secret-key", {
    value: null,
  });
}

function getTokenValue() {
  return cy.get("#setting-embedding-secret-key").invoke("val");
}

function enableSharing() {
  cy.contains("Enable sharing").siblings().click();
}

function assertLinkMatchesUrl(text, url) {
  cy.findByRole("link", { name: text })
    .should("have.attr", "href")
    .and("contain", url);
}

function ensureEmbeddingIsDisabled() {
  // This is implicit assertion - it would've failed if embedding was enabled
  cy.findByText(/Embed in your application/).closest(".disabled");

  // Let's make sure embedding stays disabled after we enable public sharing
  enableSharing();

  cy.findByText(/Embed in your application/).closest(".disabled");
}

function visitAndEnableSharing(object) {
  if (object === "question") {
    visitQuestion(ORDERS_QUESTION_ID);
    cy.icon("share").click();
    cy.findByText(/Embed in your application/).click();
  }

  if (object === "dashboard") {
    visitDashboard(ORDERS_DASHBOARD_ID);

    cy.icon("share").click();
    cy.findByText(/Embed in your application/).click();
  }
}

function sidebar() {
  return cy.get(".AdminList");
}

function mainPage() {
  return sidebar().next();
}
