import { AnimatePresence, motion } from "framer-motion";

import { duration, easing } from "../motion";

export interface FieldErrorProps {
  id?: string;
  children?: string;
}

// A small, real transition (not a static <p>) for form validation messages -
// fades and grows in from zero height so it doesn't jump the layout below it.
// `children` is optional and falsy-safe so callers can write
// `<FieldError id="x-error">{errors.x?.message}</FieldError>` directly
// instead of a surrounding ternary.
export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <AnimatePresence initial={false}>
      {children ? (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: duration.fast, ease: easing.standard }}
          className="overflow-hidden text-sm text-destructive"
        >
          {children}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
