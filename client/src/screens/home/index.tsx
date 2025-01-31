import { ColorSwatch, Group, LoadingOverlay } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import { toast } from 'react-hot-toast';
import { cn } from "@/lib/utils";
import { FaPen, FaEraser } from 'react-icons/fa'; // Added eraser and pen icons
import LOGO from '@/assets/logo.png'
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
  const [isErasing, setIsErasing] = useState(false); // Added state for erasing mode

  useEffect(() => {
    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 100;
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
    };

    initCanvas();
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = color;
    }
  }, [color]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (isErasing) {
      ctx.clearRect(offsetX - 10, offsetY - 10, 20, 20); // Eraser logic
    } else {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  };

  const stopDrawing = () => setIsDrawing(false);

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

  const isCanvasEmpty = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.every(alpha => alpha === 0);
  };

  const calculateCanvasCenter = () => {
    const canvas = canvasRef.current;
    return canvas ? { x: canvas.width / 2, y: canvas.height / 2 } : { x: 0, y: 0 };
  };

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

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden">
      <LoadingOverlay visible={isProcessing} loaderProps={{ type: 'dots' }} />
     
      <div className="fixed top-0 left-0 right-0 bg-gray-800 p-4 z-50 shadow-xl">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
      <Link to={'/'}>
        <img 
      src={LOGO} 
      className="h-14 rounded-full " // Increased size & added margin
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
            <Button
              
              onClick={() => setIsErasing(false)} // Set pen mode
              className="flex items-center p-4 hover:ring-4 hover:ring-blue-800"
            >
              <FaPen className="text-white" size={20} />
            </Button>
            <Button
              
              onClick={() => setIsErasing(true)} // Set eraser mode
              className="flex items-center p-4 hover:ring-4 hover:ring-blue-800"
            >
              <FaEraser className="text-white" size={28} />
            </Button>
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
                <span className="font-semibold ">{result.expr} =</span> <span className='font-bold text-green-400'>{result.result}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No results available.</p>
        )}
      </div>
</Draggable>
<Footer/>
    </div>
  );
}
