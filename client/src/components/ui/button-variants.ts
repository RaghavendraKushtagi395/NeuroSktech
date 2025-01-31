import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-gray-700 text-white hover:bg-gray-600",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        gradient: "bg-gradient-to-r text-white hover:shadow-lg",
        outline: "border border-gray-600 bg-transparent hover:bg-gray-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);