export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/carLoop.mp4" type="video/mp4" />
      </video>

      {/* Darkening overlay for text legibility */}
      <div className="absolute inset-0 bg-black/50" />

      <h1 className="relative z-10 max-w-4xl px-6 text-center text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
        Your next car, handed off in minutes.
      </h1>
    </div>
  );
}
