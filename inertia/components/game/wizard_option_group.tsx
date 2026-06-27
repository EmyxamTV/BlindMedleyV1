import { Button } from "~/components/ui/button";

export interface WizardOption {
  value: string;
  label: string;
  description: string;
}

interface Props {
  label: string;
  value: string;
  options: readonly WizardOption[];
  onChange: (value: string) => void;
}

export function WizardOptionGroup({ label, value, options, onChange }: Props) {
  return (
    <div className="wizard-option-group">
      <span>{label}</span>
      <div className="mode-grid">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            className={`mode-card ${value === option.value ? "selected" : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span className="mode-card-name">{option.label}</span>
            <span className="mode-card-desc">{option.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
