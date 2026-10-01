import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { prefersReducedMotion } from '@/lib/motion'

/** Aurore graphite / bleu nuit / ambre, très lente — fond de la version clean. */
export default function CleanBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <ShaderGradientCanvas
        style={{ position: 'absolute', inset: 0, width: '100vw', height: '100vh' }}
        pixelDensity={Math.min(2, window.devicePixelRatio || 1) * 1.25}
        fov={45}
        pointerEvents="none"
        lazyLoad={false}
      >
        <ShaderGradient
          type="waterPlane"
          animate={prefersReducedMotion() ? 'off' : 'on'}
          uTime={0.4}
          uSpeed={0.07}
          uStrength={1.5}
          uDensity={1}
          uFrequency={2.4}
          uAmplitude={0}
          color1="#0a0d14"
          color2="#26355f"
          color3="#b9875a"
          brightness={1}
          grain="off"
          lightType="3d"
          reflection={0.1}
          cAzimuthAngle={180}
          cPolarAngle={90}
          cDistance={2.2}
          cameraZoom={1}
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
        />
      </ShaderGradientCanvas>
      {/* voile + grain très fin pour un rendu « verre dépoli » */}
      <div className="noise absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,7,11,.75)_100%)]" />
    </div>
  )
}
