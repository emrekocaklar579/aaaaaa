import type React from "react"
import "@/styles/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Custom Video Player",
  description: "A custom HLS video player with Daply branding",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-black`}>{children}</body>
    </html>
  )
}
