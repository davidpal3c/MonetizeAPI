import {
  FREE_TEXT_INPUT_EXAMPLE,
  STRUCTURED_INPUT_EXAMPLE,
} from "../../lib/demo-input-examples";

export function InputFormatGuide() {
  return (
    <section className="demo-guide" aria-labelledby="input-format-guide-heading">
      <h2 id="input-format-guide-heading" className="visually-hidden">
        Input format guide
      </h2>
      <div className="demo-guide__instructions">
        <p className="demo-guide__heading">How to describe your API</p>
        <p>
          Paste either <strong>plain-language</strong> or a <strong>structured</strong> endpoint
          spec. MonetizeAPI infers method, path, and pricing context from what you provide.
        </p>
        <p className="demo-guide__hint">Live reports use your Agnic balance.</p>
      </div>
      <div className="demo-guide__examples">
        <div className="demo-guide__example">
          <p className="demo-guide__example-label">Free text</p>
          <p className="demo-guide__example-body">{FREE_TEXT_INPUT_EXAMPLE}</p>
        </div>
        <div className="demo-guide__example">
          <p className="demo-guide__example-label">Structured</p>
          <pre className="demo-guide__example-pre">{STRUCTURED_INPUT_EXAMPLE}</pre>
        </div>
      </div>
    </section>
  );
}
