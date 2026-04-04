import React from "react";
const FormInput = ({
  label,
  name,
  type = "text",
  placeholder,
  icon,
  className = "",
  min,
  value,
  onChange,
  disabled = false,
}) => {
  const renderedIcon =
    icon && React.isValidElement(icon)
      ? React.cloneElement(icon, {
          className: "h-4 w-4",
          strokeWidth: 2,
        })
      : icon;

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        {renderedIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <span className="text-gray-500">{renderedIcon}</span>
          </div>
        )}
        <input
          type={type}
          name={name}
          id={name}
          min={min}
          value={value}
          onChange={onChange}
          onWheel={
            type === "number"
              ? (e) => {
                  // Prevent mouse wheel from changing the value while scrolling
                  e.currentTarget.blur();
                }
              : undefined
          }
          disabled={disabled}
          className={`w-full rounded-lg border border-gray-300 pr-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          style={{ paddingLeft: renderedIcon ? "2.6rem" : undefined }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default FormInput;
