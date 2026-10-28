"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { OpsScope } from "@/config/operators";
import styles from "./filters.module.css";

type Props = {
  value: OpsScope;
  nacionalLabel: string;
  internacionalLabel: string;
  ariaLabel: string;
};

export function OpsScopeSwitch({
  value,
  nacionalLabel,
  internacionalLabel,
  ariaLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: OpsScope) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "nacional") params.delete("op");
    else params.set("op", next);
    // Drop operator/route filters that belong to the other scope.
    params.delete("operador");
    params.delete("ruta");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className={styles.scopeSwitch}>
      <SegmentedControl
        ariaLabel={ariaLabel}
        value={value}
        onChange={onChange}
        options={[
          { value: "nacional", label: nacionalLabel },
          { value: "internacional", label: internacionalLabel },
        ]}
      />
    </div>
  );
}
