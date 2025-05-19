# PDFusion

A modern PDF merger application built with Next.js and pdf-lib. Combine multiple PDF files into one with a clean, user-friendly interface.

## Features

- **PDF Preview**: View thumbnails and preview full PDF content before merging
- **Page Selection**: Choose specific pages from each PDF to include in the merged document
- **File Reordering**: Drag and drop to arrange PDFs in your preferred order
- **Metadata Editor**: Customize title, author, subject, and keywords of the output PDF
- **Custom Filename**: Set your preferred filename for the merged document
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

## How It Works

1. Upload your PDF files using the drag-and-drop area or file selector
2. Preview PDFs and select which pages to include
3. Arrange the files in your desired order
4. Set metadata and custom filename in the Settings tab
5. Click "Merge & Download" to combine PDFs and download the result

## Security & Privacy

All PDF processing happens entirely in your browser. No PDF content is ever uploaded to any server, ensuring complete privacy and security of your documents.

## License

MIT License 