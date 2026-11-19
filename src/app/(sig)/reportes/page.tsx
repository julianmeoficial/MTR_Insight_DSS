import { ReportsOverview } from "@/components/reports/ReportScreens";

export const metadata = {
  title: "Informes · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function ReportesPage() {
  return <ReportsOverview />;
}
