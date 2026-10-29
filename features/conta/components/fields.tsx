"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = Omit<ComponentProps<typeof Input>, "id" | "name"> & {
  name: string;
  label: string;
  errors?: string[];
};

const inputClassName =
  "h-11 rounded-[4px] border-neutral-400 bg-surface px-3 text-sm text-black md:text-sm";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-xs text-red-300">
      {errors[0]}
    </p>
  );
}

export function TextField({ name, label, errors, className, ...props }: FieldProps) {
  const errorId = `${name}-error`;
  const invalid = Boolean(errors?.length);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-white">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        className={cn(inputClassName, className)}
        {...props}
      />
      <FieldError id={errorId} errors={errors} />
    </div>
  );
}

export function PasswordField({
  name,
  label,
  errors,
  className,
  ...props
}: Omit<FieldProps, "type">) {
  const [visible, setVisible] = useState(false);
  const errorId = `${name}-error`;
  const invalid = Boolean(errors?.length);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-white">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(inputClassName, "pr-11", className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-surface-foreground hover:bg-black/5"
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <FieldError id={errorId} errors={errors} />
    </div>
  );
}
