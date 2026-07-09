import { useRef, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/cn";

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
  const submitIntentRef = useRef(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const fromSubmitButton =
      submitter instanceof HTMLButtonElement && submitter.dataset.answerSubmit === "true";
    const canSubmit = submitIntentRef.current || fromSubmitButton;

    submitIntentRef.current = false;
    if (!canSubmit || disabled || !value.trim()) return;

    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      submitIntentRef.current = false;
      return;
    }

    if (event.nativeEvent.isComposing) {
      submitIntentRef.current = false;
      return;
    }

    submitIntentRef.current = true;
  }

  return (
    <form
      className={cn(
        compact
          ? "sticky top-3 z-[5] m-0 flex items-center gap-3 rounded-2xl border border-violet-300/45 bg-[#0f0f1a]/95 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur"
          : "mt-6 rounded-2xl border border-violet-300/25 bg-[#0f0f1a] p-5",
      )}
      onSubmit={submit}
    >
      {compact ? (
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/15 text-xl text-violet-200 max-sm:hidden">
          ?
        </span>
      ) : (
        <label
          htmlFor="text-answer"
          className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-violet-200"
        >
          Titre ou artiste ?
        </label>
      )}
      <div
        className={cn(
          "min-w-0",
          compact ? "flex flex-1 items-center gap-3" : "flex items-center gap-3 max-sm:flex-col",
        )}
      >
        <Input
          ref={inputRef}
          id="text-answer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            compact &&
              "h-[42px] min-w-0 flex-1 border-0 bg-transparent px-3 text-white caret-white shadow-none focus:shadow-none",
          )}
        />
        <button
          type="submit"
          data-answer-submit="true"
          disabled={disabled || !value.trim()}
          className="inline-flex h-[42px] min-w-24 flex-none items-center justify-center rounded-xl border-0 bg-linear-135 from-[#7c3aed] to-[#ec4899] px-4 text-sm font-black leading-none text-white shadow-[0_0_22px_rgba(124,58,237,0.28)] transition duration-150 hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_0_28px_rgba(124,58,237,0.42)] disabled:cursor-not-allowed disabled:opacity-45 max-sm:min-w-[84px]"
          onPointerDown={() => {
            submitIntentRef.current = true;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") submitIntentRef.current = true;
          }}
        >
          {compact ? "Envoyer" : "Valider"}
        </button>
      </div>
    </form>
  );
}
