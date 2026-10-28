"use client";

import { RotateCcw } from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { fillTemplate } from "@/i18n/dictionaries";
import styles from "./AssumptionsPanel.module.css";

export type AssumptionField = {
  id: string;
  label: string;
  unit: string;
  /** Value in effect (edited or default) */
  value: number | null;
  /** Default from the source or the preset */
  defaultValue: number | null;
  /** Where the default comes from */
  provenance: string;
  step: number;
  min: number;
  max?: number;
  placeholder?: string;
  /** Render a select instead of a number input */
  options?: { value: number; label: string }[];
  disabled?: boolean;
};

type Group = { id: string; label: string; note?: string; fields: AssumptionField[] };

type Props = {
  groups: Group[];
  onChange: (id: string, value: number | null) => void;
  onResetAll: () => void;
};

export function AssumptionsPanel({ groups, onChange, onResetAll }: Props) {
  const { dict } = usePreferences();
  const t = dict.validator.assumptions;
  const editedCount = groups
    .flatMap((g) => g.fields)
    .filter((f) => f.value !== f.defaultValue).length;

  return (
    <aside className={styles.panel} aria-label={t.title}>
      <header className={styles.head}>
        <div>
          <h2 className={styles.title}>{t.title}</h2>
          <p className={styles.hint}>{t.hint}</p>
        </div>
      </header>

      {groups.map((group) => (
        <fieldset key={group.id} className={styles.group}>
          <legend className={styles.legend}>{group.label}</legend>
          {group.note ? <p className={styles.groupNote}>{group.note}</p> : null}
          {group.fields.map((field) => {
            const edited = field.value !== field.defaultValue;
            const inputId = `assumption-${field.id}`;
            return (
              <div
                key={field.id}
                className={styles.field}
                data-edited={edited ? "true" : undefined}
                data-disabled={field.disabled ? "true" : undefined}
              >
                <label htmlFor={inputId} className={styles.label}>
                  {edited ? <span className={styles.dot} aria-hidden /> : null}
                  {field.label}
                </label>
                <div className={styles.control}>
                  {field.options ? (
                    <select
                      id={inputId}
                      className={styles.input}
                      value={field.value ?? ""}
                      disabled={field.disabled}
                      onChange={(e) => onChange(field.id, Number(e.target.value))}
                    >
                      {field.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                  <input
                    id={inputId}
                    disabled={field.disabled}
                    type="number"
                    inputMode="decimal"
                    className={styles.input}
                    value={field.value ?? ""}
                    placeholder={field.placeholder}
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        onChange(field.id, null);
                        return;
                      }
                      const n = Number(raw);
                      if (Number.isFinite(n)) onChange(field.id, n);
                    }}
                  />
                  )}
                  {field.unit ? <span className={styles.unit}>{field.unit}</span> : null}
                  {edited ? (
                    <button
                      type="button"
                      className={styles.reset}
                      onClick={() => onChange(field.id, field.defaultValue)}
                      aria-label={`${t.reset} · ${field.label}`}
                      title={t.reset}
                    >
                      <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <p className={styles.provenance}>
                  {edited ? t.edited : field.provenance}
                </p>
              </div>
            );
          })}
        </fieldset>
      ))}

      <footer className={styles.foot}>
        {editedCount > 0 ? (
          <>
            <p className={styles.editedCount}>
              {fillTemplate(t.editedCount, { n: editedCount })}
            </p>
            <p className={styles.hint}>{t.projectNote}</p>
            <button type="button" className={styles.resetAll} onClick={onResetAll}>
              <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
              {t.resetAll}
            </button>
          </>
        ) : null}
      </footer>
    </aside>
  );
}
