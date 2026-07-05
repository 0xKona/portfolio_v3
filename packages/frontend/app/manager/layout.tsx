import { AuthGuard } from "@/components/auth/auth-guard";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
