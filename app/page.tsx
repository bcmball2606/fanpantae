import HomeForm from "./HomeForm";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center mb-10 relative">
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="logo-blob w-24 h-24 md:w-32 md:h-32" />
          <h1 className="text-4xl md:text-6xl font-black tracking-wider title-glow">
            แฟนพันธุ์แท้
          </h1>
          <div className="text-2xl md:text-3xl font-bold text-accent-orange tracking-widest"
               style={{ textShadow: "0 0 16px rgba(255, 138, 28, 0.6), 0 2px 4px rgba(0,0,0,0.7)" }}>
            ◆ GeoGuessr ◆
          </div>
        </div>
        <p className="text-white/70 text-sm md:text-base">
          การแข่งขันแฟนพันธุ์แท้ออนไลน์ · 4 โหมด · เต็ม 100 คะแนน
        </p>
      </div>

      <HomeForm />

      <a
        href="/admin"
        className="mt-8 text-white/40 hover:text-white/80 text-xs underline"
      >
        Admin
      </a>
    </div>
  );
}
