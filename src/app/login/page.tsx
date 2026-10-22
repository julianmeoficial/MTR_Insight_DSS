import type { Metadata } from "next";
import { LoginScreen } from "@/components/access/LoginScreen";

export const metadata: Metadata = {
  title: "Entrar · MTR Insight",
};

export default function LoginPage() {
  return <LoginScreen />;
}
