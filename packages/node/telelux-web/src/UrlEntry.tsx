import { type FormEvent, useId, useState } from 'react';

import { linkForUrl } from './link-for-url';

export function UrlEntry() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const errorId = useId();

  function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = linkForUrl(value);
    if (result.kind === 'invalid') {
      setError(result.message);
      return;
    }
    setError(undefined);
    window.location.hash = result.hash;
  }

  return (
    <form className="url-entry" noValidate onSubmit={open}>
      <label>
        Transcript URL{' '}
        <input
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : errorId}
        />
      </label>{' '}
      <button type="submit">Open</button>
      {error !== undefined && (
        <p id={errorId} className="url-entry-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
