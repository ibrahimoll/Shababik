import { Icon } from "../Icon";

/** Product search: a plain GET form to the Products page (works without JavaScript). */
export function SearchBox({
  action,
  label,
  placeholder,
  button,
  defaultValue = "",
  category,
  className = "",
}: {
  action: string;
  label: string;
  placeholder: string;
  button: string;
  defaultValue?: string;
  category?: string;
  className?: string;
}) {
  return (
    <form role="search" action={action} className={`search-box ${className}`}>
      {category && <input type="hidden" name="category" value={category} />}
      <label className="search-box-field">
        <span className="sr-only">{label}</span>
        <Icon name="search" size={19} className="search-box-icon" />
        <input name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} maxLength={80} autoComplete="off" enterKeyHint="search" />
      </label>
      <button type="submit" className="search-box-go" aria-label={button}>
        <Icon name="arrow" size={18} className="flip-rtl" />
      </button>
    </form>
  );
}
