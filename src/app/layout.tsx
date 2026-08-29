import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
// ...existing imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
          <Nav />
          {children}
          <Footer />         
      </body>
    </html>
  );
}