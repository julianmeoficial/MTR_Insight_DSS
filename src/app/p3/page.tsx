import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";
import { getScreen } from "@/lib/screens";

export default function P3Page() {
  return <ScreenPlaceholder screen={getScreen("P3")!} />;
}
