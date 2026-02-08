export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="/office.css" />
      {children}
    </>
  );
}
