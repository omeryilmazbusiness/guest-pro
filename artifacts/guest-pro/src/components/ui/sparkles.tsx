import { useId, useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

export type SparklesCoreProps = {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

async function particlesInit(engine: Engine) {
  await loadSlim(engine);
}

export function SparklesCore({
  id,
  className,
  background = "transparent",
  minSize = 0.6,
  maxSize = 1.4,
  speed = 1,
  particleColor = "#FFFFFF",
  particleDensity = 100,
}: SparklesCoreProps) {
  const controls = useAnimation();
  const generatedId = useId();

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: { value: background },
      },
      fullScreen: {
        enable: false,
        zIndex: 1,
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: { enable: true, mode: "push" },
          onHover: { enable: false, mode: "repulse" },
          resize: { enable: true },
        },
        modes: {
          push: { quantity: 4 },
          repulse: { distance: 200, duration: 0.4 },
        },
      },
      particles: {
        color: { value: particleColor },
        move: {
          enable: true,
          speed: { min: 0.1, max: 1 },
          direction: "none",
          outModes: { default: "out" },
        },
        number: {
          density: { enable: true, width: 400, height: 400 },
          value: particleDensity,
        },
        opacity: {
          value: { min: 0.1, max: 1 },
          animation: {
            enable: true,
            speed,
            sync: false,
          },
        },
        shape: { type: "circle" },
        size: {
          value: { min: minSize, max: maxSize },
        },
      },
      detectRetina: true,
    }),
    [background, maxSize, minSize, particleColor, particleDensity, speed],
  );

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      await controls.start({
        opacity: 1,
        transition: { duration: 1 },
      });
    }
  };

  return (
    <ParticlesProvider init={particlesInit}>
      <motion.div animate={controls} className={cn("opacity-0", className)}>
        <Particles
          id={id ?? generatedId}
          className="size-full"
          options={options}
          particlesLoaded={particlesLoaded}
        />
      </motion.div>
    </ParticlesProvider>
  );
}
