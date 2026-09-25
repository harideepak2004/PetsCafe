export default function VegMark({ veg }) {
  return (
    <span className={`vegmark ${veg ? "veg" : "nonveg"}`} title={veg ? "Vegetarian" : "Non-vegetarian"} aria-label={veg ? "Vegetarian" : "Non-vegetarian"}>
      <i />
    </span>
  );
}
