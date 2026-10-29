import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import "./CategorySlider.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

function CategoryCard({ category, onSelect, duplicate = false }) {
  function select(event) {
    if (duplicate) {
      event.preventDefault();
      return;
    }

    if (typeof onSelect === "function") {
      onSelect(category.name);
    }
  }

  return (
    <a
      href="#shop"
      onClick={select}
      className="maxab-loop-card"
      tabIndex={duplicate ? -1 : 0}
      aria-hidden={duplicate ? true : undefined}
    >
      {category.image ? (
        <img
          src={category.image}
          alt=""
          loading="lazy"
          draggable="false"
        />
      ) : (
        <div className="maxab-loop-placeholder">
          <Package size={45} strokeWidth={1.2}/>
        </div>
      )}

      <div className="maxab-loop-gradient"/>

      <div className="maxab-loop-card-content">
        <h3>{category.name}</h3>
        {category.description && (
          <p>{category.description}</p>
        )}
      </div>
    </a>
  );
}

export default function CategoryBanners({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`${API}/categories`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Unable to load categories");
        }

        const result = await response.json();

        if (!controller.signal.aborted) {
          setCategories(result.data || []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  // Enough cards to fill the desktop width, even with
  // only one or two categories in MongoDB.
  const displayCategories = [];

  if (categories.length) {
    const targetCount = Math.max(6, categories.length);

    for (let i = 0; i < targetCount; i++) {
      displayCategories.push(categories[i % categories.length]);
    }
  }

  return (
    <section
      className="maxab-loop-section"
      id="category"
      aria-label="Shop by category"
    >
      <div className="maxab-loop-header">
        <div>
          <span className="maxab-loop-eyebrow">
            EXPLORE OUR COLLECTIONS
          </span>
          <h2>Shop by Category</h2>
          <p>Find what you love at MAXPRODUCT.</p>
        </div>

        <a href="#shop" className="maxab-loop-view-all">
          View All Products →
        </a>
      </div>

      {loading && (
        <div className="maxab-loop-message">
          Loading collections...
        </div>
      )}

      {error && (
        <div className="maxab-loop-message">
          Categories are temporarily unavailable.
        </div>
      )}

      {!loading && !error && !categories.length && (
        <div className="maxab-loop-message">
          New collections are coming soon.
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="maxab-loop-viewport">
          <div
            className="maxab-loop-track"
            style={{
              "--maxab-loop-duration":
                `${Math.max(24, displayCategories.length * 6)}s`
            }}
          >
            <div className="maxab-loop-group">
              {displayCategories.map((category, index) => (
                <CategoryCard
                  key={`original-${category._id}-${index}`}
                  category={category}
                  onSelect={onSelect}
                />
              ))}
            </div>

            <div
              className="maxab-loop-group"
              aria-hidden="true"
              inert
            >
              {displayCategories.map((category, index) => (
                <CategoryCard
                  key={`copy-${category._id}-${index}`}
                  category={category}
                  onSelect={onSelect}
                  duplicate
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
