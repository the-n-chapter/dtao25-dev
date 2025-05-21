"use client"
import { useState, useEffect } from 'react'
import Link from "next/link"
import { PublicNav } from "@/components/public-nav"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function WelcomePage() {
  const router = useRouter()
  const [text, setText] = useState('');
  const fullText = "we're pintell";
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [blinkCount, setBlinkCount] = useState(0);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem("authToken")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

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
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-6xl px-8 md:pr-28 lg:pr-40 xl:pr-56 2xl:pr-72">
          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col items-center text-center">
            <h1 className="flex items-baseline justify-center gap-2 text-4xl font-light">
              <span>Hi,</span>
              <span className="text-foreground">{text.split(" ")[0]}</span>
              <span className="text-[#5DA9E9]">
                {text.split(" ")[1]}
                <span className={isBlinking ? "opacity-0" : "opacity-100"}>_</span>
              </span>
            </h1>

            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-[#5DA9E9] bg-background px-8 py-4 text-xl font-medium text-[#5DA9E9] transition-colors hover:bg-[#5DA9E9] hover:text-white"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            <h1 className="text-5xl font-light mt-10 mb-8">
              Hi, 
              <span className="text-foreground ml-2">
                {text.split(' ')[0]} 
              </span>
              <span className="text-[#5DA9E9] ml-2">
                {text.split(' ')[1]}
              </span>
              <span className={`inline-block text-[#5DA9E9] ${isBlinking ? 'opacity-0' : 'opacity-100'}`}>_</span>
            </h1>
            
            {/* Continuous paragraph text with automatic wrapping */}
            <div className="space-y-6 text-left mr-4">
              <p className="text-5xl text-muted-foreground font-light">
                tired of guessing if clothes are dry {` `}
                <motion.span 
                  className="text-[#5DA9E9] inline-block"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  animate={{ 
                    y: [0, -15, 0],
                  }}
                  transition={{ 
                    y: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  }}
                > ¿</motion.span> we do the <span className='italic'>thinking</span> for you. just clip the device on, {` `} 
                <motion.span 
                  className="text-[#5DA9E9] inline-block"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  animate={{ 
                    scale: [1, 1.4, 1],
                  }}
                  transition={{ 
                    scale: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  }}
                > ●</motion.span> connect to the app, {` `}
                <motion.span 
                  className="text-[#5DA9E9] inline-block"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  animate={{ 
                    rotate: [0, 20, 0, -20, 0],
                  }}
                  transition={{ 
                    rotate: {
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  }}
                > &</motion.span> let we take care of the rest 
                <motion.span 
                  className="text-[#5DA9E9] inline-block"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  animate={{ 
                    scale: [1, 1.4, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ 
                    scale: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    },
                    rotate: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }
                  }}
                > *</motion.span>.
              </p>
            </div>
            
            <div className="mt-12">
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center rounded-full border border-[#5DA9E9] bg-background px-8 py-4 text-2xl font-medium text-[#5DA9E9] hover:bg-[#5DA9E9] hover:text-white transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}