"use client"
import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Upload, FileUp, FileDown, Trash2, MoveVertical, FileText, 
  Check, X, ChevronDown, ChevronUp, Edit, Eye, RotateCw, RotateCcw, Scissors } from "lucide-react"
import { PDFDocument, StandardFonts, degrees } from "pdf-lib"
import { useToast } from "@/hooks/use-toast"
import Navbar from "@/components/navbar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Type for PDF file with additional metadata
interface PDFFileWithData {
  file: File
  name: string
  size: number
  type: string
  preview?: string
  pageCount?: number
  selectedPages?: boolean[]
  pageRotations?: number[]
  isExpanded?: boolean
}

// Type for PDF metadata
interface PDFMetadata {
  title: string
  author: string
  subject: string
  keywords: string
}

// Type for password protection
interface PasswordProtection {
  enableEncryption: boolean
  userPassword: string
  ownerPassword: string
  permissions: {
    printing: boolean
    modifying: boolean
    copying: boolean
    annotating: boolean
    fillingForms: boolean
    contentAccessibility: boolean
    documentAssembly: boolean
  }
}

// Type for compression options
interface CompressionOptions {
  enableCompression: boolean
  compressionLevel: 'low' | 'medium' | 'high'
}

// Type for split PDF options
interface SplitPDFOptions {
  splitMethod: 'all-pages' | 'page-ranges' | 'every-n-pages'
  pageRanges: string
  everyNPages: number
  includePageNumbers: boolean
}

