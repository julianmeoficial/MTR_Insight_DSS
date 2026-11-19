import { ReportDetail } from "@/components/reports/ReportScreens";

export const metadata = {
  title: "Informe de cumplimiento · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

type Props = { searchParams: Promise<{ imprimir?: string }> };

export default function Page({ searchParams }: Props) {
  return <ReportDetail id="cumplimiento" searchParams={searchParams} />;
}
