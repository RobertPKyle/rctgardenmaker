import { useState, useRef } from 'react';
import Head from 'next/head';

// RCT Flower color palette extracted from the image
const RCT_FLOWER_COLORS = [
  '#172323', '#233333', '#2f4343', '#3f5353', '#4b6363', '#5b7373', '#6f8383',
  '#537b7', '#5b5b13', '#6b6b1f', '#777b2f', '#878b3b', '#979b4f', '#a7af5f',
  '#777777', '#bcbc8b', '#9f9f3a3', '#432b07', '#573b0b', '#6f4b17', '#7b571f',
  '#8f6327', '#9f7333', '#b38343', '#bf9757', '#cbaf6f', '#e7dba3',
  '#7fef3', '#471b00', '#5f2b00', '#773300', '#8f5307', '#a76f07', '#bf8b0f',
  '#cf9f1b', '#e7b72f', '#ff5f', '#ff6f6f', '#ff7f3', '#230000',
  '#4f0000', '#5f0707', '#6f0f0f', '#7f1b1b', '#8f2727', '#9f3333', '#af3f3f',
  '#cf6767', '#df7777', '#ef8787', '#ff9f9f', '#176767', '#275757', '#30527',
  '#476f2b', '#577f33', '#6f8f43', '#7f9f4f', '#8faf5b', '#9fbf67', '#afcf73',
  '#cf8f4f', '#5b7f0', '#9f3f00', '#135300', '#176700', '#1f7b00', '#278f07',
  '#cfaf47', '#8b7f3f', '#7f6343', '#ff5300', '#ff6300', '#3fb06c', '#cf53d',
  '#3f0f0f', '#4b0f0b', '#53b07', '#4b60f73', '#53bf7f', '#af6b3f',
  '#27b2f', '#272b2f', '#373b97', '#5373f', '#733b3f', '#833f6f', '#c2b07f',
  '#2af07', '#2b7b0f', '#371b07', '#472f0f', '#5b3433', '#6b47f3', '#7b5b74',
  '#8b6f8f', '#9b7f8f', '#ab8f9f', '#bfa3b3', '#cfb3c3', '#dfb3d3', '#efc7e3',
  '#5fb33b', '#63b39b', '#77777f', '#8b8b93', '#a3a3a7', '#c7c7c3', '#eeeee3',
  '#003f5f', '#1b2b8b', '#273097', '#00534b', '#005f53', '#005f57', '#00635b',
  '#007b7f', '#007f36', '#249f93', '#359f9f', '#53afaf', '#67bfbf', '#7bcfcf',
  '#8fdfdf', '#a3efef', '#b7ffff', '#000000'
];

// Color distance calculation
function colorDistance(color1, color2) {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// Find closest RCT color
function findClosestRCTColor(hexColor) {
  let closestColor = RCT_FLOWER_COLORS[0];
  let minDistance = colorDistance(hexColor, closestColor);
  
  for (const rctColor of RCT_FLOWER_COLORS) {
    const distance = colorDistance(hexColor, rctColor);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = rctColor;
    }
  }
  
  return closestColor;
}

