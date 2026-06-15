/**
 * @file InputField.jsx
 * @module InputField
 * @description Reusable controlled input field component with label, error message display, and support for various input types (text, email, password, tel, number). Wraps the native input element with consistent styling, accessibility attributes, and error state visual feedback. Used across all forms in Rentify.
 * @dependencies react
 * @exports InputField: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';

function InputField({ label, name, type = 'text', value, onChange, error = '', placeholder = '', required = false, disabled = false, className = '', ...rest }) {
  // TODO: Add aria-invalid and aria-describedby for accessibility
  // TODO: Style error state with red border and error message below input
  // TODO: Support textarea variant via a `multiline` prop (optional enhancement)
  // TODO: Add optional character counter for textareas
  return (
    <div className={`input-field ${error ? 'input-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={name} className="input-field__label">
          {label} {required && <span className="input-field__required">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="input-field__input"
        {...rest}
      />
      {error && <span className="input-field__error">{error}</span>}
    </div>
  );
}

export default InputField;
