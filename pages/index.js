import ThreeBackground from "../app/components/common/ThreeBackground";
import ScrollInteraction from "../app/components/common/ScrollInteraction";
import IntroSequence from "../app/(main)/components/IntroSequence";
import TopQuestion from "../app/components/common/TopQuestion";
import SelectButton from "../app/components/common/SelectButton";
import SelectionFlashOverlay from "../app/components/common/SelectionFlashOverlay";
import FinalScreen from "../app/components/FinalScreen";

export default function Home() {
  return (
    <main className="min-h-screen w-full font-sans">
      <ThreeBackground />
      <IntroSequence />
      <SelectButton />
      <ScrollInteraction />
      <TopQuestion />
      <SelectionFlashOverlay />
      <FinalScreen />
    </main>
  );
}