// Convert RGB to hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pixelArt, setPixelArt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixelSize, setPixelSize] = useState(8);
  const [pixelRows, setPixelRows] = useState([]);
  const [showBuildGuide, setShowBuildGuide] = useState(false);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPixelArt(null);
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    
    const img = new Image();
    const canvas = canvasRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const hiddenCtx = hiddenCanvas.getContext('2d');

    img.onload = () => {
      // Calculate dimensions for pixel art
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const newWidth = Math.floor(img.width * scale);
      const newHeight = Math.floor(img.height * scale);
      
      // Set canvas size
      hiddenCanvas.width = newWidth;
      hiddenCanvas.height = newHeight;
      hiddenCtx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Get image data
      const imageData = hiddenCtx.getImageData(0, 0, newWidth, newHeight);
      const data = imageData.data;
      
      // Calculate pixel art dimensions
      const pixelWidth = Math.floor(newWidth / pixelSize);
      const pixelHeight = Math.floor(newHeight / pixelSize);
      
      // Set output canvas size
      canvas.width = pixelWidth * pixelSize;
      canvas.height = pixelHeight * pixelSize;
      
      // Store pixel data for build guide
      const pixelData = [];
      
      // Process pixels
      for (let y = 0; y < pixelHeight; y++) {
        const row = [];
        for (let x = 0; x < pixelWidth; x++) {
          // Sample pixel from center of each block
          const sampleX = Math.floor(x * pixelSize + pixelSize / 2);
          const sampleY = Math.floor(y * pixelSize + pixelSize / 2);
          
          let rctColor = '#000000';
          
          if (sampleX < newWidth && sampleY < newHeight) {
            const pixelIndex = (sampleY * newWidth + sampleX) * 4;
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            
            const originalHex = rgbToHex(r, g, b);
            rctColor = findClosestRCTColor(originalHex);
            
            // Draw pixel block
            ctx.fillStyle = rctColor;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
          
          row.push(rctColor);
        }
        pixelData.push(row);
      }
      
      setPixelArt(canvas.toDataURL());
      setPixelRows(pixelData);
      setIsProcessing(false);
    };

    img.src = URL.createObjectURL(selectedFile);
  };

  const downloadImage = () => {
    if (!pixelArt) return;
    
    const link = document.createElement('a');
    link.download = 'rct-flower-pixel-art.png';
    link.href = pixelArt;
    link.click();
  };

  return (
    <div className="min-h-screen bg-green-900 bg-gradient-to-br from-green-800 to-green-900">
      <Head>
        <title>RCT Flower Pixel Art Converter</title>
        <meta name="description" content="Convert photos to pixel art using Roller Coaster Tycoon flower colors" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-300 mb-4">
            RCT Flower Pixel Art Converter
          </h1>
          <p className="text-green-100 text-lg">
            Transform your photos into pixel art using the beautiful flower colors from Roller Coaster Tycoon!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <div className="mb-6">
              <label className="block text-green-100 text-sm font-bold mb-2">
                Choose an image:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 bg-white bg-opacity-20 border border-green-400 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-400 file:text-green-900 hover:file:bg-yellow-300"
              />
            </div>

            <div className="mb-6">
              <label className="block text-green-100 text-sm font-bold mb-2">
                Pixel Size: {pixelSize}px
              </label>
              <input
                type="range"
                min="4"
                max="20"
                value={pixelSize}
                onChange={(e) => setPixelSize(parseInt(e.target.value))}
                className="w-full h-2 bg-green-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-green-200 mt-1">
                <span>Fine Detail</span>
                <span>Chunky Pixels</span>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={processImage}
                disabled={!selectedFile || isProcessing}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-green-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isProcessing ? 'Creating Pixel Art...' : 'Convert to RCT Pixel Art'}
              </button>
            </div>
          </div>

          {pixelArt && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
              <h2 className="text-2xl font-bold text-yellow-300 mb-4 text-center">
                Your RCT Flower Pixel Art
              </h2>
              <div className="text-center mb-4">
                <img 
                  src={pixelArt} 
                  alt="Generated pixel art"
                  className="mx-auto max-w-full h-auto border-4 border-yellow-400 rounded-lg shadow-lg"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-center space-x-4">
                <button
                  onClick={downloadImage}
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Download Pixel Art
                </button>
                <button
                  onClick={() => setShowBuildGuide(!showBuildGuide)}
                  className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {showBuildGuide ? 'Hide' : 'Show'} Build Guide
                </button>
              </div>
            </div>
          )}

          {showBuildGuide && pixelRows.length > 0 && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mt-8">
              <h2 className="text-2xl font-bold text-yellow-300 mb-6 text-center">
                🎮 RCT Build Guide - Row by Row
              </h2>
              <p className="text-green-100 text-center mb-6">
                Build your pixel art in RollerCoaster Tycoon by placing flowers row by row from top to bottom!
              </p>
              
              <div className="space-y-6">
                {pixelRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="bg-black bg-opacity-30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-yellow-300">
                        Row {rowIndex + 1} of {pixelRows.length}
                      </h3>
                      <span className="text-sm text-green-200">
                        {row.length} flowers wide
                      </span>
                    </div>
                    
                    {/* Large view for easy following */}
                    <div className="flex flex-wrap justify-center gap-1 mb-4 p-4 bg-gray-800 rounded-lg">
                      {row.map((color, colIndex) => (
                        <div
                          key={colIndex}
                          className="w-8 h-8 border border-gray-600 relative group cursor-pointer"
                          style={{ backgroundColor: color }}
                          title={`Position ${colIndex + 1}: ${color}`}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {color}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Color breakdown */}
                    <div className="text-sm text-green-200">
                      <details className="cursor-pointer">
                        <summary className="hover:text-yellow-300 transition-colors">
                          Show color details for this row
                        </summary>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                          {Array.from(new Set(row)).map((uniqueColor, index) => {
                            const count = row.filter(c => c === uniqueColor).length;
                            return (
                              <div key={index} className="flex items-center space-x-2 bg-gray-700 rounded p-2">
                                <div 
                                  className="w-4 h-4 border border-gray-400"
                                  style={{ backgroundColor: uniqueColor }}
                                ></div>
                                <span>{uniqueColor}</span>
                                <span className="text-yellow-300">×{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-yellow-100 bg-opacity-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-yellow-300 mb-2">💡 Building Tips:</h3>
                <ul className="text-green-100 text-sm space-y-1">
                  <li>• Use the Flower tool in RCT's landscaping menu</li>
                  <li>• Build from top to bottom, left to right</li>
                  <li>• Each square represents one flower tile</li>
                  <li>• Hover over each color square to see the hex code</li>
                  <li>• Match the flower colors as closely as possible to the RCT palette</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvases for processing */}
        <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="text-center mt-12 text-green-200 text-sm">
          <p>Using the authentic flower color palette from RollerCoaster Tycoon 🌺</p>
        </div>
      </div>
    </div>
  );
}