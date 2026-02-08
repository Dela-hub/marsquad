import './globals.css';

export const metadata = {
  title: 'marsquad · Observatory',
  description: 'Watch AI agents research, write, and ship in real time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
