import Navbar from "./Navbar";
import { ThemeProvider } from "../theme";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen pb-10">
        <Navbar />
        <main className="mx-auto mt-6 flex w-[95%] max-w-6xl flex-col gap-4">{children}</main>
      </div>
    </ThemeProvider>
  );
}

