import { Nav } from "../components/landing/Nav";
import { Hero } from "../components/landing/Hero";
import { MarqueeBand } from "../components/landing/Marquee";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Themes } from "../components/landing/Themes";
import { Stories } from "../components/landing/Stories";
import { Pricing } from "../components/landing/Pricing";
import { FAQ } from "../components/landing/FAQ";
import { Footer } from "../components/landing/Footer";

export function Landing() {
  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <main>
        <Hero />
        <MarqueeBand />
        <HowItWorks />
        <Themes />
        <Stories />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
