import { notFound } from "next/navigation";
import { UiPrimitivesPlayground } from "./UiPrimitivesPlayground";

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <UiPrimitivesPlayground />;
}
