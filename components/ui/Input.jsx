/**
 * ANVAYA Accessible Form Input Primitive
 * Features integrated label, helper text, error state, and icon adornments.
 */
export default function Input({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  ...props
}) {
  const inputId = id || name;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`w-full font-sans ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-heritage-charcoal uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-600 font-bold">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-heritage-subtle">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-heritage-charcoal-400">
            <LeftIcon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperId}
          required={required}
          className={`block w-full rounded-lg text-sm bg-white text-heritage-charcoal placeholder-heritage-charcoal-300 border transition-colors duration-150 py-2.5 ${
            LeftIcon ? 'pl-9' : 'pl-3.5'
          } ${RightIcon ? 'pr-9' : 'pr-3.5'} ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
              : 'border-heritage-sandstone/50 hover:border-heritage-sandstone focus:border-heritage-green focus:ring-1 focus:ring-heritage-green'
          } ${disabled ? 'bg-heritage-sandstone-50 cursor-not-allowed opacity-75' : ''}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-heritage-charcoal-400">
            <RightIcon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-rose-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-heritage-charcoal-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
