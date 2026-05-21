"use client";

import { useState, useTransition } from "react";
import { toggleRunItem } from "../../actions";
import { cn } from "@/lib/utils";

export function ChecklistItemRow({
  runId,
  itemId,
  text,
  initialChecked,
}: {
  runId: string;
  itemId: string;
  text: string;
  initialChecked: boolean;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      await toggleRunItem(runId, itemId, next);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
        checked ? "bg-success/10 border-success" : "hover:bg-accent",
        pending && "opacity-50",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2",
          checked ? "border-success bg-success text-success-foreground" : "border-input",
        )}
      >
        {checked ? "✓" : ""}
      </span>
      <span className={cn(checked && "line-through text-muted-foreground")}>{text}</span>
    </button>
  );
}
