import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";
import { getScreen } from "@/lib/screens";

export default function P6Page() {
  return <ScreenPlaceholder screen={getScreen("P6")!} />;
}
