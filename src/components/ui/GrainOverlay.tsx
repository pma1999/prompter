export function GrainOverlay() {
    return (
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay">
            <svg className="h-full w-full">
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.80"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
        </div>
    );
}
