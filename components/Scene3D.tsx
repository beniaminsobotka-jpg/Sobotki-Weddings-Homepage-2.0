import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Reusable Materials
const bodyMaterial = new THREE.MeshStandardMaterial({
  color: "#111111",
  metalness: 0.8,
  roughness: 0.3,
});

const gripMaterial = new THREE.MeshStandardMaterial({
  color: "#050505",
  metalness: 0.2,
  roughness: 0.9, 
});

const metalMaterial = new THREE.MeshStandardMaterial({
  color: "#333333",
  metalness: 1.0,
  roughness: 0.2,
});

const neonMaterial = new THREE.MeshStandardMaterial({
  color: "#D2FF00",
  emissive: "#D2FF00",
  emissiveIntensity: 2,
  toneMapped: false,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#ffffff",
  metalness: 0.1,
  roughness: 0,
  transmission: 0.99,
  thickness: 1,
  clearcoat: 1,
});

const PhotoCamera = (props: any) => {
  return (
    <group {...props}>
      {/* Main Body */}
      <mesh material={bodyMaterial} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.4, 0.6]} />
      </mesh>
      
      {/* Grip */}
      <mesh material={gripMaterial} position={[-0.8, 0, 0.4]}>
        <cylinderGeometry args={[0.35, 0.35, 1.4, 16]} />
      </mesh>

      {/* Top Plate */}
      <mesh material={metalMaterial} position={[0, 0.75, 0]}>
        <boxGeometry args={[2.2, 0.1, 0.6]} />
      </mesh>
      
      {/* Viewfinder Hump */}
      <mesh material={metalMaterial} position={[0, 1.0, 0]} rotation={[0, Math.PI/4, 0]}>
        <cylinderGeometry args={[0.2, 0.4, 0.6, 4]} />
      </mesh>

      {/* Shutter Button */}
      <mesh material={metalMaterial} position={[-0.8, 0.85, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
      </mesh>
      <mesh material={neonMaterial} position={[-0.8, 0.95, 0]}>
         <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
      </mesh>

      {/* Lens Assembly */}
      <group position={[0.2, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
         <mesh material={metalMaterial} position={[0, 0, 0]}>
            <cylinderGeometry args={[0.65, 0.65, 0.4, 32]} />
         </mesh>
         <mesh material={bodyMaterial} position={[0, 0.3, 0]}>
             <cylinderGeometry args={[0.6, 0.6, 0.4, 32]} />
         </mesh>
         {/* Neon Ring */}
         <mesh material={neonMaterial} position={[0, 0.5, 0]}>
            <torusGeometry args={[0.62, 0.02, 16, 64]} />
         </mesh>
         {/* Glass Element */}
         <mesh material={glassMaterial} position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.1, 32]} />
         </mesh>
      </group>
    </group>
  );
};

const VideoCamera = (props: any) => {
    return (
        <group {...props}>
            {/* Main Body */}
            <mesh material={bodyMaterial} castShadow receiveShadow>
                <boxGeometry args={[1.2, 1.4, 2.8]} />
            </mesh>
            
            {/* Top Handle */}
            <mesh material={metalMaterial} position={[0, 1.0, 0.5]}>
                <boxGeometry args={[0.4, 0.6, 2.0]} />
            </mesh>
            <mesh material={gripMaterial} position={[0, 1.35, 0.5]}>
                 <boxGeometry args={[0.5, 0.1, 1.5]} />
            </mesh>

            {/* Microphone */}
            <mesh material={gripMaterial} position={[0.5, 1.0, -0.5]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
            </mesh>
             <mesh material={neonMaterial} position={[0.5, 1.0, -0.9]} rotation={[Math.PI/2, 0, 0]}>
                 <torusGeometry args={[0.15, 0.02, 16, 32]} />
            </mesh>

            {/* Lens Hood (Front) */}
            <mesh material={bodyMaterial} position={[0, 0, 1.6]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.8, 0.7, 0.8, 32]} />
            </mesh>
             {/* Neon Ring */}
            <mesh material={neonMaterial} position={[0, 0, 2.0]} rotation={[Math.PI/2, 0, 0]}>
                 <torusGeometry args={[0.82, 0.03, 16, 64]} />
            </mesh>
            {/* Lens Glass */}
            <mesh material={glassMaterial} position={[0, 0, 1.8]} rotation={[Math.PI/2, 0, 0]}>
                 <sphereGeometry args={[0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            </mesh>

            {/* Side Screen (flipped out) */}
            <group position={[0.7, 0, -0.5]} rotation={[0, 0.4, 0]}>
                 <mesh material={bodyMaterial}>
                     <boxGeometry args={[0.1, 0.9, 1.4]} />
                 </mesh>
                 <mesh position={[0.06, 0, 0]} rotation={[0, 0, 0]}>
                     <planeGeometry args={[0, 0.8, 1.2]} />
                     <meshStandardMaterial color="#222" emissive="#D2FF00" emissiveIntensity={0.1} />
                 </mesh>
                 {/* Screen Glow */}
                 <pointLight position={[0.2, 0, 0]} distance={1} intensity={2} color="#D2FF00" />
            </group>
             {/* Battery Pack (Back) */}
             <mesh material={metalMaterial} position={[0, 0, -1.6]}>
                <boxGeometry args={[1.0, 1.0, 0.6]} />
             </mesh>
        </group>
    );
};

export const Scene3D: React.FC = () => {
  // UseMemo to avoid recreating config objects
  const shadowConfig = useMemo(() => ({
    resolution: 256, // Lower resolution for better performance (default is often 1024)
    scale: 30,
    blur: 2,
    far: 10,
    color: "#000000"
  }), []);

  return (
    <div className="absolute inset-0 z-0 opacity-100 pointer-events-none mix-blend-normal">
      <Canvas 
        shadows={false} // Disable expensive shadow maps, use ContactShadows instead
        dpr={[1, 1.5]} // Cap DPR at 1.5 to save huge performance on Retina/4K screens
        gl={{ 
            powerPreference: "high-performance",
            antialias: false, // Disable AA for performance (noise hides jagged edges anyway)
            stencil: false,
            depth: true 
        }}
        camera={{ position: [0, 0, 14], fov: 35 }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={2} />
        <pointLight position={[-10, 5, -5]} intensity={5} color="#D2FF00" distance={30} />
        <pointLight position={[0, -10, 5]} intensity={1} color="white" />

        <Float 
            speed={2} 
            rotationIntensity={0.5} 
            floatIntensity={1} 
            floatingRange={[-0.5, 0.5]}
        >
             <group position={[-2, 0.5, 0]} rotation={[0.2, 0.4, 0]}>
                 <PhotoCamera scale={1.1} />
             </group>
        </Float>

        <Float 
            speed={1.5} 
            rotationIntensity={0.4} 
            floatIntensity={0.8} 
            floatingRange={[-0.4, 0.4]}
        >
             <group position={[2.5, -1, 1]} rotation={[0.1, -0.5, 0]}>
                 <VideoCamera scale={0.9} />
             </group>
        </Float>

        <Environment preset="city" />
        
        {/* Optimized Shadows */}
        <ContactShadows position={[0, -4, 0]} opacity={0.5} {...shadowConfig} />
      </Canvas>
    </div>
  );
};