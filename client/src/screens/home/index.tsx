import { ColorSwatch, Group, LoadingOverlay } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import { toast } from 'react-hot-toast';
import { cn } from "@/lib/utils";
import { FaPen, FaEraser } from 'react-icons/fa';
import LOGO from '@/assets/logo.png';
import { Link } from 'react-router-dom';
import Footer from '../footer/Footer';

interface AnalysisResult {
  expr: string;
  result: string;
  assign: boolean;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(SWATCHES[0]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [latexNodes, setLatexNodes] = useState<Array<{ 
    id: string; 
    content: string; 
    position: { x: number; y: number }
  }>>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [penSize, setPenSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);
  const [showPenSlider, setShowPenSlider] = useState(false);
  const [showEraserSlider, setShowEraserSlider] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const penTimerRef = useRef<NodeJS.Timeout>();
  const eraserTimerRef = useRef<NodeJS.Timeout>();

  // Initialize canvas
// Update canvas initialization useEffect
useEffect(() => {
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;
    ctx.lineCap = 'round';
    ctx.lineWidth = penSize;
    ctx.strokeStyle = color;
  };

  initCanvas();
}, [ penSize]); // Add dependencies here

  // Update canvas stroke style when color changes
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = color;
    }
  }, [color]);

  // Update canvas line width when pen size changes
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineWidth = penSize;
    }
  }, [penSize]);

  // Load MathJax script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (penTimerRef.current) clearTimeout(penTimerRef.current);
      if (eraserTimerRef.current) clearTimeout(eraserTimerRef.current);
    };
  }, []);

  const handlePenSliderShow = () => {
    setShowPenSlider(true);
    if (penTimerRef.current) clearTimeout(penTimerRef.current);
    penTimerRef.current = setTimeout(() => {
      setShowPenSlider(false);
    }, 1000);
  };

  const handleEraserSliderShow = () => {
    setShowEraserSlider(true);
    if (eraserTimerRef.current) clearTimeout(eraserTimerRef.current);
    eraserTimerRef.current = setTimeout(() => {
      setShowEraserSlider(false);
    }, 1000);
  };

  // Drawing logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setCursorPosition({ x: offsetX, y: offsetY });
    
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (isErasing) {
      ctx.clearRect(offsetX - eraserSize / 2, offsetY - eraserSize / 2, eraserSize, eraserSize);
    } else {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  // Handle analysis
  const handleAnalysis = async () => {
    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      if (isCanvasEmpty(canvas)) {
        toast.error('Please draw something first');
        return;
      }

      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/calculate`, {
        image: canvas.toDataURL(),
        dict_of_vars: variables
      });

      const newVariables = data.data
        .filter((r: AnalysisResult) => r.assign)
        .reduce((acc: Record<string, string>, curr: AnalysisResult) => ({
          ...acc,
          [curr.expr]: curr.result
        }), {});

      setVariables(prev => ({ ...prev, ...newVariables }));
      setResults(data.data);

      data.data.forEach((result: AnalysisResult) => {
        const latex = `\\(\\color{white}${result.expr} = ${result.result}\\)`;
        const position = calculateCanvasCenter();
        setLatexNodes(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            content: latex,
            position
          }
        ]);
      });

      toast.success('Analysis completed!');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if canvas is empty
  const isCanvasEmpty = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.every(alpha => alpha === 0);
  };

  // Calculate canvas center
  const calculateCanvasCenter = () => {
    const canvas = canvasRef.current;
    return canvas ? { x: canvas.width / 2, y: canvas.height / 2 } : { x: 0, y: 0 };
  };

  // Reset canvas
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setLatexNodes([]);
      setVariables({});
      setResults([]);
      toast.success('Canvas reset');
    }
  };

  // Handle tool selection// Handle tool selection
const handleToolInteraction = (tool: 'pen' | 'eraser') => {
  setActiveTool(tool);
  setIsErasing(tool === 'eraser');
  if (tool === 'pen') {
    handlePenSliderShow();
  } else {
    handleEraserSliderShow(); // Fix the incomplete function call
  }
};

  // Size indicator component
  const SizeIndicator = () => {
    const size = isErasing ? eraserSize : penSize;
    
    return (
      <div 
        className="pointer-events-none absolute border-2 border-white rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: cursorPosition.x - size / 2,
          top: cursorPosition.y - size / 2,
          opacity: 0.5,
          transform: 'translate(-1px, -1px)'
        }}
      />
    );
  };

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden">
      <LoadingOverlay visible={isProcessing} loaderProps={{ type: 'dots' }} />
     
      <div className="fixed top-0 left-0 right-0 bg-gray-800 p-4 z-50 shadow-xl">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link to={'/'}>
            <img 
              src={LOGO} 
              className="h-14 rounded-full"
              alt="Logo"
            />
          </Link>
          <div className="flex gap-6">
            <Button onClick={resetCanvas} variant="destructive" className="shadow-lg">
              New Canvas
            </Button>

            <Group>
              {SWATCHES.map((swatch) => (
                <ColorSwatch
                  key={swatch}
                  color={swatch}
                  onClick={() => setColor(swatch)}
                  className={cn(
                    'cursor-pointer transition-transform duration-200 hover:scale-110',
                    color === swatch && 'ring-2 ring-offset-2 ring-white scale-125'
                  )}
                />
              ))}
            </Group>
          </div>

          <div className="flex gap-4 items-center">
            <div
              className="relative tool-container"
              onMouseEnter={() => handleToolInteraction('pen')}
            >
              <Button
                onClick={() => handleToolInteraction('pen')}
                className={cn(
                  "flex items-center p-4 transition-all duration-200",
                  activeTool === 'pen' && "ring-4 ring-blue-500"
                )}
              >
                <FaPen className="text-white" size={20} />
              </Button>
              <div 
                className={cn(
                  "slider-container absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-700 p-2 rounded-lg shadow-lg transition-opacity duration-300",
                  showPenSlider ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={penSize}
                  onChange={(e) => {
                    setPenSize(parseInt(e.target.value));
                    handlePenSliderShow();
                  }}
                  className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div
              className="relative tool-container"
              onMouseEnter={() => handleToolInteraction('eraser')}
            >
              <Button
                onClick={() => handleToolInteraction('eraser')}
                className={cn(
                  "flex items-center p-4 transition-all duration-200",
                  activeTool === 'eraser' && "ring-4 ring-blue-500"
                )}
              >
                <FaEraser className="text-white" size={28} />
              </Button>
              <div 
                className={cn(
                  "slider-container absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-700 p-2 rounded-lg shadow-lg transition-opacity duration-300",
                  showEraserSlider ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={eraserSize}
                  onChange={(e) => {
                    setEraserSize(parseInt(e.target.value));
                    handleEraserSliderShow();
                  }}
                  className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleAnalysis}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-semibold shadow-lg"
            disabled={isProcessing}
          >
            {isProcessing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="mt-24 rounded-xl shadow-2xl bg-gray-800"
          style={{
            cursor: 'crosshair',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <SizeIndicator />
      </div>

      {latexNodes.map((node) => (
        <Draggable
          key={node.id}
          defaultPosition={node.position}
          bounds="parent"
        >
          <div className="absolute p-4 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 cursor-move">
            <div
              className="text-xl font-math text-purple-400"
              dangerouslySetInnerHTML={{ __html: node.content }}
            />
          </div>
        </Draggable>
      ))}

      <Draggable bounds="parent">
        <div className="fixed top-28 right-28 bg-gray-800 p-4 rounded-lg shadow-lg text-white hover:cursor-move z-40">
          <h3 className="text-lg font-semibold">Analysis Results</h3>
          {results.length > 0 ? (
            <ul>
              {results.map((result, index) => (
                <li key={index} className="mb-2 text-5xl">
                  <span className="font-semibold">{result.expr} =</span> <span className='font-bold text-green-400'>{result.result}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No results available.</p>
          )}
        </div>
      </Draggable>

      <Footer />
    </div>
  );
}