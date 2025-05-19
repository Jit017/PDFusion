"use client"

import Navbar from "@/components/navbar"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"

export default function FAQPage() {
  // Define the FAQ items
  const faqItems = [
    {
      question: "Is PDFusion completely free to use?",
      answer: "Yes, PDFusion is completely free to use. There are no hidden fees, subscriptions, or in-app purchases. All features are available without any limitations."
    },
    {
      question: "Are my PDF files uploaded to any server?",
      answer: "No, PDFusion processes all files directly in your browser using JavaScript. Your files are never uploaded to any server, ensuring complete privacy and security."
    },
    {
      question: "How many PDF files can I merge at once?",
      answer: "While there's no hard limit set by the application, the practical limit depends on your browser's memory and your device capabilities. Most modern browsers can handle merging dozens of PDF files without issues."
    },
    {
      question: "What's the maximum file size PDFusion can handle?",
      answer: "The maximum file size is determined by your browser and device memory. Generally, PDFusion can handle files up to several hundred megabytes, but performance may vary based on your computer specifications."
    },
    {
      question: "Does PDFusion work on mobile devices?",
      answer: "Yes, PDFusion works on most modern mobile browsers. However, for the best experience with larger files, we recommend using a desktop or laptop computer."
    },
    {
      question: "Can I password protect my merged PDF files?",
      answer: "Yes, PDFusion provides options to set both user and owner passwords for your PDFs. You can also set specific permissions like printing, copying, and editing."
    },
    {
      question: "How do I select specific pages to include in the merged PDF?",
      answer: "After uploading your files, expand each file's options by clicking the down arrow. You'll see thumbnails of each page with checkboxes that allow you to select or deselect individual pages."
    },
    {
      question: "Can I rotate pages in my PDF documents?",
      answer: "Yes, PDFusion allows you to rotate individual pages clockwise or counter-clockwise. This feature is available in the page selection view after expanding a file's options."
    },
    {
      question: "Does PDFusion compress the output PDF file?",
      answer: "By default, PDFusion maintains the original quality of your files. However, you can enable compression options and choose between low, medium, and high compression levels to reduce the file size if needed."
    },
    {
      question: "Can I edit the content of PDF files with PDFusion?",
      answer: "PDFusion currently doesn't support editing the content inside PDF files. It focuses on merging, splitting, rotating pages, and setting document properties. For content editing, you would need a different specialized tool."
    },
    {
      question: "What browsers are supported by PDFusion?",
      answer: "PDFusion works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for the best experience."
    },
    {
      question: "Does PDFusion work offline?",
      answer: "Yes, once the page has fully loaded, PDFusion can work completely offline. You can disconnect from the internet and continue using all features of the application."
    },
    {
      question: "How do I split a PDF into multiple files?",
      answer: "Use the 'Split PDF' tab in the application. You can choose to extract all pages individually, specify page ranges, or split the document at regular intervals."
    },
    {
      question: "Can I reorder files before merging them?",
      answer: "Yes, you can drag and drop the files to reorder them before merging. The files will be combined in the order they appear in the list, from top to bottom."
    }
  ]

  // State to track which FAQ items are expanded
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  // Toggle FAQ item expansion
  const toggleItem = (index: number) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter(item => item !== index))
    } else {
      setExpandedItems([...expandedItems, index])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      
      <main className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find answers to common questions about PDFusion and how to use it effectively.
          </p>
        </div>
        
        <div className="space-y-4 mb-16">
          {faqItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h3 className="text-lg font-medium">{item.question}</h3>
                {expandedItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-purple-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-600" />
                )}
              </button>
              
              {expandedItems.includes(index) && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 dark:text-gray-300">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're always looking to improve PDFusion. If you have any questions or feedback that wasn't covered here, please reach out to us.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="https://github.com/Jit017/PDFusion" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="text-base py-4 px-6 rounded-lg">
                Open an Issue on GitHub
              </Button>
            </a>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base py-4 px-6 rounded-lg">
                Try PDFusion Now
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 