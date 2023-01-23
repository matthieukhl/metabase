import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { GroupIds, DNType, ValueType } from "./DeleteGroupMappingModal";

import DeleteGroupMappingModal from "./DeleteGroupMappingModal";

type PropTypes = {
  dn?: DNType;
  groupIds?: GroupIds;
  onConfirm?: (value: ValueType, groups: number[], dn: DNType) => void;
  onHide?: () => void;
};

const DEFAULT_PROPS = {
  dn: "cn=People",
  groupIds: [1],
  onConfirm: jest.fn(),
  onHide: jest.fn(),
};

const setup = (props?: PropTypes) => {
  render(<DeleteGroupMappingModal {...DEFAULT_PROPS} {...props} />);
};

describe("DeleteGroupMappingModal", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows options for when mapping is linked to just one group", () => {
    setup();

    expect(
      screen.getByText("Nothing, just remove the mapping"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Also remove all group members (except from Admin)"),
    ).toBeInTheDocument();

    expect(screen.getByText("Also delete the group")).toBeInTheDocument();
  });

  it("shows options for when mapping is linked to more than one group", () => {
    setup({ groupIds: [1, 2] });

    expect(
      screen.getByText("Nothing, just remove the mapping"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Also remove all group members (except from Admin)"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Also delete the groups (except Admin)"),
    ).toBeInTheDocument();
  });

  it("starts with 'Nothing' option checked", () => {
    setup();

    expect(
      screen.getByLabelText("Nothing, just remove the mapping"),
    ).toBeChecked();
  });

  it("confirms when clearing members", () => {
    setup();

    userEvent.click(
      screen.getByLabelText(
        "Also remove all group members (except from Admin)",
      ),
    );

    userEvent.click(
      screen.getByRole("button", { name: "Remove mapping and members" }),
    );

    expect(DEFAULT_PROPS.onConfirm).toHaveBeenCalledWith(
      "clear",
      DEFAULT_PROPS.groupIds,
      DEFAULT_PROPS.dn,
    );
  });

  it("confirms when deleting groups", () => {
    setup();

    userEvent.click(screen.getByLabelText("Also delete the group"));

    userEvent.click(
      screen.getByRole("button", { name: "Remove mapping and delete group" }),
    );

    expect(DEFAULT_PROPS.onConfirm).toHaveBeenCalledWith(
      "delete",
      DEFAULT_PROPS.groupIds,
      DEFAULT_PROPS.dn,
    );
  });
});
