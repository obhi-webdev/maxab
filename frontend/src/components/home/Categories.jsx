import { motion } from "framer-motion";
import { Laptop, Shirt, HeartPulse, ArrowUpRight } from "lucide-react";

const categories = [
  {
    name: "Smart Gadgets",
    caption: "Practical ideas for modern life",
    Icon: Laptop
  },
  {
    name: "Fashion",
    caption: "Refresh your everyday style",
    Icon: Shirt
  },
  {
    name: "Personal Care",
    caption: "Explore self-care essentials",
    Icon: HeartPulse
  }
];

export default function Categories({ onSelect }) {
  return (
    <section id="category" className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="section-tag">EXPLORE MAXPRODUCT</span>
            <h2>Shop by Category</h2>
          </div>
          <p>Find products that match your everyday needs.</p>
        </div>

        <div className="category-grid">
          {categories.map(({ name, caption, Icon }, index) => (
            <motion.a
              key={name}
              href="#shop"
              className="category-card"
              onClick={() => onSelect(name)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="category-icon"><Icon size={30} /></div>
              <div>
                <h3>{name}</h3>
                <p>{caption}</p>
              </div>
              <ArrowUpRight size={20} />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
