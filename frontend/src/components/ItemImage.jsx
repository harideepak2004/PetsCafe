import { CATEGORY_EMOJI } from "../lib/format";

/** Menu photo, or a warm tile with the category emoji when there's no photo. */
export default function ItemImage({ item, className = "" }) {
  if (item.image) return <img className={`item-img ${className}`} src={item.image} alt="" loading="lazy" />;
  return (
    <div className={`item-img item-ph ph-${item.category} ${className}`} aria-hidden="true">
      <span>{CATEGORY_EMOJI[item.category] || "🐾"}</span>
    </div>
  );
}
