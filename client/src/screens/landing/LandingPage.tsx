import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import LOGO from '@/assets/logo.png'

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div>
        
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
    <img src={LOGO} className=' flex justify-center h-44 rounded-full'></img>
      {/* Hero Section */}
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl font-extrabold leading-tight bg-clip-text text-transparent 
                      bg-gradient-to-r from-purple-400 to-blue-400 animate-gradient">
          Unlock the Power of Handwritten Equations
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Effortlessly analyze and solve handwritten mathematical expressions in real-time.
        </p>

        {/* CTA Button */}
        <Button 
          className="mt-6 px-6 py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 
                    hover:from-purple-700 hover:to-blue-700 shadow-lg transition-transform transform hover:scale-105"
          onClick={() => navigate('/e-board')}
        >
          Get Started
        </Button>
      </div>

      {/* Features Section */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl">
        <FeatureCard title="⚡ AI-Powered Analysis" description="Leverage AI to recognize and analyze handwritten equations instantly." />
        <FeatureCard title="✏️ Interactive Canvas" description="Draw, erase, and solve equations effortlessly on a digital canvas." />
        <FeatureCard title="📊 Instant Results" description="Get instant feedback and solutions with NeuroSktech." />
      </div>
    </div>
    </div>
  );
}

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="p-6 bg-gray-800/50 backdrop-blur-md rounded-xl shadow-xl hover:shadow-2xl transition duration-300 border border-gray-700">
    <h3 className="text-xl font-semibold text-purple-400">{title}</h3>
    <p className="mt-2 text-gray-300">{description}</p>
  </div>
);
