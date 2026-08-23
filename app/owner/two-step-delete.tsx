"use client";

export default function TwoStepDelete({
  action,
  hidden,
  first,
  second,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  first: string;
  second: string;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(first)) {
          e.preventDefault();
          return;
        }
        if (!window.confirm(second)) {
          e.preventDefault();
        }
      }}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="rounded-full border border-red-400/60 px-4 py-1.5 text-sm text-red-300 hover:bg-red-950/40"
      >
        {label}
      </button>
    </form>
  );
}