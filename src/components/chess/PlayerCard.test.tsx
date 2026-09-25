import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerCard } from "./PlayerCard";

describe("PlayerCard", () => {
  it("shows the player's name in the input", () => {
    render(
      <PlayerCard
        color="white"
        name="Magnus"
        onNameChange={() => {}}
        isTurn={false}
      />
    );

    // getByDisplayValue finds an <input> by its current value
    expect(screen.getByDisplayValue("Magnus")).toBeInTheDocument();
  });

  it('labels the white player as "White (You):"', () => {
    render(
      <PlayerCard
        color="white"
        name="Magnus"
        onNameChange={() => {}}
        isTurn={false}
        isYou
      />
    );

    expect(screen.getByText("White (You):")).toBeInTheDocument();
  });

  it('labels the black player as "Black:"', () => {
    render(
      <PlayerCard
        color="black"
        name="Opponent"
        onNameChange={() => {}}
        isTurn={false}
      />
    );

    expect(screen.getByText("Black:")).toBeInTheDocument();
  });

  it('shows "Your Turn" badge for white when isTurn is true', () => {
    render(
      <PlayerCard
        color="white"
        name="Magnus"
        onNameChange={() => {}}
        isTurn={true}
        isYou
      />
    );

    expect(screen.getByText("Your Turn")).toBeInTheDocument();
  });


  it("shows no turn badge when isTurn is false", () => {
    render(
      <PlayerCard
        color="white"
        name="Magnus"
        onNameChange={() => {}}
        isTurn={false}
      />
    );

    expect(screen.queryByText("Your Turn")).not.toBeInTheDocument();
  });

  it("calls onNameChange when the user types in the input", async () => {
    const handleChange = vi.fn(); // a fake function that records how it was called
    const user = userEvent.setup();

    render(
      <PlayerCard
        color="white"
        name=""
        onNameChange={handleChange}
        isTurn={false}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "A");

    expect(handleChange).toHaveBeenCalledWith("A");
  });
});
