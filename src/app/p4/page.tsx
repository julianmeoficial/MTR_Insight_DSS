import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";
import { getScreen } from "@/lib/screens";

export default function P4Page() {
  return <ScreenPlaceholder screen={getScreen("P4")!} />;
}
