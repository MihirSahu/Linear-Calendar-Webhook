import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linear Calendar Webhook",
  description:
    "A site for the self-hosted Linear webhook service that creates Google Calendar events and captures Linear issues from iMessage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
