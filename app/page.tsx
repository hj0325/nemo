import Image from "next/image";
import LevaGradientModal from "./components/LevaGradientModal";
import ThreeBackground from "./components/ThreeBackground";

export default function Home() {
  return (
    <main className="min-h-screen w-full font-sans">
      {/* Three.js background gradient */}
      <ThreeBackground />
      <section className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="flex flex-col items-center text-center px-3">
          <Image
            src="/nemo.png"
            alt="Nemo"
            width={200}
            height={200}
            priority
            className="fade-in-3s -mt-6 mb-2"
          />
          <p
            className="fade-in-delayed text-white/90 text-[14px] leading-snug sm:text-[14px] max-w-[34ch] whitespace-pre-line break-keep"
            style={{ textWrap: "balance" } as any}
          >
            네모나게 각진 세상 속, 
            {"\n"}
            나만의 휴식의 틈이 필요하신가요?
            {"\n"}
            화면을 스크롤 하며 여러분만의 ‘틈’의 창을 만들어보세요.
          </p>
        </div>
      </section>
      <LevaGradientModal />
    </main>
  );
}
