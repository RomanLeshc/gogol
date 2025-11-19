'use client';

import { useState } from 'react';

interface UrlInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string;
  className?: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function UrlInput({
  value,
  onChange,
  onValidationChange,
  className,
  ...props
}: UrlInputProps) {
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState(true);

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`;
    }

    return `https://${trimmed}`;
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      return true;
    }

    try {
      const normalized = normalizeUrl(url);
      const urlObj = new URL(normalized);
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return false;
      }

      const hostnamePattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$|^localhost$|^(\d{1,3}\.){3}\d{1,3}$|^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
      if (!hostnamePattern.test(urlObj.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.trim()) {
      const valid = validateUrl(inputValue);
      setIsValid(valid);
      
      if (!valid) {
        setError('Please enter a valid URL (e.g. example.com or https://example.com)');
      } else {
        setError('');
      }
      
      onValidationChange?.(valid);
    } else {
      setIsValid(true);
      setError('');
      onValidationChange?.(true);
    }
  };

  const handleBlur = () => {
    if (value.trim() && isValid) {
      const normalized = normalizeUrl(value);
      if (normalized !== value) {
        onChange(normalized);
      }
    }
  };

  return (
    <div className="w-full">
      <input
        {...props}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${className || ''} ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

