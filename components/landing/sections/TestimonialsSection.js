/* Testimonials — real ones only. Structure is in place; slots are clearly
 * marked placeholders for the owner to replace with genuine quotes. */
const SLOTS = [
  { theme: 'Discipline', prompt: 'A trader on how the discipline score changed their review habit.' },
  { theme: 'Prop trading', prompt: 'A funded trader on staying inside daily loss limits.' },
  { theme: 'AI insights', prompt: 'A trader on a pattern Propol found that they couldn\'t see.' },
];

export default function TestimonialsSection() {
  return (
    <section className="px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">Early voices</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Traders on the process.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {SLOTS.map((slot, i) => (
            <figure key={slot.theme} className="flex flex-col rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.015] p-7" data-reveal style={{ '--reveal-delay': `${i * 90}ms` }}>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300/50">{slot.theme}</span>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/35">
                {slot.prompt}
              </blockquote>
              <figcaption className="mt-5 border-t border-white/[0.06] pt-4 font-mono text-[10px] uppercase tracking-widest text-white/25">
                Real testimonial — coming soon
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
