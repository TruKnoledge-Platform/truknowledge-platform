export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-6 py-10 text-center text-xs text-[#9AA3B5]">
      <p
        className="text-sm text-[#F3E6D2]/80"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        TruKnowledge
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <a href="/terms" className="text-[#E8A24A] hover:underline">
          Terms
        </a>
        <a href="/privacy" className="text-[#E8A24A] hover:underline">
          Privacy
        </a>
        <a href="/refunds" className="text-[#E8A24A] hover:underline">
          Refunds
        </a>
        <a href="/contact" className="text-[#E8A24A] hover:underline">
          Contact us
        </a>
      </p>
      <p className="mt-2">The way to a new positive future · Course and Web App</p>
    </footer>
  );
}