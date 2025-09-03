import "./globals.css";
import AuthProvider from "./components/AuthProvider";

export const metadata = {
  title: "GitInsights - GitHub Repository Insights API",
  description: "Get comprehensive insights into any GitHub repository with our powerful API. Track stars, monitor activity, and discover cool facts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
