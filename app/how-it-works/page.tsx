"use client"

import Navbar from "@/components/navbar"
import { FileUp, MoveVertical, Settings, FileDown, Scissors, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function HowItWorksPage() {
  // Define the step-by-step process
  const mergeSteps = [
    {
      icon: <FileUp className="h-12 w-12 text-purple-600" />,
      title: "Upload Your PDFs",
      description: "Drag and drop your PDF files into the upload area or click to browse your device. You can upload multiple files at once.",
      image: "/merge-step1.png" // Placeholder image path
    },
    {
      icon: <MoveVertical className="h-12 w-12 text-pink-600" />,
      title: "Arrange Your Documents",
      description: "Drag and drop your files to set their order. Select specific pages from each document that you want to include in the final PDF.",
      image: "/merge-step2.png" // Placeholder image path
    },
    {
      icon: <Settings className="h-12 w-12 text-blue-600" />,
      title: "Customize Options",
      description: "Configure optional settings like metadata, page rotation, password protection, and compression level to suit your needs.",
      image: "/merge-step3.png" // Placeholder image path
    },
    {
      icon: <FileDown className="h-12 w-12 text-green-600" />,
      title: "Download Your PDF",
      description: "Click the merge button to process your files and download the combined PDF instantly. No waiting for server processing!",
      image: "/merge-step4.png" // Placeholder image path
    }
  ]

  const splitSteps = [
    {
      icon: <FileUp className="h-12 w-12 text-purple-600" />,
      title: "Upload Your PDF",
      description: "Select the PDF file you want to split into multiple documents.",
      image: "/split-step1.png" // Placeholder image path
    },
    {
      icon: <Scissors className="h-12 w-12 text-pink-600" />,
      title: "Choose Split Method",
      description: "Select how you want to split your document: by individual pages, page ranges, or at regular intervals.",
      image: "/split-step2.png" // Placeholder image path
    },
    {
      icon: <File className="h-12 w-12 text-blue-600" />,
      title: "Set Options",
      description: "Configure options like output filenames and whether to include page numbers in the filenames.",
      image: "/split-step3.png" // Placeholder image path
    },
    {
      icon: <FileDown className="h-12 w-12 text-green-600" />,
      title: "Download Split Files",
      description: "Process the document and download your split PDFs individually or as a packaged set.",
      image: "/split-step4.png" // Placeholder image path
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      
      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
            How PDFusion Works
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Our intuitive workflow makes managing PDF documents simple and efficient, all within your browser.
          </p>
        </div>
        
        {/* Merge PDFs Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Merging PDFs</h2>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <ol className="relative border-l border-gray-300 dark:border-gray-700 ml-3">
                {mergeSteps.map((step, index) => (
                  <li key={index} className="mb-12 ml-6">
                    <span className="absolute flex items-center justify-center w-10 h-10 rounded-full -left-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      {index + 1}
                    </span>
                    <div className="flex items-center mb-2">
                      {step.icon}
                      <h3 className="text-xl font-semibold ml-3">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                {/* Placeholder for an illustrated workflow image */}
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-center p-4">
                    Merge PDFs workflow illustration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Split PDFs Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Splitting PDFs</h2>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                {/* Placeholder for an illustrated workflow image */}
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-center p-4">
                    Split PDFs workflow illustration
                  </p>
                </div>
              </div>
            </div>
            
            <div className="order-1">
              <ol className="relative border-l border-gray-300 dark:border-gray-700 ml-3">
                {splitSteps.map((step, index) => (
                  <li key={index} className="mb-12 ml-6">
                    <span className="absolute flex items-center justify-center w-10 h-10 rounded-full -left-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      {index + 1}
                    </span>
                    <div className="flex items-center mb-2">
                      {step.icon}
                      <h3 className="text-xl font-semibold ml-3">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Privacy Details */}
        <section className="mb-16 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Privacy & Security</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">100% Browser-Based</h3>
              <p className="text-gray-600 dark:text-gray-300">
                PDFusion processes all files directly in your browser. Your PDFs never leave your device or get uploaded to any server.
              </p>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Works Offline</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Once the page has loaded, you can disconnect from the internet and still use all features of the application.
              </p>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Password Protection</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Any passwords you set for your PDF documents are applied locally and never transmitted over the network.
              </p>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium text-lg py-6 px-8 rounded-xl">
                Try PDFusion Now
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" className="text-lg py-6 px-8 rounded-xl">
                View FAQs
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 