"use client";

type EndpointInputComposerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function EndpointInputComposer({
  value,
  onChange,
  disabled = false,
}: EndpointInputComposerProps) {
  return (
    <div className="demo-hero">
      <label htmlFor="endpoint-input" className="visually-hidden">
        API or endpoint description
      </label>
      <textarea
        id="endpoint-input"
        className="demo-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
        disabled={disabled}
        placeholder="Describe an API endpoint, tool, or function you want to monetize..."
      />
    </div>
  );
}
