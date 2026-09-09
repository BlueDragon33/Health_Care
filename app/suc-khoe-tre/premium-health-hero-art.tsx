"use client";

export default function PremiumHealthHeroArt() {
  return <div className="premium-hero-art" aria-hidden="true">
    <svg viewBox="0 0 620 320" role="presentation">
      <defs>
        <linearGradient id="heroSkin" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffe4ce"/><stop offset="1" stopColor="#f7c7a8"/></linearGradient>
        <linearGradient id="heroHair" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#503a49"/><stop offset=".55" stopColor="#2f2b3b"/><stop offset="1" stopColor="#211f2f"/></linearGradient>
        <linearGradient id="heroHoodie" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f7fbff"/><stop offset="1" stopColor="#d6e8ff"/></linearGradient>
        <linearGradient id="heroHeart" x1="0" x2="1"><stop offset="0" stopColor="#ff5f7a"/><stop offset="1" stopColor="#ff8a9b"/></linearGradient>
        <linearGradient id="heroLake" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b7e6ef"/><stop offset="1" stopColor="#d9f2e5"/></linearGradient>
      </defs>

      <g opacity=".8">
        <circle cx="546" cy="56" r="34" fill="#fff0c9"/>
        <path d="M390 165 465 58l75 107Z" fill="#8cb7cd"/>
        <path d="m438 165 55-82 68 82Z" fill="#78a9c2"/>
        <path d="m465 58 18 25-17-5-15 10Z" fill="#fff" opacity=".92"/>
        <path d="m493 83 17 24-17-6-12 10Z" fill="#fff" opacity=".88"/>
        <ellipse cx="484" cy="183" rx="152" ry="33" fill="#a9d4c0"/>
        <ellipse cx="478" cy="206" rx="174" ry="25" fill="url(#heroLake)"/>
        <path d="M361 212c48-9 92-9 138 0M411 226c38-6 72-6 109 0" fill="none" stroke="#7fc6d6" strokeWidth="3" strokeLinecap="round" opacity=".5"/>
      </g>

      <g transform="translate(126 5)">
        <path d="M140 40c2-26 28-40 56-35 31 5 44 27 38 53-20-12-45-17-70-12-10 2-18 5-24 9Z" fill="url(#heroHair)"/>
        <path d="M126 75c-4-36 17-63 57-66 34-3 64 14 71 49-19-14-39-20-63-18-26 2-47 14-65 35Z" fill="url(#heroHair)"/>
        <path d="M107 230c16-47 50-71 100-71 51 0 88 26 106 73l15 41H92Z" fill="url(#heroHoodie)"/>
        <ellipse cx="203" cy="105" rx="66" ry="72" fill="url(#heroSkin)"/>
        <path d="M141 94c5-43 24-63 63-65 35-2 58 20 65 56-27-17-53-21-82-14-18 4-33 12-46 23Z" fill="url(#heroHair)"/>
        <path d="M143 92c-11-11-18-3-14 12 3 11 10 19 20 19Z" fill="#efb79b"/>
        <path d="M263 91c11-11 18-3 14 12-3 11-10 19-20 19Z" fill="#efb79b"/>
        <ellipse cx="176" cy="106" rx="11" ry="14" fill="#fff"/>
        <ellipse cx="231" cy="106" rx="11" ry="14" fill="#fff"/>
        <ellipse cx="179" cy="108" rx="6" ry="9" fill="#3d302e"/>
        <ellipse cx="228" cy="108" rx="6" ry="9" fill="#3d302e"/>
        <circle cx="181" cy="105" r="2" fill="#fff"/><circle cx="226" cy="105" r="2" fill="#fff"/>
        <path d="M189 137c8 8 18 8 27 0" fill="none" stroke="#c96673" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="160" cy="129" r="9" fill="#f39caa" opacity=".3"/>
        <circle cx="245" cy="129" r="9" fill="#f39caa" opacity=".3"/>
        <path d="M121 226c13-25 31-41 54-48l12 52Z" fill="#eef6ff"/>
        <path d="M288 226c-12-25-31-41-54-48l-12 52Z" fill="#eef6ff"/>
        <path d="M141 244c25-14 41-16 62-5M264 244c-25-14-41-16-62-5" fill="none" stroke="#c7daf1" strokeWidth="8" strokeLinecap="round"/>
        <g transform="translate(181 204)">
          <path d="M26 13C12-5-9 4-9 22c0 20 35 40 35 40s35-20 35-40C61 4 40-5 26 13Z" fill="url(#heroHeart)"/>
          <path d="M7 28h11l6-12 9 23 6-11h12" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <path d="M137 73c-22 13-34 33-37 61 18-14 27-31 28-51M269 72c20 12 31 31 34 57-15-12-24-27-26-47" fill="url(#heroHair)"/>
      </g>

      <g transform="translate(438 192)">
        <ellipse cx="52" cy="59" rx="49" ry="29" fill="#fff6ea"/>
        <circle cx="53" cy="30" r="31" fill="#fff8ef"/>
        <path d="m31 9 9 15-18 2Z" fill="#eba795"/><path d="m74 9-9 15 18 2Z" fill="#eba795"/>
        <path d="M37 32c4 3 8 3 12 0M58 32c4 3 8 3 12 0" fill="none" stroke="#46505f" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M50 42c2 3 5 3 7 0" fill="none" stroke="#d26f77" strokeWidth="2.1" strokeLinecap="round"/>
        <path d="M84 64c21-8 32 6 28 19" fill="none" stroke="#fff6ea" strokeWidth="12" strokeLinecap="round"/>
      </g>

      <g fill="#ff7892" opacity=".9"><path d="M556 137c-6-9-17-3-17 5 0 9 17 18 17 18s17-9 17-18c0-8-11-14-17-5Z"/><circle cx="588" cy="114" r="4"/><circle cx="534" cy="102" r="3"/></g>
    </svg>
    <div className="premium-hero-mantra"><strong>Khỏe mạnh</strong><span>Tự tin</span><span>Tỏa sáng ♡</span></div>
  </div>;
}
