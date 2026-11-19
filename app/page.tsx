"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AppFoot, AppTop, ListButton, Pill, PlusIcon, type Tone } from "@/components/app-shell";
import { addActivity, barWidth, categories, computeTotals, emission, initialActivities, removeActivity, factorByCategory, unitByCategory, type Activity, type Category } from "@/lib/carbon";

const CATEGORY_TONE: Record<Category, Tone> = { Travel: "amber", Home: "grey", Food: "green" };
type Filter = "All" | Category;
type Draft = { label: string; amount: string; category: Category };
const EMPTY_DRAFT: Draft = { label: "", amount: "", category: "Travel" };
const kg = (value: number) => `${value.toFixed(1)} kg`;
// index: where it sat in the ledger when removed. nextShown / prevShown: the rows shown around it, for focus.
type RemovedEntry = { item: Activity; index: number; nextShown?: number; prevShown?: number };
type RemovedBatch = { items: RemovedEntry[]; viaKeyboard: boolean };
const removedLabel = (items: RemovedEntry[]) => (items.length === 1 ? `Removed “${items[0].item.label}”` : `Removed ${items.length} lines`);

/** Why the draft cannot be added yet, field by field (empty strings when it can). */
function draftErrors(draft: Draft): { label: string; amount: string } {
  const amount = Number(draft.amount);
  return {
    label: draft.label.trim() ? "" : "Name the activity, for example “Train trip”.",
    amount: draft.amount.trim() === "" ? "Enter an amount." : !Number.isFinite(amount) || amount <= 0 ? "The amount must be more than 0." : "",
  };
}

