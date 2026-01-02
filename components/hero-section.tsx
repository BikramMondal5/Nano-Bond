"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";
import { Shield, Lock, TrendingUp, Wallet, ArrowRight, Eye, Sparkles, Landmark, DollarSign, Users } from "lucide-react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Utility function
const cn = (...args: any[]) => {
  return args.filter(Boolean).join(" ");
};

// Particle Wave Background Component
interface ParticleWaveProps {
  className?: string;
}

const ParticleWave: React.FC<ParticleWaveProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    particleMaterial: THREE.ShaderMaterial;
    animationId: number | null;
  } | null>(null);

  const particleVertex = `
    attribute float scale;
    uniform float uTime;
    uniform vec2 uMouse;
    void main() {
      vec3 p = position;
      float s = scale;
      
      // Gentle base wave
      float wave = sin(p.x * 0.15 + uTime * 0.5) * 2.5;
      p.y += wave;
      
      // Mouse interaction
      float distToMouse = distance(p.xz, uMouse);
      float mouseEffect = smoothstep(20.0, 0.0, distToMouse) * 5.0;
      p.y += mouseEffect;
      
      s += (sin(p.x * 0.1 + uTime * 0.3) * 0.5 + 0.5) * 1.2;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = s * 20.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const particleFragment = `
    uniform vec3 uColor;
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      gl_FragColor = vec4(uColor, alpha * 0.8);
    }
  `;

  const initScene = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const aspectRatio = winWidth / winHeight;

    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.01, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 0, 0);

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(winWidth, winHeight);
    renderer.setClearColor(0x000000, 0);

    const gap = 0.8;
    const amountX = 100;
    const amountY = 100;
    const particleNum = amountX * amountY;
    const particlePositions = new Float32Array(particleNum * 3);
    const particleScales = new Float32Array(particleNum);

    let i = 0;
    let j = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        particlePositions[i] = ix * gap - (amountX * gap) / 2;
        particlePositions[i + 1] = 0;
        particlePositions[i + 2] = iy * gap - (amountX * gap) / 2;
        particleScales[j] = 1;
        i += 3;
        j++;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("scale", new THREE.BufferAttribute(particleScales, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Vector3(1.0, 0.6, 0.2) },
      },
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      particleMaterial,
      animationId: null,
    };
  };

  const animate = () => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, particleMaterial } = sceneRef.current;

    particleMaterial.uniforms.uTime.value += 0.02;

    camera.lookAt(scene.position);
    renderer.render(scene, camera);

    sceneRef.current.animationId = requestAnimationFrame(animate);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!sceneRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const mouseX = x * 40;
    const mouseY = y * 40;

    sceneRef.current.particleMaterial.uniforms.uMouse.value.set(mouseX, mouseY);
  };

  const handleResize = () => {
    if (!sceneRef.current) return;

    const { camera, renderer } = sceneRef.current;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    camera.aspect = winWidth / winHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(winWidth, winHeight);
  };

  useEffect(() => {
    initScene();
    animate();

    const handleResizeEvent = () => handleResize();
    const handleMouseMoveEvent = (e: MouseEvent) => handleMouseMove(e);

    window.addEventListener("resize", handleResizeEvent);
    window.addEventListener("mousemove", handleMouseMoveEvent);

    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      window.removeEventListener("resize", handleResizeEvent);
      window.removeEventListener("mousemove", handleMouseMoveEvent);

      if (sceneRef.current) {
        const { scene, renderer, particles } = sceneRef.current;
        scene.remove(particles);
        if (particles.geometry) particles.geometry.dispose();
        if (particles.material) {
          if (Array.isArray(particles.material)) {
            particles.material.forEach((material) => material.dispose());
          } else {
            particles.material.dispose();
          }
        }
        renderer.dispose();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

// Animated Counter Component
const fontSize = 40;
const padding = 10;
const height = fontSize + padding;

interface CounterProps {
  start?: number;
  end: number;
  duration?: number;
  className?: string;
  fontSize?: number;
}

const Counter = ({ start = 0, end, duration = 2, className, fontSize = 30 }: CounterProps) => {
  const [value, setValue] = useState(start);

  useEffect(() => {
    const increment = (end - start) / ((duration * 1000) / 50);
    const interval = setInterval(() => {
      setValue((prev) => {
        const next = prev + increment;
        if (next >= end) {
          clearInterval(interval);
          return end;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [end, start, duration]);

  const displayValue = Math.floor(value);

  return (
    <div
      style={{ fontSize }}
      className={cn("flex overflow-hidden rounded px-2 leading-none font-bold", className)}
    >
      {displayValue >= 100000 && <Digit place={100000} value={displayValue} />}
      {displayValue >= 10000 && <Digit place={10000} value={displayValue} />}
      {displayValue >= 1000 && <Digit place={1000} value={displayValue} />}
      {displayValue >= 100 && <Digit place={100} value={displayValue} />}
      {displayValue >= 10 && <Digit place={10} value={displayValue} />}
      <Digit place={1} value={displayValue} />
    </div>
  );
};

function Digit({ place, value }: { place: number; value: number }) {
  let valueRoundedToPlace = Math.floor(value / place);
  let animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height }} className="relative w-[1ch] tabular-nums">
      {[...Array(10)].map((_, i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

function Number({ mv, number }: { mv: MotionValue; number: number }) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;

    let memo = offset * height;

    if (offset > 5) {
      memo -= 10 * height;
    }

    return memo;
  });

  return (
    <motion.span style={{ y }} className="absolute inset-0 flex items-center justify-center">
      {number}
    </motion.span>
  );
}

export function HeroSection() {
  const [tvl, setTvl] = useState(0);
  const [bonds, setBonds] = useState(0);
  const [investors, setInvestors] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setTvl(12500);
      setBonds(847);
      setInvestors(2340);
    }, 100);
  }, []);

  const stats = [
    { label: "Total Value Locked", value: `$${tvl.toLocaleString()}K+`, icon: DollarSign, color: "orange" },
    { label: "Bonds Tokenized", value: bonds.toString(), icon: Landmark, color: "amber" },
    { label: "Active Investors", value: `${investors.toLocaleString()}+`, icon: Users, color: "orange" },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Custom Cursor Blur Effect */}
      <motion.div
        className="fixed pointer-events-none z-50 mix-blend-screen hidden md:block"
        animate={{
          x: mousePosition.x - 100,
          y: mousePosition.y - 100,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 200,
          mass: 0.5,
        }}
      >
        <div className="w-[200px] h-[200px] bg-gradient-to-r from-primary to-secondary rounded-full blur-3xl opacity-30" />
      </motion.div>

      {/* Particle Background */}
      <div className="absolute inset-0 opacity-80">
        <ParticleWave />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-32">

        {/* Hero Content */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 text-primary px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Blockchain-Secured Government Bonds
            </Badge>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse bg-[length:200%_auto]">
                Fractional Bonds,
              </span>
              <br />
              <span className="text-foreground">
                Unlimited Access
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Invest in government bonds with as little as $10. Tokenized, transparent, and accessible to everyone through blockchain technology.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-20"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Start Investing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary font-bold text-lg px-8 py-6 rounded-xl backdrop-blur-sm transition-all duration-300"
            >
              <Eye className="w-5 h-5 mr-2" />
              View All Bonds
            </Button>
          </motion.div>
        </div>

        {/* Animated Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <Card className="backdrop-blur-xl bg-card/50 border border-primary/20 rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300">
                <stat.icon className={`w-8 h-8 text-${stat.color}-400 mx-auto mb-3`} style={{ color: stat.color === 'orange' ? '#f97316' : '#fbbf24' }} />
                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust indicators footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>Bank-Grade Security</span>
          </div>
          <div className="w-1 h-1 bg-muted-foreground/50 rounded-full hidden sm:block" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Fully Audited</span>
          </div>
          <div className="w-1 h-1 bg-muted-foreground/50 rounded-full hidden sm:block" />
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Transparent Returns</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
