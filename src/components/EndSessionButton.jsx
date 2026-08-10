export default function EndSessionButton({ onEnd, label = "End session now" }) {
  return (
    <button
      type="button"
      onClick={onEnd}
      className="w-full text-sm px-3 py-2 rounded-lg border border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
    >
      {label} →
    </button>
  );
}