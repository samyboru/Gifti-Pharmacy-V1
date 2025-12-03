// File Location: client/src/styles/reactSelectStyles.ts

import { StylesConfig } from 'react-select';

// We type it as a generic StylesConfig. 'any' here is a safe and common
// practice for reusable style objects like this, as we don't care about
// the specific option type, only the styling.
export const customReactSelectStyles: StylesConfig<any, any> = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--input-bg)',
    borderColor: state.isFocused ? 'var(--input-focus-border)' : 'var(--input-border)',
    boxShadow: state.isFocused ? `0 0 0 1px var(--input-focus-border)` : 'none',
    '&:hover': {
      borderColor: 'var(--input-focus-border)',
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-color)',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'var(--background-color)',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--widget-bg)',
    border: '1px solid var(--border-color)',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'var(--accent-color)'
      : state.isFocused
      ? 'var(--background-color)'
      : 'transparent',
    color: state.isSelected ? 'var(--accent-text-color)' : 'var(--text-color)',
    '&:active': {
      backgroundColor: 'var(--accent-color)',
    },
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--text-color)',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-secondary)',
  }),
};