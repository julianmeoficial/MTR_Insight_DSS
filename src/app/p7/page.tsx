import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";
import { getScreen } from "@/lib/screens";

export default function P7Page() {
  return <ScreenPlaceholder screen={getScreen("P7")!} />;
}
