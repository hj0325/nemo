import Image from "next/image";
import LevaGradientModal from "./components/common/LevaGradientModal";
import ThreeBackground from "./components/common/ThreeBackground";
import ScrollInteraction from "./components/common/ScrollInteraction";
import IntroSequence from "./(main)/components/IntroSequence";
import TopQuestion from "./components/common/TopQuestion";
import SelectButton from "./components/common/SelectButton";
import SelectionFlashOverlay from "./components/common/SelectionFlashOverlay";
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
