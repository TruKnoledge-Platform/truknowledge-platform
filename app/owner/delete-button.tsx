"use client";

import { deletePerson } from "../actions";

export default function DeleteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form
      action={deletePerson}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Delete ${label}? This removes them from the people list. You cannot undo this.`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-red-400/60 px-4 py-1.5 text-sm text-red-300 hover:bg-red-950/40"
      >
        Delete
      </button>
    </form>
  );
}