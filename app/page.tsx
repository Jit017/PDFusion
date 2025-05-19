"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Upload, FileUp, FileDown, Trash2, MoveVertical, FileText, 
  Check, X, ChevronDown, ChevronUp, Edit, Eye } from "lucide-react"
import { PDFDocument, StandardFonts } from "pdf-lib"
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
  isExpanded?: boolean
}

// Type for PDF metadata
interface PDFMetadata {
  title: string
  author: string
  subject: string
  keywords: string
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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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
            
            copiedPages.forEach((page) => mergedPdf.addPage(page))
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
      
      // Save the merged PDF
      console.log("Saving merged PDF")
      const mergedPdfBytes = await mergedPdf.save()
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />

      <main className="container mx-auto py-10 px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            Merge PDFs Seamlessly
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Combine multiple PDF files into one document in seconds.
          </p>
        </div>

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
                                            <div className="flex items-center justify-center mb-1">
                                              <Checkbox
                                                checked={selected}
                                                onCheckedChange={() => togglePageSelection(index, pageIndex)}
                                                className="mr-1"
                                              />
                                            </div>
                                            <div className="text-xs font-medium">
                                              Page {pageIndex + 1}
                                            </div>
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