export default function Home() {
  const [activities, setActivities] = useState(initialActivities);
  const [filter, setFilter] = useState<Filter>("All");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [touched, setTouched] = useState({ label: false, amount: false });
  const [announcement, setAnnouncement] = useState("");
  // Every removal still inside the Undo window: one Undo puts them all back where they were.
  const [removed, setRemovedState] = useState<RemovedBatch | null>(null);
  // The latest batch, so two removals before a re-render still both land in it.
  const removedRef = useRef<RemovedBatch | null>(null);
  const setRemoved = (batch: RemovedBatch | null) => { removedRef.current = batch; setRemovedState(batch); };
  const [toastFocused, setToastFocused] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const focusRowsNext = useRef<number[] | null>(null);
  const wasComposing = useRef(false);

  const totals = useMemo(() => computeTotals(activities), [activities]);
  const visible = filter === "All" ? activities : activities.filter((item) => item.category === filter);
  const shownTotal = filter === "All" ? totals.total : totals[filter];
  const errors = draftErrors(draft);
  const valid = !errors.label && !errors.amount;
  const unit = unitByCategory[draft.category];

  // Opening the composer focuses its first field; closing it returns focus to New line.
  useEffect(() => {
    if (composing) labelRef.current?.focus();
    else if (wasComposing.current) newRef.current?.focus();
    wasComposing.current = composing;
  }, [composing]);
  // A removal made from the keyboard moves focus to Undo (the focused Remove button has just gone).
  useEffect(() => { if (removed?.viaKeyboard) undoRef.current?.focus(); }, [removed]);
  // When the toast closes after Undo or Escape, focus goes back near the removed row once the list has re-rendered:
  // the first of these rows still shown, else New line (or the composer's first field when it is open).
  useEffect(() => {
    const ids = focusRowsNext.current;
    if (removed || !ids) return;
    focusRowsNext.current = null;
    const shown = [...document.querySelectorAll<HTMLElement>(".as-row[data-line]")];
    const row = ids.map((id) => shown.find((entry) => entry.dataset.line === String(id))).find(Boolean);
    (row?.querySelector<HTMLButtonElement>(".as-danger") ?? newRef.current ?? labelRef.current)?.focus();
  }, [removed, activities]);
  // The Undo toast closes 6 s after the latest removal (each removal restarts it), but never while it holds focus.
  useEffect(() => {
    if (!removed || toastFocused) return;
    const timer = window.setTimeout(() => { removedRef.current = null; setRemovedState(null); }, 6000);
    return () => window.clearTimeout(timer);
  }, [removed, toastFocused]);
  const toastShown = removed !== null;
  useLayoutEffect(() => {
    const toast = toastRef.current;
    if (!toastShown || !toast) return;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--as-toast-space", `${toast.offsetHeight + 32}px`);
    return () => { rootStyle.removeProperty("--as-toast-space"); };
  }, [toastShown]);

  function closeComposer() {
    setComposing(false);
    setDraft(EMPTY_DRAFT);
    setTouched({ label: false, amount: false });
  }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ label: true, amount: true });
    const next = addActivity(activities, { label: draft.label, amount: Number(draft.amount), category: draft.category });
    if (next === activities) return;
    const added = next[next.length - 1];
    setActivities(next);
    if (filter !== "All" && filter !== added.category) setFilter(added.category);
    setAnnouncement(`Added “${added.label}”: ${kg(emission(added))} CO₂e.`);
    closeComposer();
  }
  function remove(item: Activity, viaKeyboard: boolean) {
    const index = activities.findIndex((entry) => entry.id === item.id);
    if (index < 0) return;
    setActivities((current) => removeActivity(current, item.id));
    const shownAt = visible.findIndex((entry) => entry.id === item.id);
    const entry: RemovedEntry = { item, index, nextShown: visible[shownAt + 1]?.id, prevShown: shownAt > 0 ? visible[shownAt - 1].id : undefined };
    const items = [...(removedRef.current?.items ?? []), entry];
    setRemoved({ items, viaKeyboard });
    setAnnouncement(`${removedLabel(items)}. Undo is available for a few seconds.`);
  }
  function closeToast(focusIds?: number[]) {
    const last = removedRef.current?.items.at(-1);
    // Dismissed: the row after the removed one, else the one before it.
    focusRowsNext.current = focusIds ?? [last?.nextShown, last?.prevShown].filter((id): id is number => id !== undefined);
    setRemoved(null);
    setToastFocused(false);
  }
  function undo() {
    const items = removedRef.current?.items;
    if (!items?.length) return;
    // Latest removal first, so each index refers to the ledger as it was just before that removal.
    setActivities((current) => items.reduceRight(
      (list, { item, index }) => (list.some((entry) => entry.id === item.id) ? list : [...list.slice(0, index), item, ...list.slice(index)]),
      current,
    ));
    setAnnouncement(items.length === 1 ? `Restored “${items[0].item.label}”.` : `Restored ${items.length} lines.`);
    // Undone: back to the restored row (the latest one, where the user was last).
    closeToast([items[items.length - 1].item.id]);
  }

  const title = filter === "All" ? "All lines" : filter;
  const lists: { value: Filter; tone?: Tone }[] = [{ value: "All" }, ...categories.map((item) => ({ value: item, tone: CATEGORY_TONE[item] }))];
  const showLabelError = touched.label && errors.label;
  const showAmountError = touched.amount && errors.amount;

  return (
    <div className="as">
      <a className="as-skip" href="#main">Skip to content</a>
      <AppTop name="Carbon Tally" tagline="Make the assumption visible" />

      <div className="as-body">
        <aside className="as-side" aria-label="Categories">
          <h2>Categories</h2>
          <ul className="as-lists">
            {lists.map(({ value, tone }) => (
              <ListButton key={value} label={value === "All" ? "All lines" : value} count={value === "All" ? activities.length : activities.filter((item) => item.category === value).length} tone={tone} current={filter === value} onSelect={() => setFilter(value)} />
            ))}
          </ul>
        </aside>

        <main id="main" className="as-main">
          <div className="as-head">
            <div>
              <h1>{title}</h1>
              <p aria-live="polite">{visible.length} {visible.length === 1 ? "line" : "lines"} · <strong className="ct-total">{`${kg(shownTotal)} CO₂e`}</strong> estimate</p>
            </div>
            <div className="as-tools">
              {composing ? null : <button ref={newRef} type="button" className="as-button" onClick={() => setComposing(true)}><PlusIcon />New line</button>}
            </div>
          </div>

          {composing ? (
            <form className="as-composer" onSubmit={add} aria-label="New line" noValidate>
              <label className="as-field">Activity
                <input ref={labelRef} value={draft.label} maxLength={80} autoComplete="off" placeholder="Train trip" aria-invalid={showLabelError ? true : undefined} aria-describedby="label-error" onBlur={() => setTouched((t) => ({ ...t, label: true }))} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
              </label>
              <p id="label-error" className="ct-error" aria-live="polite">{showLabelError || ""}</p>
              <div className="as-segmented-wrap">
                <span id="category-label">Category</span>
                <div className="as-segmented" role="group" aria-labelledby="category-label">
                  {categories.map((item) => (
                    <button key={item} type="button" aria-pressed={draft.category === item} onClick={() => setDraft({ ...draft, category: item })}>{item}</button>
                  ))}
                </div>
              </div>
              <label className="as-field">Amount ({unit})
                <input type="number" inputMode="decimal" min="0" step="any" value={draft.amount} placeholder="12" aria-invalid={showAmountError ? true : undefined} aria-describedby="amount-error" onBlur={() => setTouched((t) => ({ ...t, amount: true }))} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} />
              </label>
              <p id="amount-error" className="ct-error" aria-live="polite">{showAmountError || ""}</p>
              <div className="as-composer-foot">
                <span className="ct-hint">{valid ? `≈ ${kg(Number(draft.amount) * factorByCategory[draft.category])} with the default factor` : "Name and amount are required."}</span>
                <div className="as-composer-actions">
                  <button type="button" className="as-plain" onClick={closeComposer}>Cancel</button>
                  <button type="submit" className="as-button" disabled={!valid}>Add</button>
                </div>
              </div>
            </form>
          ) : null}

          {visible.length ? (
            <ul className="as-list" aria-label={title}>
              {visible.map((item) => (
                <li className="as-row" key={item.id} data-line={item.id}>
                  <div>
                    <h3>{item.label}</h3>
                    <p>{item.amount} {item.unit} × default factor {item.factor.toFixed(2)} = <strong className="ct-kg">{kg(emission(item))}</strong></p>
                  </div>
                  <Pill tone={CATEGORY_TONE[item.category]}>{item.category}</Pill>
                  <button type="button" className="as-plain as-danger" aria-label={`Remove ${item.label}`} onClick={(event) => remove(item, event.detail === 0)}>Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="as-list as-empty">
              {activities.length === 0 ? (
                <><strong>The ledger is empty</strong>Press New line to add one visible assumption.</>
              ) : (
                <><strong>No {title} lines</strong>Press New line and pick {title} to add one, or show all lines.
                  <div className="ct-empty-action"><button type="button" className="as-plain" onClick={() => setFilter("All")}>Show all lines</button></div></>
              )}
            </div>
          )}

          <section className="as-composer ct-breakdown" aria-labelledby="breakdown-title">
            <h2 id="breakdown-title">Where it sits</h2>
            <ul>
              {categories.map((item) => (
                <li key={item}>
                  <div className="ct-bar-head"><span>{item}</span><strong>{kg(totals[item])}</strong></div>
                  <span className="ct-bar" aria-hidden="true"><span style={{ width: `${barWidth(totals, item)}%` }} /></span>
                </li>
              ))}
            </ul>
          </section>

          <p className="as-note">
            Demonstrative estimate, not audited. Default factors, in kg CO₂e per unit, are kept simple to show the shape of the ledger, not to certify an emissions report. Nothing leaves this page; no offset or certification.
          </p>
        </main>
      </div>

      <p className="as-sr" role="status" aria-live="polite">{announcement}</p>
      {removed ? (
        <div
          ref={toastRef}
          className="as-toast"
          role="group"
          aria-label="Undo remove"
          onFocus={() => setToastFocused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
          onKeyDown={(event) => { if (event.key === "Escape") closeToast(); }}
        >
          <span>{removedLabel(removed.items)}</span>
          <button ref={undoRef} type="button" className="as-plain" onClick={undo} aria-label={removed.items.length === 1 ? undefined : `Undo remove of ${removed.items.length} lines`}>Undo</button>
        </div>
      ) : null}

      <AppFoot source="https://github.com/bookchaowalit-website/sustainability-carbon-calculator-web" />
    </div>
  );
}
