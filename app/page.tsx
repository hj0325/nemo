import Image from "next/image";
import LevaGradientModal from "./components/LevaGradientModal";
import ThreeBackground from "./components/ThreeBackground";

export default function Home() {
  return (
    <main className="min-h-screen w-full font-sans">
      {/* Three.js background gradient */}
      <ThreeBackground />
      <section className="min-h-screen flex flex-col items-center justify-start pt-12 relative z-10">
        <Image
          src="/nemo.png"
          alt="Nemo"
          width={160}
          height={160}
          priority
          className="fade-in-3s"
        />
      </section>
      <LevaGradientModal />
    </main>
  );
}
