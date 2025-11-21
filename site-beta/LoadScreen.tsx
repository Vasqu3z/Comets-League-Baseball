import RetroLoader from "@/components/ui/RetroLoader";

export default function Loading() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <RetroLoader />
    </div>
  );
}