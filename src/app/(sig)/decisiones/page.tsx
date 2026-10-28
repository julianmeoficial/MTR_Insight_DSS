import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/dictionaries";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Decisiones · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function DecisionesPage() {
  const dict = getDictionary("es");

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.nav.groupDss}
          title={dict.screens.decisions.title}
          question={dict.screens.decisions.purpose}
        />
        <div className={styles.lockedPanel}>
          <EmptyState
            title={dict.states.locked}
            body={dict.dss.decisionsLocked}
          />
        </div>
      </div>
    </main>
  );
}
