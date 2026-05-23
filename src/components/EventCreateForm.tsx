"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Armchair, Square, Presentation, Calendar, MapPin, User, Send } from "lucide-react";
import { createEventRequest } from "@/app/actions";

type User = { id: string; name: string; role: string };
type Location = { id: string; name: string; type: string };

export function EventCreateForm({
  users,
  locations,
  available,
}: {
  users: User[];
  locations: Location[];
  available: { Chair: number; Table: number; Whiteboard: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sensible defaults: starts in 1h, ends in 5h
  const now = new Date();
  const startDefault = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const endDefault = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const defaultUser = users[0];

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createEventRequest(formData);
        router.push(`/events/${id}`);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to create request";
        setError(message);
      }
    });
  }

  return (
    <form action={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <Field label="Title" icon={Calendar}>
        <input
          name="title"
          required
          placeholder="Innovation Showcase"
          className="input"
        />
      </Field>

      <Field label="Description" optional>
        <textarea
          name="description"
          rows={2}
          placeholder="Notes for facilities team"
          className="input resize-none"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Room" icon={MapPin}>
          <select name="locationId" required defaultValue="" className="input">
            <option value="" disabled>Pick a room…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.type === "EVENT_SPACE" ? "· Event space" : "· Room"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Requester" icon={User}>
          <select name="requesterId" required defaultValue={defaultUser?.id ?? ""} className="input">
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.role}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Starts">
          <input type="datetime-local" name="startsAt" required defaultValue={startDefault} className="input" />
        </Field>
        <Field label="Ends">
          <input type="datetime-local" name="endsAt" required defaultValue={endDefault} className="input" />
        </Field>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-2">
          How many of each?
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <QtyField name="chairs" icon={Armchair} label="Chairs" max={available.Chair} />
          <QtyField name="tables" icon={Square} label="Tables" max={available.Table} />
          <QtyField name="whiteboards" icon={Presentation} label="Whiteboards" max={available.Whiteboard} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50 hover:bg-[var(--color-accent)]/90 shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
        >
          <Send className="w-4 h-4" />
          {pending ? "Creating…" : "Create request"}
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: var(--color-panel-2);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          color: var(--color-fg);
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        :global(.input:focus) {
          border-color: var(--color-accent);
          background: var(--color-panel);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  optional,
  icon: Icon,
  children,
}: {
  label: string;
  optional?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 opacity-70" />}
        {label}
        {optional && <span className="text-[10px] normal-case tracking-normal opacity-60">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

function QtyField({
  name,
  icon: Icon,
  label,
  max,
}: {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  max: number;
}) {
  return (
    <label className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 space-y-2">
      <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 opacity-70" />
        {label}
      </span>
      <input
        type="number"
        name={name}
        defaultValue={0}
        min={0}
        max={max}
        className="input text-xl tabular-nums"
      />
      <span className="block text-[10px] text-[var(--color-muted)]">{max} available in storage</span>
    </label>
  );
}
