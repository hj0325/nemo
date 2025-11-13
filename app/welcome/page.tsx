export default function Welcome() {
  return (
    <main className="min-h-screen screen-two-bg">
      <div className="mx-auto max-w-[1100px] px-8 sm:px-12 md:px-16">
        <div className="pt-16 sm:pt-24 md:pt-28">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black/85">
            안녕하세요!
          </h1>
          <p className="mt-8 text-2xl sm:text-3xl md:text-4xl leading-snug text-black/70 max-w-[28ch]">
            당신의 쉼은 언제인가요?
            <br />
            일상속 휴식의 틈을
            <br />
            만들어주세요.
          </p>
        </div>
      </div>
    </main>
  );
}


