/* Small stroke icons (24×24 grid). They inherit the text color. */
const base = (size) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
});

export const IconStudy = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M12 6.5c-2-1.3-4.3-2-7-2v13c2.7 0 5 .7 7 2 2-1.3 4.3-2 7-2v-13c-2.7 0-5 .7-7 2z" /><path d="M12 6.5v13" /></svg>
);
export const IconMap = ({ size = 20 }) => (
  <svg {...base(size)}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="8" r="2.5" /><circle cx="9" cy="18" r="2.5" /><path d="M8.3 7 15.6 7.7M7 8.3l1.5 7.3M11.2 16.8l5.3-6.7" /></svg>
);
export const IconReview = ({ size = 20 }) => (
  <svg {...base(size)}><rect x="3" y="7" width="14" height="13" rx="2.5" /><path d="M7 7V5.5A1.5 1.5 0 0 1 8.5 4h10A2.5 2.5 0 0 1 21 6.5v9A1.5 1.5 0 0 1 19.5 17H17" /><path d="m7.5 13.5 2 2 3.5-4" /></svg>
);
export const IconUser = ({ size = 20 }) => (
  <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1.3-3.3 4.1-5 7.5-5s6.2 1.7 7.5 5" /></svg>
);
export const IconChart = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></svg>
);
export const IconSun = ({ size = 20 }) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IconMoon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
);
export const IconLogout = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></svg>
);
export const IconSearch = ({ size = 20 }) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconUpload = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" /></svg>
);
export const IconArrowRight = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconArrowLeft = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const IconPlay = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
);
export const IconClose = ({ size = 16 }) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconRefresh = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M20 11a8 8 0 0 0-14.5-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 4L20 15M20 20v-5h-5" /></svg>
);
export const IconCheck = ({ size = 16 }) => (
  <svg {...base(size)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
