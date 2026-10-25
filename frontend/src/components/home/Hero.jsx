import { motion } from "framer-motion";
import { ArrowUpRight, ArrowRight, PackageCheck } from "lucide-react";
import ProductImage from "../common/ProductImage";

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="container hero-grid">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div className="eyebrow">
            <span className="dot" /> WELCOME TO MAXAB
          </div>

          <h1>
            Everyday Essentials.
            <br />
            <em>Better Choices.</em>
          </h1>

          <p>
            Discover thoughtfully selected smart gadgets, fashion
            and lifestyle products. A simpler way to shop for
            everything you love.
          </p>

          <div className="hero-buttons">
            <a href="#shop" className="button-primary">
              Shop Collection <ArrowUpRight size={19} />
            </a>
            <a href="#category" className="button-secondary">
              Explore Categories <ArrowRight size={18} />
            </a>
          </div>

          <div className="hero-perks">
            <PackageCheck size={21} />
            <span>Curated Products • Easy Shopping Experience</span>
          </div>
        </motion.div>

        <motion.div
          className="hero-photo"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75 }}
        >
          <div className="hero-photo-inner">
            <ProductImage
              src="/images/dictionary-locker.jpg"
              alt="MAXAB Smart Dictionary Locker"
            />
          </div>
          <div className="hero-photo-label">
            <span>FEATURED COLLECTION</span>
            <strong>Smart Dictionary Locker</strong>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
