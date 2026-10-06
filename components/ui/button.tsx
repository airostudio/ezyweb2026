import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

/**
 * shadcn-style Button API, mapped onto our hand-rolled `.btn` classes in
 * globals.css. Use `asChild` to render a Link with button styling.
 */
const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      electric: "btn-electric",
      outline: "btn-outline",
      ghost: "btn-ghost",
    },
    size: { sm: "btn-sm", md: "", lg: "btn-lg", icon: "btn-icon" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      {...(!asChild && { type: type ?? "button" })}
      {...props}
    />
  );
});

export { buttonVariants };
