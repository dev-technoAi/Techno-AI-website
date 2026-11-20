/** Small product illustrations for the solutions title peeks. Real models use their own renders. */
export default function JourneyPeek({ slug }: { slug: string }) {
  if (slug === "robot" || slug === "drone") {
    return <img src={`/redesign/journey/${slug}-peek.webp`} width={slug === "drone" ? 124 : 85} height={100} alt="" loading="lazy" decoding="async" />;
  }

  const shape: Record<string, React.ReactNode> = {
    industry: <>
      <path d="M13 78V49l19 10V47l21 11V35h12v43z" fill="#b8c8cd" stroke="#34494f" strokeWidth="2" />
      <path d="M65 78V47h31v31z" fill="#e5edef" stroke="#34494f" strokeWidth="2" />
      <path d="M74 47V19h12v28M78 25h8" fill="#61757d" stroke="#34494f" strokeWidth="2" />
      <path d="M22 67h8m12 0h8m23-5h8m9 0h5" stroke="#289fb7" strokeWidth="5" strokeLinecap="round" />
      <path d="M8 79h96" stroke="#0f1a1b" strokeWidth="5" strokeLinecap="round" />
    </>,
    satellite: <>
      <path d="M7 38h30v30H7zm76 0h30v30H83z" fill="#146b8c" stroke="#34494f" strokeWidth="2" />
      <path d="M17 38v30m10-30v30m66-30v30m10-30v30M7 48h30M7 58h30m46-20h30m-30 10h30m-30 10h30" stroke="#9fe7e7" strokeWidth="1.5" />
      <path d="M37 53h8m30 0h8" stroke="#34494f" strokeWidth="3" />
      <path d="M45 35h30v38H45z" fill="#aebfc5" stroke="#34494f" strokeWidth="2.5" />
      <path d="M47 43h26m-26 21h26" stroke="#289fb7" strokeWidth="3" />
      <path d="M53 35V23m14 12V23" stroke="#34494f" strokeWidth="2" />
      <path d="M45 20q15 15 30 0-15-9-30 0Z" fill="#dce8eb" stroke="#34494f" strokeWidth="2" />
      <path d="M60 18V9" stroke="#34494f" strokeWidth="2" /><circle cx="60" cy="8" r="3" fill="#289fb7" />
    </>,
    security: <>
      <path d="M20 37 75 25l24 17-55 14z" fill="#dce8eb" stroke="#34494f" strokeWidth="2.5" />
      <path d="M20 37v19l24 15V56m0 15 55-16V42" fill="#a8bac1" stroke="#34494f" strokeWidth="2.5" />
      <path d="M56 70v13H33" fill="none" stroke="#34494f" strokeWidth="5" strokeLinecap="round" />
      <circle cx="84" cy="49" r="12" fill="#1b2c32" stroke="#617980" strokeWidth="3" />
      <circle cx="84" cy="49" r="5" fill="#289fb7" /><circle cx="84" cy="49" r="2" fill="#9fe7e7" />
      <circle cx="31" cy="52" r="2.5" fill="#9fe7e7" />
    </>,
    financial: <>
      <path d="M31 12h53l9 62-14 11H34L22 74z" fill="#c4d1d5" stroke="#34494f" strokeWidth="2.5" />
      <path d="M34 19h45l4 26H30z" fill="#17292f" stroke="#34494f" strokeWidth="2" />
      <path d="M42 32h29" stroke="#289fb7" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 56h7m11 0h7m11 0h5M40 66h7m11 0h7m11 0h5" stroke="#f8fbfc" strokeWidth="5" strokeLinecap="round" />
      <path d="M21 76h70" stroke="#0f1a1b" strokeWidth="5" strokeLinecap="round" />
      <path d="M89 24h16v31H89z" fill="#e9f3f4" stroke="#34494f" strokeWidth="2" />
      <path d="M92 31h10" stroke="#289fb7" strokeWidth="3" />
    </>,
  };

  return <svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">{shape[slug]}</svg>;
}
