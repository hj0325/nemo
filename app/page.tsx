import Image from "next/image";
import LevaGradientModal from "./components/LevaGradientModal";
import ThreeBackground from "./components/ThreeBackground";
import RandomizeButton from "./components/RandomizeButton";
import ScrollInteraction from "./components/ScrollInteraction";
import IntroSequence from "./components/IntroSequence";

export default function Home() {
  return (
    <main className="min-h-screen w-full font-sans">
      {/* Three.js background gradient */}
      <ThreeBackground />
      <IntroSequence />
      {/* Randomize (roulette) button */}
      <RandomizeButton />
      <ScrollInteraction />
      <LevaGradientModal />
    </main>
  );
}
