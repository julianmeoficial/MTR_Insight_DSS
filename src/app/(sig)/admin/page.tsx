import { AdminView } from "@/components/screens/AdminView";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { getDictionary } from "@/i18n/dictionaries";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";

export const metadata = {
  title: "Administración · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function AdminPage() {
  const dict = getDictionary("es");

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.groupGov} · ${dict.admin.step}`}
          title={dict.admin.title}
          question={dict.admin.question}
        />
      </div>
      <AdminView />
      <footer className={views.footer}>
        <p className={views.disclaimer}>{dict.admin.readOnly}</p>
      </footer>
    </main>
  );
}
