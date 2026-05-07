import uniqueueLogo from "../../imports/logo1_(2).png";
import ucLogo from "../../imports/University_of_Cebu_Logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  variant?: "both" | "uniqueue" | "uc";
}

export function Logo({ className = "", size = "md", variant = "both" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-20",
    xxl: "h-28",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {(variant === "both" || variant === "uniqueue") && (
        <img
          src={uniqueueLogo}
          alt="UniQueue Logo"
          className={`${sizeClasses[size]} w-auto`}
        />
      )}

      {(variant === "both" || variant === "uc") && (
        <img
          src={ucLogo}
          alt="University of Cebu Logo"
          className={`${sizeClasses[size]} w-auto`}
        />
      )}
    </div>
  );
}
