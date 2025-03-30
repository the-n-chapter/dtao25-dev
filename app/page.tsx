"use client"
import { useState, useEffect } from 'react'
import Link from "next/link"

export default function WelcomePage() {
  const [text, setText] = useState('');
  const fullText = "we're pintell";
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [blinkCount, setBlinkCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let typeTimeout: NodeJS.Timeout;
    let eraseTimeout: NodeJS.Timeout;
    let blinkInterval: NodeJS.Timeout;

    const typeText = async () => {
      setIsTyping(true);
      for (let i = 0; i <= fullText.length; i++) {
        if (!isMounted) return;
        setText(fullText.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      blinkInterval = setInterval(() => {
        if (!isMounted) {
          clearInterval(blinkInterval);
          return;
        }
        setIsBlinking(prev => !prev);
        if (!isBlinking) {
          setBlinkCount(prev => prev + 1);
        }
      }, 500);

      typeTimeout = setTimeout(() => {
        clearInterval(blinkInterval);
        eraseText();
      }, 2000);
    };

    const eraseText = async () => {
      setIsBlinking(false);
      for (let i = fullText.length; i >= 0; i--) {
        if (!isMounted) return;
        setText(fullText.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setBlinkCount(0);
      eraseTimeout = setTimeout(typeText, 500);
    };

    typeText();

    return () => {
      isMounted = false;
      clearTimeout(typeTimeout);
      clearTimeout(eraseTimeout);
      clearInterval(blinkInterval);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <div className="w-full max-w-6xl px-8 md:pr-28 lg:pr-40 xl:pr-56 2xl:pr-72">
        {/* Mobile Layout */}
        <div className="md:hidden text-center">
          <h1 className="text-4xl font-light mt-2">
            Hi, 
            <span className="text-black ml-2">
              {text.split(' ')[0]} 
            </span>
            <span className="text-[#5DA9E9] ml-2">
              {text.split(' ')[1]}
            </span>
            <span className={`inline-block text-[#5DA9E9] ${isBlinking ? 'opacity-0' : 'opacity-100'}`}>_</span>
          </h1>
          <div className="mt-8">
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center rounded-full border border-[#5DA9E9] bg-white px-8 py-4 text-xl font-medium text-[#5DA9E9] hover:bg-[#5DA9E9] hover:text-white transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <p className="text-2xl font-bold text-[#5DA9E9] mt-2 mb-10">
            pintell
          </p>
          <h1 className="text-5xl font-light mb-8">
            Hi, 
            <span className="text-black ml-2">
              {text.split(' ')[0]} 
            </span>
            <span className="text-[#5DA9E9] ml-2">
              {text.split(' ')[1]}
            </span>
            <span className={`inline-block text-[#5DA9E9] ${isBlinking ? 'opacity-0' : 'opacity-100'}`}>_</span>
          </h1>
          
          {/* Continuous paragraph text with automatic wrapping */}
          <div className="space-y-6 text-left">
            <p className="text-5xl text-gray-600 font-light">
              tired of guessing if your clothes are dry<span className="text-[#5DA9E9]"> ¿</span> we does the thinking for you. just clip it on, <span className="text-[#5DA9E9]">●</span> connect to the app, <span className="text-[#5DA9E9]">&</span> let we take care of the rest <span className="text-[#5DA9E9]">*</span>.
            </p>
          </div>
          
          <div className="mt-12">
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center rounded-full border border-[#5DA9E9] bg-white px-8 py-4 text-2xl font-medium text-[#5DA9E9] hover:bg-[#5DA9E9] hover:text-white transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}