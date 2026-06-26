import type { FormEvent, RefObject } from "react";

export function TextAnswerForm({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  inputRef,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  compact?: boolean;
}) {
  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) onSubmit();
  }

  return (
    <form className={`text-answer-form ${compact ? "text-answer-static" : ""}`} onSubmit={submit}>
      {compact ? (
        <span className="text-answer-icon">?</span>
      ) : (
        <label htmlFor="text-answer">Titre ou artiste ?</label>
      )}
      <div>
        <input
          ref={inputRef}
          id="text-answer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus
        />
        <button className="btn btn-primary" disabled={disabled || !value.trim()}>
          {compact ? "Envoyer" : "Valider"}
        </button>
      </div>
    </form>
  );
}
