import Image from "next/image";
import LevaGradientModal from "./components/LevaGradientModal";
import ThreeBackground from "./components/ThreeBackground";
import ScrollInteraction from "./components/ScrollInteraction";
import IntroSequence from "./components/IntroSequence";
import TopQuestion from "./components/TopQuestion";
import SelectButton from "./components/SelectButton";
import SelectionFlashOverlay from "./components/SelectionFlashOverlay";
import FinalScreen from "./components/FinalScreen";

export default function Home() {
  return (
    <main className="min-h-screen w-full font-sans">
      {/* Three.js background gradient */}
      <ThreeBackground />
      <IntroSequence />
      {/* Select (fix current background) button */}
      <SelectButton />
      <ScrollInteraction />
      <TopQuestion />
      <SelectionFlashOverlay />
      <FinalScreen />
      <LevaGradientModal />
    </main>
  );
}
