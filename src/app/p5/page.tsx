import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";
import { getScreen } from "@/lib/screens";

export default function P5Page() {
  return <ScreenPlaceholder screen={getScreen("P5")!} />;
}
