import { RetroButton } from "@/components/ui/RetroButton";

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-center p-4">
      {/* Giant Background Number */}
      <div className="font-display text-[8rem] md:text-[12rem] text-white/5 select-none leading-none">404</div>
      
      <div className="relative -mt-12 md:-mt-24 z-10">
        <h1 className="font-display text-4xl md:text-6xl text-comets-red mb-4 text-shadow-neon">GAME OVER</h1>
        <p className="font-ui text-xl text-white/60 mb-8 tracking-widest uppercase">
            The page you are looking for is in another castle.
        </p>
        
        <RetroButton href="/" variant="primary">
            CONTINUE?
        </RetroButton>
      </div>
    </div>
  );
}