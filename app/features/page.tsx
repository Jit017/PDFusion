"use client"

import Navbar from "@/components/navbar"
import { Check, FileText, Lock, Sliders, Repeat, Image, ScrollText, RotateCw, FileDown, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function FeaturesPage() {
  // Define feature list with icons, titles, and descriptions
  const features = [
    {
      icon: <FileText className="h-10 w-10 text-purple-600" />,
      title: "PDF Merging",
      description: "Combine multiple PDF files into a single document. Reorder pages by dragging and dropping files to arrange them in your preferred order."
    },
    {
      icon: <Scissors className="h-10 w-10 text-pink-600" />,
      title: "PDF Splitting",
      description: "Extract individual pages or split PDF files into multiple documents. Choose from various split methods including all pages, page ranges, or every N pages."
    },
    {
      icon: <Image className="h-10 w-10 text-blue-600" />,
      title: "PDF Preview",
      description: "View thumbnails of your PDF pages before processing. Open a full preview to ensure you're working with the right documents."
    },
    {
      icon: <ScrollText className="h-10 w-10 text-green-600" />,
      title: "Page Selection",
      description: "Choose specific pages from each document to include in your final PDF, giving you full control over the merged result."
    },
    {
      icon: <RotateCw className="h-10 w-10 text-orange-600" />,
      title: "Page Rotation",
      description: "Rotate individual pages clockwise or counter-clockwise to correct orientation issues in your documents."
    },
    {
      icon: <Lock className="h-10 w-10 text-red-600" />,
      title: "Password Protection",
      description: "Securely encrypt your PDFs with user and owner passwords. Set granular permissions to control printing, copying, and editing capabilities."
    },
    {
      icon: <Sliders className="h-10 w-10 text-indigo-600" />,
      title: "Compression Options",
      description: "Reduce file size with adjustable compression settings. Choose from low, medium, or high compression levels to balance quality and size."
    },
    {
      icon: <Repeat className="h-10 w-10 text-cyan-600" />,
      title: "Metadata Editor",
      description: "Edit document properties including title, author, subject, and keywords to keep your PDFs properly cataloged."
    },
    {
      icon: <FileDown className="h-10 w-10 text-yellow-600" />,
      title: "Custom Filename",
      description: "Set your own filename for the output document, making it easy to organize your files after processing."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      
      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
            Powerful PDF Tools at Your Fingertips
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            PDFusion offers a comprehensive suite of tools to manage, modify, and secure your PDF documents—all directly in your browser with no file uploads needed.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your PDF workflows?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium text-lg py-6 px-8 rounded-xl">
                Try PDFusion Now
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" className="text-lg py-6 px-8 rounded-xl">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-24 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">100% Secure & Private</h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            Your files are processed entirely in your browser. They are never uploaded to any server, ensuring complete privacy and security. PDFusion works offline once the page has loaded.
          </p>
        </div>
      </main>
    </div>
  )
} 