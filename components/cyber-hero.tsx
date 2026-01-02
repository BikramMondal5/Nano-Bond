"use client"

import { useEffect, useRef } from "react"

export const MatrixRain = ({ opacity = 0.25, speed = 0.5 }: { opacity?: number; speed?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$¥€£@#%&*"
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    const draw = () => {
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = `rgba(249, 115, 22, ${opacity})`
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33 / speed)
    return () => clearInterval(interval)
  }, [opacity, speed])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ opacity }} />
}
