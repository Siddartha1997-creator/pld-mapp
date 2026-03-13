import { useState } from 'react';

export interface FormField {
  value: string;
  error: string;
  onChange: (v: string) => void;
  validate: (rules: Array<(v: string) => string | null>) => boolean;
  reset: () => void;
}

export function useFormField(initial = ''): FormField {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');

  const onChange = (v: string) => {
    setValue(v);
    if (error) setError('');
  };

  const validate = (rules: Array<(v: string) => string | null>): boolean => {
    for (const rule of rules) {
      const msg = rule(value);
      if (msg) {
        setError(msg);
        return false;
      }
    }
    setError('');
    return true;
  };

  const reset = () => {
    setValue(initial);
    setError('');
  };

  return { value, error, onChange, validate, reset };
}

// Reusable validation rules
export const rules = {
  required: (label = 'This field') =>
    (v: string) => (!v.trim() ? `${label} is required` : null),

  minLength: (min: number) =>
    (v: string) => (v.length < min ? `Minimum ${min} characters` : null),

  noSpaces: (v: string) => (/\s/.test(v) ? 'No spaces allowed' : null),
};
