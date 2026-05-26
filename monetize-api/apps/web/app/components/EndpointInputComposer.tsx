"use client";

import {
  FREE_TEXT_INPUT_EXAMPLE,
  STRUCTURED_INPUT_EXAMPLE,
} from "../../lib/demo-input-examples";

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
    <div className="demo-composer">
      <aside className="demo-composer__aside demo-composer__aside--left">
        <p className="demo-composer__heading">How to describe your API</p>
        <p>
          Paste either <strong>plain-language</strong> or a <strong>structured</strong> endpoint
          spec. MonetizeAPI infers method, path, and pricing context from what you provide.
        </p>
        <p className="demo-composer__hint">Live reports use your Agnic balance.</p>
      </aside>

      <div className="demo-composer__center">
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

      <aside className="demo-composer__aside demo-composer__aside--right">
        <div className="demo-composer__example">
          <p className="demo-composer__example-label">Free text</p>
          <p className="demo-composer__example-body">{FREE_TEXT_INPUT_EXAMPLE}</p>
        </div>
        <div className="demo-composer__example">
          <p className="demo-composer__example-label">Structured</p>
          <pre className="demo-composer__example-pre">{STRUCTURED_INPUT_EXAMPLE}</pre>
        </div>
      </aside>
    </div>
  );
}
