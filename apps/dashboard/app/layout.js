import './globals.css';
export const metadata = {
  title: 'API Platform | Overview',
  description: 'Local academic API management prototype',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