// Convert File to ArrayBuffer using FileReader
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export default function PDFMerger() {
  const [files, setFiles] = useState<PDFFileWithData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [customFilename, setCustomFilename] = useState("merged-document")
  const [metadata, setMetadata] = useState<PDFMetadata>({
    title: "Merged Document",
    author: "",
    subject: "",
    keywords: ""
  })
  const [passwordProtection, setPasswordProtection] = useState<PasswordProtection>({
    enableEncryption: false,
    userPassword: "",
    ownerPassword: "",
    permissions: {
      printing: true,
      modifying: true,
      copying: true,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: true
    }
  })
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    enableCompression: false,
    compressionLevel: 'medium'
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // For the PDF Splitting tab
  const [splitFile, setSplitFile] = useState<PDFFileWithData | null>(null)
  const [splitOptions, setSplitOptions] = useState<SplitPDFOptions>({
    splitMethod: 'all-pages',
    pageRanges: '',
    everyNPages: 1,
    includePageNumbers: true
  })
  const [isSplitting, setIsSplitting] = useState(false)
  const splitFileInputRef = useRef<HTMLInputElement>(null)

  // Debug log on component mount
  useEffect(() => {
    console.log("PDF Merger component loaded")
  }, [])

  // Set up drag and drop event listeners
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.target === dropZone) {
        setIsDragging(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer?.files) {
        handleFiles(Array.from(e.dataTransfer.files))
      }
    }

    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragenter', handleDragEnter)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('dragenter', handleDragEnter)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('drop', handleDrop)
    }
  }, [])

  // Generate PDF preview thumbnails and page data
  const generatePDFPreview = async (file: File): Promise<PDFFileWithData> => {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file)
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pageCount = pdfDoc.getPageCount()
      
      // Create selected pages array (all selected by default)
      const selectedPages = new Array(pageCount).fill(true)
      
      // Create rotation array (0 degrees for all pages by default)
      const pageRotations = new Array(pageCount).fill(0)
      
      // Create a thumbnail of the first page
      if (pageCount > 0) {
        const [firstPage] = pdfDoc.getPages()
        
        // Create a new document with just the first page for the thumbnail
        const thumbnailDoc = await PDFDocument.create()
        const [copiedPage] = await thumbnailDoc.copyPages(pdfDoc, [0])
        thumbnailDoc.addPage(copiedPage)
        
        // Convert to base64 for display
        const pdfBytes = await thumbnailDoc.saveAsBase64({ dataUri: true })
        
        // Create PDF file with data
        return {
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: pdfBytes,
          pageCount,
          selectedPages,
          pageRotations,
          isExpanded: false
        }
      }
      
      return {
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        pageCount,
        selectedPages,
        pageRotations,
        isExpanded: false
      }
    } catch (error) {
      console.error("Error generating preview:", error)
      return {
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        isExpanded: false
      }
    }
  }

  const handleFiles = async (fileList: File[]) => {
    console.log("Handling files:", fileList)
    const pdfFiles = fileList.filter(file => file.type === "application/pdf")
    console.log("Filtered PDF files:", pdfFiles)

    if (pdfFiles.length !== fileList.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are allowed",
        variant: "destructive",
      })
    }

    if (pdfFiles.length > 0) {
      // Process files to generate previews
      setIsProcessing(true)
      
      try {
        const filesWithPreview = await Promise.all(
          pdfFiles.map(file => generatePDFPreview(file))
        )
        
        setFiles(prev => [...prev, ...filesWithPreview])
      } catch (error) {
        console.error("Error processing files:", error)
        toast({
          title: "Error processing files",
          description: "Could not process some PDF files",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered", e.target.files)
    if (!e.target.files) return

    handleFiles(Array.from(e.target.files))
    e.target.value = ""
  }

  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return

      const items = Array.from(files)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      setFiles(items)
    },
    [files],
  )

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const togglePageSelection = (fileIndex: number, pageIndex: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles]
      if (newFiles[fileIndex].selectedPages) {
        newFiles[fileIndex].selectedPages![pageIndex] = !newFiles[fileIndex].selectedPages![pageIndex]
      }
      return newFiles
    })
  }

  const toggleExpandFile = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles]
      newFiles[index].isExpanded = !newFiles[index].isExpanded
      return newFiles
    })
  }

  const selectAllPages = (fileIndex: number, select: boolean) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles]
      if (newFiles[fileIndex].selectedPages) {
        newFiles[fileIndex].selectedPages = newFiles[fileIndex].selectedPages!.map(() => select)
      }
      return newFiles
    })
  }

  // Add a function to rotate a specific page
  const rotatePage = (fileIndex: number, pageIndex: number, direction: 'clockwise' | 'counterclockwise') => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles]
      if (!newFiles[fileIndex].pageRotations) {
        newFiles[fileIndex].pageRotations = new Array(newFiles[fileIndex].pageCount).fill(0)
      }
      
      // Calculate new rotation
      const currentRotation = newFiles[fileIndex].pageRotations![pageIndex]
      const rotationChange = direction === 'clockwise' ? 90 : -90
      
      // Update rotation (keep it between 0 and 270 degrees)
      let newRotation = (currentRotation + rotationChange) % 360
      if (newRotation < 0) newRotation += 360
      
      newFiles[fileIndex].pageRotations![pageIndex] = newRotation
      return newFiles
    })
  }

  const mergePDFs = async () => {
    console.log("Merge PDFs triggered with files:", files)
    if (files.length === 0) {
      toast({
        title: "No files to merge",
        description: "Please upload at least one PDF file",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)
      console.log("Processing started")

      // Create a new PDF document
      const mergedPdf = await PDFDocument.create()
      console.log("Empty PDF document created")

      // Process each file
      for (const fileData of files) {
        console.log(`Processing file: ${fileData.name}`)
        try {
          const fileArrayBuffer = await readFileAsArrayBuffer(fileData.file)
          console.log(`File converted to ArrayBuffer, size: ${fileArrayBuffer.byteLength}`)
          
          const pdfDoc = await PDFDocument.load(fileArrayBuffer)
          console.log(`PDF loaded successfully, pages: ${pdfDoc.getPageCount()}`)
          
          // Only copy selected pages
          const selectedPageIndices = fileData.selectedPages
            ? fileData.selectedPages
                .map((selected, index) => (selected ? index : -1))
                .filter(index => index !== -1)
            : pdfDoc.getPageIndices()
          
          console.log(`Selected page indices: ${selectedPageIndices}`)
          
          if (selectedPageIndices.length > 0) {
            const copiedPages = await mergedPdf.copyPages(pdfDoc, selectedPageIndices)
            console.log(`Pages copied: ${copiedPages.length}`)
            
            // Add pages to the merged PDF with rotation applied
            copiedPages.forEach((page, i) => {
              const originalIndex = selectedPageIndices[i]
              
              // Apply rotation if specified
              if (fileData.pageRotations && fileData.pageRotations[originalIndex] !== 0) {
                const rotation = fileData.pageRotations[originalIndex]
                page.setRotation(degrees(rotation))
                console.log(`Applied rotation of ${rotation} degrees to page ${i}`)
              }
              
              mergedPdf.addPage(page)
            })
            
            console.log(`Pages added to merged document`)
          }
        } catch (fileError) {
          console.error(`Error processing file ${fileData.name}:`, fileError)
          throw new Error(`Error processing ${fileData.name}: ${fileError.message}`)
        }
      }

      // Add metadata to the merged PDF
      console.log("Adding metadata", metadata)
      mergedPdf.setTitle(metadata.title || "Merged Document")
      mergedPdf.setAuthor(metadata.author || "PDF Merger App")
      mergedPdf.setSubject(metadata.subject || "")
      mergedPdf.setKeywords(metadata.keywords.split(',').map(k => k.trim()) || [])
      
      // Apply password protection if enabled
      if (passwordProtection.enableEncryption) {
        console.log("Applying password protection")
        
        // Define the permissions needed by pdf-lib
        const permissions = {
          printing: passwordProtection.permissions.printing,
          modifying: passwordProtection.permissions.modifying,
          copying: passwordProtection.permissions.copying,
          annotating: passwordProtection.permissions.annotating,
          fillingForms: passwordProtection.permissions.fillingForms,
          contentAccessibility: passwordProtection.permissions.contentAccessibility,
          documentAssembly: passwordProtection.permissions.documentAssembly
        }
        
        // Prepare PDF save options with compression settings
        const pdfSaveOptions: any = {}
        
        if (compressionOptions.enableCompression) {
          console.log(`Applying compression level: ${compressionOptions.compressionLevel}`)
          
          // Set compression level based on selected option
          switch (compressionOptions.compressionLevel) {
            case 'low':
              pdfSaveOptions.objectsPerTick = 50
              pdfSaveOptions.compress = true
              break
            case 'medium':
              pdfSaveOptions.objectsPerTick = 100
              pdfSaveOptions.compress = true
              break
            case 'high':
              pdfSaveOptions.objectsPerTick = 200
              pdfSaveOptions.compress = true
              break
          }
        }
        
        try {
          // According to pdf-lib docs, we need to provide encryption options during save
          if (passwordProtection.userPassword || passwordProtection.ownerPassword) {
            console.log("Applying password protection directly during save")
            
            // Make sure we have both passwords set - use userPassword for ownerPassword if ownerPassword is empty
            // This ensures proper protection as per PDF specification
            const userPwd = passwordProtection.userPassword || "";
            const ownerPwd = passwordProtection.ownerPassword || userPwd;
            
            // Save PDF with encryption applied directly in save options
            const encryptionOptions = {
              userPassword: userPwd || undefined,
              ownerPassword: ownerPwd || undefined,
              permissions
            }
            
            // Combine save options with encryption options
            const saveOptions = {
              ...pdfSaveOptions,
              ...encryptionOptions
            }
            
            // Save with encryption in one step
            const mergedPdfBytes = await mergedPdf.save(saveOptions);
            
            // Create a blob from the PDF bytes
            const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
            console.log("Blob created with encryption")
            
            // Create a download link with custom filename
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${customFilename || "merged-document"}.pdf`;
            console.log("Download link created", link.href);
            link.click();
            console.log("Download triggered");
            
            toast({
              title: "Success!",
              description: "Your PDFs have been merged successfully with password protection",
            });
            
            return; // Early return since we've handled the download
          }
          
          console.log("No passwords provided, skipping encryption");
        } catch (error) {
          console.error("Error applying encryption:", error);
          toast({
            title: "Warning",
            description: "Could not apply password protection to the PDF. Continuing without encryption.",
            variant: "destructive",
          });
        }
      }
      
      // Save the merged PDF with compression settings if enabled
      console.log("Saving merged PDF")

      // We already defined pdfSaveOptions above if encryption was enabled
      // Otherwise define it here
      if (!passwordProtection.enableEncryption) {
        // Compression options
        const pdfSaveOptions: any = {}
        
        if (compressionOptions.enableCompression) {
          console.log(`Applying compression level: ${compressionOptions.compressionLevel}`)
          
          // Set compression level based on selected option
          switch (compressionOptions.compressionLevel) {
            case 'low':
              pdfSaveOptions.objectsPerTick = 50
              pdfSaveOptions.compress = true
              break
            case 'medium':
              pdfSaveOptions.objectsPerTick = 100
              pdfSaveOptions.compress = true
              break
            case 'high':
              pdfSaveOptions.objectsPerTick = 200
              pdfSaveOptions.compress = true
              break
          }
        }
        
        const mergedPdfBytes = await mergedPdf.save(pdfSaveOptions)
        console.log(`Merged PDF saved, size: ${mergedPdfBytes.length} bytes`)

        // Create a blob from the PDF bytes
        const blob = new Blob([mergedPdfBytes], { type: "application/pdf" })
        console.log("Blob created")

        // Create a download link with custom filename
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${customFilename || "merged-document"}.pdf`
        console.log("Download link created", link.href)
        link.click()
        console.log("Download triggered")

        toast({
          title: "Success!",
          description: "Your PDFs have been merged successfully",
        })
      }
    } catch (error) {
      console.error("Error merging PDFs:", error)
      toast({
        title: "Error merging PDFs",
        description: `There was an error merging your PDFs: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      console.log("Processing finished")
    }
  }

  // Function to handle split file upload
  const handleSplitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are allowed",
        variant: "destructive",
      })
      e.target.value = ""
      return
    }
    
    setIsSplitting(true)
    
    try {
      const processedFile = await generatePDFPreview(file)
      setSplitFile(processedFile)
    } catch (error) {
      console.error("Error processing split file:", error)
      toast({
        title: "Error processing file",
        description: "Could not process the PDF file",
        variant: "destructive",
      })
    } finally {
      setIsSplitting(false)
      e.target.value = ""
    }
  }
  
  // Clear the split file
  const clearSplitFile = () => {
    setSplitFile(null)
  }
  
  // Function to split PDF
  const splitPDF = async () => {
    if (!splitFile) {
      toast({
        title: "No file to split",
        description: "Please upload a PDF file to split",
        variant: "destructive",
      })
      return
    }
    
    setIsSplitting(true)
    
    try {
      // Load the PDF document
      const fileArrayBuffer = await readFileAsArrayBuffer(splitFile.file)
      const pdfDoc = await PDFDocument.load(fileArrayBuffer)
      const pageCount = pdfDoc.getPageCount()
      
      // Parse page ranges based on split method
      let pagesToExtract: number[][] = []
      
      switch (splitOptions.splitMethod) {
        case 'all-pages':
          // One array per page
          pagesToExtract = Array.from({ length: pageCount }, (_, i) => [i])
          break
          
        case 'page-ranges':
          // Parse page ranges like "1-3, 5, 7-9"
          try {
            const ranges = splitOptions.pageRanges.split(',').map(range => range.trim())
            
            for (const range of ranges) {
              if (range.includes('-')) {
                // Range of pages
                const [start, end] = range.split('-').map(num => parseInt(num.trim()) - 1)
                
                if (isNaN(start) || isNaN(end) || start < 0 || end >= pageCount || start > end) {
                  throw new Error(`Invalid page range: ${range}`)
                }
                
                // One array for the entire range
                pagesToExtract.push(Array.from({ length: end - start + 1 }, (_, i) => start + i))
              } else {
                // Single page
                const pageIndex = parseInt(range) - 1
                
                if (isNaN(pageIndex) || pageIndex < 0 || pageIndex >= pageCount) {
                  throw new Error(`Invalid page number: ${range}`)
                }
                
                pagesToExtract.push([pageIndex])
              }
            }
          } catch (error) {
            throw new Error(`Invalid page range format: ${error.message}`)
          }
          break
          
        case 'every-n-pages':
          // Group pages by N
          for (let i = 0; i < pageCount; i += splitOptions.everyNPages) {
            const end = Math.min(i + splitOptions.everyNPages - 1, pageCount - 1)
            pagesToExtract.push(Array.from({ length: end - i + 1 }, (_, index) => i + index))
          }
          break
      }
      
      // Create and download split PDFs
      let zipFiles = []
      
      for (let i = 0; i < pagesToExtract.length; i++) {
        const pageIndices = pagesToExtract[i]
        
        // Create a new PDF document
        const newPdf = await PDFDocument.create()
        
        // Copy pages from the original PDF
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices)
        
        // Add pages to the new PDF
        copiedPages.forEach(page => newPdf.addPage(page))
        
        // Generate name for the split PDF
        let filename: string
        
        if (splitOptions.splitMethod === 'all-pages') {
          // Single page per file
          if (splitOptions.includePageNumbers) {
            filename = `${splitFile.name.replace('.pdf', '')}_page_${pageIndices[0] + 1}.pdf`
          } else {
            filename = `${splitFile.name.replace('.pdf', '')}_${i + 1}.pdf`
          }
        } else {
          // Multiple pages per file
          if (splitOptions.includePageNumbers) {
            const firstPage = pageIndices[0] + 1
            const lastPage = pageIndices[pageIndices.length - 1] + 1
            filename = `${splitFile.name.replace('.pdf', '')}_pages_${firstPage}-${lastPage}.pdf`
          } else {
            filename = `${splitFile.name.replace('.pdf', '')}_part_${i + 1}.pdf`
          }
        }
        
        // Save the PDF
        const pdfBytes = await newPdf.save()
        
        // Create a blob and download the file
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        
        // Either download directly or add to zip
        if (pagesToExtract.length === 1) {
          // Only one file, download directly
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = filename
          link.click()
        } else {
          // Multiple files, prepare for zip
          zipFiles.push({ filename, blob })
        }
      }
      
      // If multiple files, create a zip and download
      if (zipFiles.length > 1) {
        // Instead of importing a zip library, we'll just download files individually
        // In a production app, you'd use JSZip or similar library here
        
        toast({
          title: "Downloading multiple files",
          description: `${zipFiles.length} files will download individually`,
        })
        
        // Download each file with a slight delay to prevent browser blocking
        zipFiles.forEach((file, index) => {
          setTimeout(() => {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(file.blob)
            link.download = file.filename
            link.click()
          }, index * 500) // 500ms delay between downloads
        })
      }
      
      toast({
        title: "Success!",
        description: `Split PDF into ${pagesToExtract.length} file(s)`,
      })
    } catch (error) {
      console.error("Error splitting PDF:", error)
      toast({
        title: "Error splitting PDF",
        description: error.message || "There was an error splitting your PDF",
        variant: "destructive",
      })
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />

      <main className="container mx-auto py-10 px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            PDF Tools
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Combine, split, and manage your PDF files with ease.
          </p>
        </div>

        <Tabs defaultValue="merge" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="merge" className="text-lg py-3">Merge PDFs</TabsTrigger>
            <TabsTrigger value="split" className="text-lg py-3">Split PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="merge">
            <Tabs defaultValue="upload" className="mb-12">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="upload" className="text-lg py-3">Upload Files</TabsTrigger>
                <TabsTrigger value="settings" className="text-lg py-3">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="flex flex-col justify-center">
                    <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4">
                          <FileUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Upload Your PDFs</h3>
                          <p className="text-gray-600 dark:text-gray-400">Select multiple PDF files to combine</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/30 p-3 rounded-full mr-4">
                          <MoveVertical className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Arrange Your Files</h3>
                          <p className="text-gray-600 dark:text-gray-400">Drag and drop to set the order</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mr-4">
                          <FileDown className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Download Result</h3>
                          <p className="text-gray-600 dark:text-gray-400">Get your merged PDF instantly</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div
                          ref={dropZoneRef}
                          className={`border-2 border-dashed rounded-xl p-10 text-center 
                          ${isDragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900'}
                          transition-all duration-300 hover:shadow-inner`}
                        >
                          <div className="mb-6">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <Upload className="h-10 w-10 text-white" />
                            </div>
                          </div>
                          <div className="mb-6">
                            <h3 className="text-xl font-bold mb-2">Drop your PDFs here</h3>
                            <p className="text-gray-500 dark:text-gray-400">or use the button below</p>
                          </div>
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileUp className="mr-2 h-5 w-5" />
                            Select PDF Files
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <Tabs defaultValue="general">
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="general" className="text-base py-2">General</TabsTrigger>
                        <TabsTrigger value="security" className="text-base py-2">Security</TabsTrigger>
                        <TabsTrigger value="compression" className="text-base py-2">Compression</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="general">
                        <h2 className="text-2xl font-bold mb-6">Output Settings</h2>
                        <div className="space-y-4">
                          <div className="grid gap-3">
                            <Label htmlFor="filename">Output Filename</Label>
                            <Input
                              id="filename"
                              placeholder="merged-document"
                              value={customFilename}
                              onChange={(e) => setCustomFilename(e.target.value)}
                            />
                          </div>
                          
                          <div className="grid gap-3">
                            <Label htmlFor="title">Document Title</Label>
                            <Input
                              id="title"
                              placeholder="Merged Document"
                              value={metadata.title}
                              onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid gap-3">
                            <Label htmlFor="author">Author</Label>
                            <Input
                              id="author"
                              placeholder="Author name"
                              value={metadata.author}
                              onChange={(e) => setMetadata({...metadata, author: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid gap-3">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              placeholder="Subject or description"
                              value={metadata.subject}
                              onChange={(e) => setMetadata({...metadata, subject: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid gap-3">
                            <Label htmlFor="keywords">Keywords</Label>
                            <Input
                              id="keywords"
                              placeholder="keyword1, keyword2, keyword3"
                              value={metadata.keywords}
                              onChange={(e) => setMetadata({...metadata, keywords: e.target.value})}
                            />
                            <p className="text-xs text-gray-500">Separate keywords with commas</p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="security">
                        <h2 className="text-2xl font-bold mb-6">PDF Security</h2>
                        <div className="space-y-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="enableEncryption" 
                              checked={passwordProtection.enableEncryption}
                              onCheckedChange={(checked) => 
                                setPasswordProtection({
                                  ...passwordProtection,
                                  enableEncryption: checked === true
                                })
                              }
                            />
                            <Label htmlFor="enableEncryption" className="font-medium">Enable Password Protection</Label>
                          </div>
                          
                          {passwordProtection.enableEncryption && (
                            <div className="space-y-4 pl-6 border-l-2 border-purple-200 dark:border-purple-800">
                              <div className="grid gap-3">
                                <Label htmlFor="userPassword">User Password (for opening)</Label>
                                <Input
                                  id="userPassword"
                                  type="password"
                                  placeholder="Leave blank for no password"
                                  value={passwordProtection.userPassword}
                                  onChange={(e) => setPasswordProtection({
                                    ...passwordProtection,
                                    userPassword: e.target.value
                                  })}
                                />
                                <p className="text-xs text-gray-500">Required to open the document</p>
                              </div>
                              
                              <div className="grid gap-3">
                                <Label htmlFor="ownerPassword">Owner Password (for full access)</Label>
                                <Input
                                  id="ownerPassword"
                                  type="password"
                                  placeholder="Leave blank to use user password"
                                  value={passwordProtection.ownerPassword}
                                  onChange={(e) => setPasswordProtection({
                                    ...passwordProtection,
                                    ownerPassword: e.target.value
                                  })}
                                />
                                <p className="text-xs text-gray-500">Provides full rights to the document</p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="font-medium">User Permissions</Label>
                                <p className="text-xs text-gray-500 mb-3">
                                  These permissions apply to users who open the document with the user password
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="permPrinting" 
                                      checked={passwordProtection.permissions.printing}
                                      onCheckedChange={(checked) => 
                                        setPasswordProtection({
                                          ...passwordProtection,
                                          permissions: {
                                            ...passwordProtection.permissions,
                                            printing: checked === true
                                          }
                                        })
                                      }
                                    />
                                    <Label htmlFor="permPrinting">Allow Printing</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="permModifying" 
                                      checked={passwordProtection.permissions.modifying}
                                      onCheckedChange={(checked) => 
                                        setPasswordProtection({
                                          ...passwordProtection,
                                          permissions: {
                                            ...passwordProtection.permissions,
                                            modifying: checked === true
                                          }
                                        })
                                      }
                                    />
                                    <Label htmlFor="permModifying">Allow Modifying</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="permCopying" 
                                      checked={passwordProtection.permissions.copying}
                                      onCheckedChange={(checked) => 
                                        setPasswordProtection({
                                          ...passwordProtection,
                                          permissions: {
                                            ...passwordProtection.permissions,
                                            copying: checked === true
                                          }
                                        })
                                      }
                                    />
                                    <Label htmlFor="permCopying">Allow Copying</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="permAnnotating" 
                                      checked={passwordProtection.permissions.annotating}
                                      onCheckedChange={(checked) => 
                                        setPasswordProtection({
                                          ...passwordProtection,
                                          permissions: {
                                            ...passwordProtection.permissions,
                                            annotating: checked === true
                                          }
                                        })
                                      }
                                    />
                                    <Label htmlFor="permAnnotating">Allow Annotations</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="permForms" 
                                      checked={passwordProtection.permissions.fillingForms}
                                      onCheckedChange={(checked) => 
                                        setPasswordProtection({
                                          ...passwordProtection,
                                          permissions: {
                                            ...passwordProtection.permissions,
                                            fillingForms: checked === true
                                          }
                                        })
                                      }
                                    />
                                    <Label htmlFor="permForms">Allow Form Filling</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="permAccessibility" 
                                      checked={passwordProtection.permissions.contentAccessibility}
                                      onCheckedChange={(checked) => 
                                        setPasswordProtection({
                                          ...passwordProtection,
                                          permissions: {
                                            ...passwordProtection.permissions,
                                            contentAccessibility: checked === true
                                          }
                                        })
                                      }
                                    />
                                    <Label htmlFor="permAccessibility">Allow Accessibility</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="permAssembly" 
                                      checked={passwordProtection.permissions.documentAssembly}
                                      onCheckedChange={(checked) => 
                                        setPasswordProtection({
                                          ...passwordProtection,
                                          permissions: {
                                            ...passwordProtection.permissions,
                                            documentAssembly: checked === true
                                          }
                                        })
                                      }
                                    />
                                    <Label htmlFor="permAssembly">Allow Document Assembly</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="compression">
                        <h2 className="text-2xl font-bold mb-6">Compression Settings</h2>
                        <div className="space-y-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="enableCompression" 
                              checked={compressionOptions.enableCompression}
                              onCheckedChange={(checked) => 
                                setCompressionOptions({
                                  ...compressionOptions,
                                  enableCompression: checked === true
                                })
                              }
                            />
                            <Label htmlFor="enableCompression" className="font-medium">Enable PDF Compression</Label>
                          </div>
                          
                          {compressionOptions.enableCompression && (
                            <div className="space-y-4 pl-6 border-l-2 border-purple-200 dark:border-purple-800">
                              <div className="space-y-3">
                                <Label htmlFor="compressionLevel">Compression Level</Label>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="compressionLow"
                                      checked={compressionOptions.compressionLevel === 'low'}
                                      onChange={() => setCompressionOptions({
                                        ...compressionOptions,
                                        compressionLevel: 'low'
                                      })}
                                      className="h-4 w-4 text-purple-600"
                                    />
                                    <Label htmlFor="compressionLow">Low</Label>
                                    <span className="text-xs text-gray-500 ml-2">
                                      (Moderate file size reduction, best quality)
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="compressionMedium"
                                      checked={compressionOptions.compressionLevel === 'medium'}
                                      onChange={() => setCompressionOptions({
                                        ...compressionOptions,
                                        compressionLevel: 'medium'
                                      })}
                                      className="h-4 w-4 text-purple-600"
                                    />
                                    <Label htmlFor="compressionMedium">Medium</Label>
                                    <span className="text-xs text-gray-500 ml-2">
                                      (Good balance of size and quality)
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="compressionHigh"
                                      checked={compressionOptions.compressionLevel === 'high'}
                                      onChange={() => setCompressionOptions({
                                        ...compressionOptions,
                                        compressionLevel: 'high'
                                      })}
                                      className="h-4 w-4 text-purple-600"
                                    />
                                    <Label htmlFor="compressionHigh">High</Label>
                                    <span className="text-xs text-gray-500 ml-2">
                                      (Maximum file size reduction, may affect quality)
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Compression Info
                                </h4>
                                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                                  Higher compression levels may reduce image quality but create smaller file sizes. 
                                  For documents with many images, consider using lower compression to maintain quality.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {files.length > 0 && (
              <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Your Files ({files.length})</h2>
                  <Button
                    onClick={mergePDFs}
                    disabled={isProcessing}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-5 w-5" />
                        Merge & Download
                      </>
                    )}
                  </Button>
                </div>

                <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="pdf-list">
                        {(provided) => (
                          <ul
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="divide-y divide-gray-200 dark:divide-gray-700"
                          >
                            {files.map((file, index) => (
                              <Draggable key={`${file.name}-${index}`} draggableId={`${file.name}-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <li
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`transition-colors ${
                                      snapshot.isDragging 
                                        ? 'bg-purple-50 dark:bg-purple-900/20 shadow-lg' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                  >
                                    <div className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center flex-1 min-w-0">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="mr-4 cursor-move p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                          >
                                            <MoveVertical className="h-5 w-5 text-gray-500" />
                                          </div>
                                          
                                          {file.preview ? (
                                            <div className="flex-shrink-0 mr-4 relative">
                                              <img 
                                                src={file.preview}
                                                alt={`Preview of ${file.name}`}
                                                className="w-12 h-16 rounded object-cover border border-gray-200 dark:border-gray-700"
                                              />
                                              <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 rounded-sm">
                                                {file.pageCount} pg
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex-shrink-0 mr-4">
                                              <div className="w-12 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                              </div>
                                            </div>
                                          )}
                                          
                                          <div className="truncate flex-1">
                                            <p className="font-medium truncate">{file.name}</p>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              <span className="mr-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                              <span className="mr-2">•</span>
                                              <span className="mr-2">{file.pageCount || '?'} pages</span>
                                              <span className="mr-2">•</span>
                                              <span>
                                                {file.selectedPages?.filter(Boolean).length || 0} selected
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-1">
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Preview file"
                                                className="text-gray-500 hover:text-purple-500"
                                              >
                                                <Eye className="h-5 w-5" />
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                              <DialogHeader>
                                                <DialogTitle>Preview: {file.name}</DialogTitle>
                                              </DialogHeader>
                                              <div className="mt-4">
                                                <iframe 
                                                  src={file.preview} 
                                                  className="w-full h-[600px] rounded border border-gray-200 dark:border-gray-700"
                                                  title={`Preview of ${file.name}`}
                                                />
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                          
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleExpandFile(index)}
                                            aria-label="Expand file"
                                            className="text-gray-500"
                                          >
                                            {file.isExpanded ? (
                                              <ChevronUp className="h-5 w-5" />
                                            ) : (
                                              <ChevronDown className="h-5 w-5" />
                                            )}
                                          </Button>
                                          
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFile(index)}
                                            aria-label="Remove file"
                                            className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          >
                                            <Trash2 className="h-5 w-5" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {file.isExpanded && file.pageCount && file.pageCount > 0 && (
                                        <div className="mt-4 pl-10 border-t border-gray-100 dark:border-gray-800 pt-4">
                                          <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium">Page Selection</h4>
                                            <div className="flex space-x-2">
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => selectAllPages(index, true)}
                                                className="text-xs h-8"
                                              >
                                                <Check className="h-3 w-3 mr-1" /> Select All
                                              </Button>
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => selectAllPages(index, false)}
                                                className="text-xs h-8"
                                              >
                                                <X className="h-3 w-3 mr-1" /> Deselect All
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                                            {file.selectedPages?.map((selected, pageIndex) => (
                                              <div 
                                                key={`page-${pageIndex}`} 
                                                className={`border rounded p-2 text-center cursor-pointer transition-colors 
                                                  ${selected 
                                                    ? 'bg-purple-50 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700' 
                                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                                  }`}
                                                onClick={() => togglePageSelection(index, pageIndex)}
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <Checkbox
                                                    checked={selected}
                                                    onCheckedChange={() => togglePageSelection(index, pageIndex)}
                                                    className="ml-1"
                                                  />
                                                  <div className="flex space-x-1">
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-6 w-6"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        rotatePage(index, pageIndex, 'counterclockwise');
                                                      }}
                                                    >
                                                      <RotateCcw className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-6 w-6"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        rotatePage(index, pageIndex, 'clockwise');
                                                      }}
                                                    >
                                                      <RotateCw className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                <div className="text-xs font-medium">
                                                  Page {pageIndex + 1}
                                                </div>
                                                {file.pageRotations && file.pageRotations[pageIndex] > 0 && (
                                                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                    {file.pageRotations[pageIndex]}°
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </li>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </ul>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="split">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-4">Split PDF Files</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mr-4">
                      <FileUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Upload a PDF</h3>
                      <p className="text-gray-600 dark:text-gray-400">Select a PDF file to split</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
                      <Scissors className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Choose Split Method</h3>
                      <p className="text-gray-600 dark:text-gray-400">Split by individual pages or custom ranges</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
                      <FileDown className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Download Results</h3>
                      <p className="text-gray-600 dark:text-gray-400">Get your split PDF files instantly</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    {!splitFile ? (
                      <div
                        className="border-2 border-dashed rounded-xl p-10 text-center 
                        border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900
                        transition-all duration-300 hover:shadow-inner"
                      >
                        <div className="mb-6">
                          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Upload className="h-10 w-10 text-white" />
                          </div>
                        </div>
                        <div className="mb-6">
                          <h3 className="text-xl font-bold mb-2">Upload your PDF</h3>
                          <p className="text-gray-500 dark:text-gray-400">Choose a PDF file to split</p>
                        </div>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                          onClick={() => splitFileInputRef.current?.click()}
                        >
                          <FileUp className="mr-2 h-5 w-5" />
                          Select PDF File
                        </Button>
                        <input
                          ref={splitFileInputRef}
                          type="file"
                          accept="application/pdf"
                          onChange={handleSplitFileUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {splitFile.preview ? (
                              <div className="flex-shrink-0 mr-4 relative">
                                <img 
                                  src={splitFile.preview}
                                  alt={`Preview of ${splitFile.name}`}
                                  className="w-12 h-16 rounded object-cover border border-gray-200 dark:border-gray-700"
                                />
                                <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 rounded-sm">
                                  {splitFile.pageCount} pg
                                </span>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 mr-4">
                                <div className="w-12 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded flex items-center justify-center">
                                  <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                              </div>
                            )}
                            <div>
                              <p className="font-medium truncate max-w-[200px]">{splitFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(splitFile.size / 1024 / 1024).toFixed(2)} MB • {splitFile.pageCount} pages
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSplitFile}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="font-medium">Split Method</h3>
                          
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="splitAll"
                                checked={splitOptions.splitMethod === 'all-pages'}
                                onChange={() => setSplitOptions({
                                  ...splitOptions,
                                  splitMethod: 'all-pages'
                                })}
                                className="h-4 w-4 text-indigo-600"
                              />
                              <Label htmlFor="splitAll">Extract All Pages</Label>
                              <span className="text-xs text-gray-500 ml-2">
                                (One file per page)
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="splitRanges"
                                checked={splitOptions.splitMethod === 'page-ranges'}
                                onChange={() => setSplitOptions({
                                  ...splitOptions,
                                  splitMethod: 'page-ranges'
                                })}
                                className="h-4 w-4 text-indigo-600"
                              />
                              <Label htmlFor="splitRanges">Extract Page Ranges</Label>
                            </div>
                            
                            {splitOptions.splitMethod === 'page-ranges' && (
                              <div className="pl-6 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-2">
                                <Input
                                  placeholder="e.g., 1-3, 5, 7-9"
                                  value={splitOptions.pageRanges}
                                  onChange={(e) => setSplitOptions({
                                    ...splitOptions,
                                    pageRanges: e.target.value
                                  })}
                                />
                                <p className="text-xs text-gray-500">
                                  Specify page ranges separated by commas. Each range will create a separate PDF file.
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="splitEveryN"
                                checked={splitOptions.splitMethod === 'every-n-pages'}
                                onChange={() => setSplitOptions({
                                  ...splitOptions,
                                  splitMethod: 'every-n-pages'
                                })}
                                className="h-4 w-4 text-indigo-600"
                              />
                              <Label htmlFor="splitEveryN">Split Every N Pages</Label>
                            </div>
                            
                            {splitOptions.splitMethod === 'every-n-pages' && (
                              <div className="pl-6 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-2">
                                <div className="flex items-center">
                                  <span className="mr-2 text-sm">Every</span>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={splitFile.pageCount}
                                    value={splitOptions.everyNPages}
                                    onChange={(e) => setSplitOptions({
                                      ...splitOptions,
                                      everyNPages: parseInt(e.target.value) || 1
                                    })}
                                    className="w-20"
                                  />
                                  <span className="ml-2 text-sm">pages</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Create a new PDF every {splitOptions.everyNPages} page(s)
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-4">
                            <Checkbox 
                              id="includePageNumbers"
                              checked={splitOptions.includePageNumbers}
                              onCheckedChange={(checked) => setSplitOptions({
                                ...splitOptions,
                                includePageNumbers: checked === true
                              })}
                            />
                            <Label htmlFor="includePageNumbers">Include page numbers in filenames</Label>
                          </div>
                          
                          <Button
                            onClick={splitPDF}
                            disabled={isSplitting}
                            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                          >
                            {isSplitting ? (
                              <div className="flex items-center">
                                <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Processing...
                              </div>
                            ) : (
                              <>
                                <Scissors className="mr-2 h-5 w-5" />
                                Split PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center max-w-2xl mx-auto">
          <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <h2 className="text-2xl font-bold mb-2">100% Secure & Private</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your files are processed entirely in your browser. They are never uploaded to any server, ensuring
              complete privacy and security.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
