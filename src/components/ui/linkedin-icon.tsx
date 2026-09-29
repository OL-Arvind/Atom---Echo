import React from "react";

interface LinkedInIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  color?: "brand" | "currentColor" | "white";
}

/**
 * Authentic LinkedIn vector icon.
 * Supports currentColor, brand blue (#0A66C2), or white.
 */
export function LinkedInIcon({
  size = 16,
  className = "",
  color = "currentColor",
  ...props
}: LinkedInIconProps) {
  const fillColor =
    color === "brand"
      ? "#0A66C2"
      : color === "white"
      ? "#FFFFFF"
      : "currentColor";

  return (
    <svg
      viewBox="-32 0 512 512"
      width={size}
      height={size}
      fill={fillColor}
      className={`shrink-0 inline-block ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z" />
    </svg>
  );
}
