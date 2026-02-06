'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Slider as SliderType } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { Tenant } from '@/lib/types'

interface SliderProps {
  sliders: SliderType[]
  tenant: Tenant
  autoPlay?: boolean
  interval?: number
}

export function Slider({ sliders, tenant, autoPlay = true, interval = 5000 }: SliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!autoPlay || isPaused || sliders.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, isPaused, sliders.length, interval])

  if (sliders.length === 0) return null

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sliders.length)
  }

  const currentSlider = sliders[currentIndex]

  return (
    <div
      className="relative w-full min-h-[420px] h-[55vh] md:min-h-[520px] md:h-[65vh] lg:h-[75vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Image */}
      <div className="relative w-full h-full">
        <img
          key={currentIndex}
          src={currentSlider.image}
          alt={currentSlider.title || 'Slider'}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        {(currentSlider.title || currentSlider.description || currentSlider.link) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-3xl">
              {currentSlider.title && (
                <h2 className="text-4xl md:text-6xl font-bold mb-4">{currentSlider.title}</h2>
              )}
              {currentSlider.description && (
                <p className="text-lg md:text-xl mb-6">{currentSlider.description}</p>
              )}
              {currentSlider.link && (
                <Link href={getTenantLink(tenant, currentSlider.link)}>
                  <Button size="lg" variant="secondary" className="text-lg">
                    {currentSlider.buttonText || 'Learn More'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {sliders.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {sliders.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {sliders.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
