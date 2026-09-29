import type { Metadata } from "next";
import { Big_Shoulders, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GlobalSearch from "@/components/GlobalSearch";
import { auth, signOut } from "@/lib/auth";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"]
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"]
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "NSDE Delivery Platform",
  description: "Track Khel Setu software projects",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="en">
      <body className={`${bigShoulders.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} antialiased m-0 p-0`}>
        {user && <GlobalSearch />}
        {children}
        {user && (
          <form
            className="fixed bottom-3 right-3 z-40 print:hidden"
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-full bg-[#121519] text-[#F2EEE5] text-[13px] font-bold shadow-md hover:bg-black"
            >
              Sign out{user.name ? ` · ${user.name}` : ''}
            </button>
          </form>
        )}
      </body>
    </html>
  );
}
