import '../../globals.css';

export const metadata = {
  title: 'Observatory Embed',
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="embed-body">{children}</body>
    </html>
  );
}
