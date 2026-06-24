import { ToastProvider } from "@/components/ui/toast";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
