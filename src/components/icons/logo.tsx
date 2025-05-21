import type { SVGProps } from 'react';

export function CosmosCuratorLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="Cosmos Curator Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="10"
        y="35"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="url(#logoGradient)"
      >
        Cosmos Curator
      </text>
      {/* Optional: A small abstract icon */}
      <path d="M180 15 a5 5 0 0 1 0 20 a5 5 0 0 1 0 -20 M175 25 h10 M180 20 v10" stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}
