# PDFusion

A modern PDF management application built with Next.js and pdf-lib. Merge, split and secure PDF files with a clean, user-friendly interface - all directly in your browser with no file uploads needed.

## Features

- **PDF Merging**: Combine multiple PDF files into a single document
- **PDF Splitting**: Extract individual pages or split PDFs into multiple documents
- **PDF Preview**: View thumbnails and preview full PDF content before processing
- **Page Selection**: Choose specific pages from each PDF to include in the merged document
- **File Reordering**: Drag and drop to arrange PDFs in your preferred order
- **Page Rotation**: Rotate individual pages clockwise or counter-clockwise
- **Password Protection**: Add user and owner passwords with custom permissions
- **Compression Options**: Reduce file size with adjustable compression settings
- **Metadata Editor**: Customize title, author, subject, and keywords of the output PDF
- **Custom Filename**: Set your preferred filename for the output document
- **Client-side Processing**: All PDF processing happens in the browser for privacy and security

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- pdf-lib
- hello-pangea/dnd (for drag and drop)
- Radix UI components

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jit017/PDFusion.git
cd PDFusion
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Application Structure

- **Home Page**: Main application interface for merging and splitting PDFs
- **Features**: Overview of all PDFusion capabilities
- **How It Works**: Step-by-step guide for using the application
- **FAQ**: Answers to common questions about PDFusion

## How It Works

### Merging PDFs
1. Upload your PDF files using the drag-and-drop area or file selector
2. Preview PDFs and select which pages to include
3. Arrange the files in your desired order
4. Set metadata, password protection and custom filename in the Settings tab
5. Click "Merge & Download" to combine PDFs and download the result

### Splitting PDFs
1. Upload a PDF file you want to split
2. Choose your preferred splitting method (individual pages, page ranges, etc.)
3. Configure output options
4. Process and download your split PDF files

## Security & Privacy

All PDF processing happens entirely in your browser. No PDF content is ever uploaded to any server, ensuring complete privacy and security of your documents.

## License

MIT License 