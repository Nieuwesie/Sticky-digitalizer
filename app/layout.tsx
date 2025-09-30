export const metadata = {
  title: "Sticky Digitizer",
  description: "Minimal sticky-note digitizer with connectors & background capture."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
