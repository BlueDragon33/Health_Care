"use client";

export default function PremiumHealthHeroArt() {
  return <div className="premium-hero-art" aria-hidden="true">
    <svg viewBox="0 0 520 300" role="presentation">
      <defs>
        <linearGradient id="heroSky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e9f6ff" />
          <stop offset="1" stopColor="#d9f2ec" />
        </linearGradient>
        <linearGradient id="heroShirt" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#eef5ff" />
          <stop offset="1" stopColor="#d8ebff" />
        </linearGradient>
        <linearGradient id="heroHeart" x1="0" x2="1">
          <stop offset="0" stopColor="#ff6d84" />
          <stop offset="1" stopColor="#ff8f9b" />
        </linearGradient>
      </defs>
      <rect width="520" height="300" rx="38" fill="url(#heroSky)" opacity=".01" />
      <g opacity=".55">
        <circle cx="430" cy="55" r="29" fill="#fff1c7" />
        <path d="M320 151 378 68l58 83Z" fill="#9fc5df" />
        <path d="m369 151 43-65 52 65Z" fill="#84afcc" />
        <path d="m378 68 13 19-13-4-10 8Z" fill="#f9fdff" />
        <path d="m412 86 12 17-13-4-9 8Z" fill="#f9fdff" />
        <ellipse cx="390" cy="176" rx="126" ry="34" fill="#b9dfd1" />
        <ellipse cx="395" cy="190" rx="154" ry="25" fill="#d9eee8" />
      </g>
      <g transform="translate(176 26)">
        <path d="M76 187c12-34 36-51 72-51 36 0 64 18 78 53l15 41H61Z" fill="url(#heroShirt)" />
        <circle cx="149" cy="79" r="53" fill="#ffd8bf" />
        <path d="M99 69c4-35 25-55 54-55 29 0 50 18 56 49-15-12-33-18-53-18-21 0-40 8-57 24Z" fill="#47344a" />
        <path d="M100 70c-9-9-14-3-10 9 3 9 9 15 16 16Z" fill="#f4bba3" />
        <path d="M205 70c9-9 14-3 10 9-3 9-9 15-16 16Z" fill="#f4bba3" />
        <ellipse cx="130" cy="81" rx="5" ry="7" fill="#313b4b" />
        <ellipse cx="169" cy="81" rx="5" ry="7" fill="#313b4b" />
        <path d="M139 106c8 7 18 7 27 0" fill="none" stroke="#cd6e7b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="116" cy="98" r="7" fill="#f2a4a8" opacity=".42" />
        <circle cx="184" cy="98" r="7" fill="#f2a4a8" opacity=".42" />
        <path d="M86 171c7-18 18-30 34-37l9 42Z" fill="#f6fbff" />
        <path d="M211 171c-7-18-18-30-34-37l-9 42Z" fill="#f6fbff" />
        <g transform="translate(135 169)">
          <path d="M15 9C5-4-10 3-10 16c0 15 25 29 25 29s25-14 25-29C40 3 25-4 15 9Z" fill="url(#heroHeart)" />
          <path d="M4 20h8l4-8 7 16 4-8h8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <g transform="translate(371 178)">
        <ellipse cx="47" cy="57" rx="43" ry="28" fill="#fff7ee" />
        <circle cx="47" cy="29" r="28" fill="#fff7ee" />
        <path d="m28 10 8 13-16 2Z" fill="#f0b8a7" />
        <path d="m67 10-8 13 16 2Z" fill="#f0b8a7" />
        <path d="M34 31c3 2 6 2 9 0M52 31c3 2 6 2 9 0" fill="none" stroke="#455262" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M45 39c2 3 4 3 6 0" fill="none" stroke="#d27a7d" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g fill="none" stroke="#4d89bf" strokeLinecap="round" opacity=".75">
        <path d="M335 68c17-22 30-16 36 0" strokeWidth="3" />
        <path d="M321 91c22-18 41-15 53 1" strokeWidth="2.4" />
      </g>
      <g fill="#ff8ea2" opacity=".9">
        <circle cx="462" cy="126" r="4" />
        <circle cx="483" cy="109" r="3" />
        <circle cx="449" cy="95" r="2.5" />
      </g>
    </svg>
    <div className="premium-hero-mantra"><strong>Khỏe mạnh</strong><span>Tự tin · Tỏa sáng</span></div>
  </div>;
}