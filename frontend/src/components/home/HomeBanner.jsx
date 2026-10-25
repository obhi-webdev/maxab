import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "./HomeBanner.css";

const API = "http://localhost:5001/api";
const SLIDE_DURATION = 5000;

export default function HomeBanner() {
  const [banners, setBanners] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`${API}/banners`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Banner API unavailable");
        }

        const result = await response.json();

        if (!controller.signal.aborted) {
          setBanners(
            (result.data || []).filter(item => item.image)
          );
          setActive(0);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Hero banners:", error.message);
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

  const next = useCallback(() => {
    setActive(current =>
      banners.length ? (current + 1) % banners.length : 0
    );
  }, [banners.length]);

  const previous = useCallback(() => {
    setActive(current =>
      banners.length
        ? (current - 1 + banners.length) % banners.length
        : 0
    );
  }, [banners.length]);

  useEffect(() => {
    if (
      paused ||
      banners.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const timer = window.setInterval(next, SLIDE_DURATION);

    return () => window.clearInterval(timer);
  }, [next, paused, banners.length]);

  return (
    <section
      className="maxab-hero-section"
      aria-label="MAXAB featured collections"
    >
      <div className="maxab-hero-container">
        {banners.length === 0 ? (
          <div className="maxab-hero-empty">
            <div className="maxab-hero-empty-content">
              <span className="maxab-hero-kicker">
                WELCOME TO MAXAB
              </span>
              <h1>
                Discover Better
                <br/>
                Everyday Essentials.
              </h1>
              <p>
                Explore Smart Gadgets, Fashion,
                Lifestyle and More.
              </p>
              <a href="/#shop" className="maxab-hero-cta">
                Shop Now <ArrowUpRight size={18}/>
              </a>
              {loading && (
                <small>Loading featured collections...</small>
              )}
            </div>
          </div>
        ) : (
          <div
            className="maxab-hero-slider"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setPaused(false);
              }
            }}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            {banners.map((banner, index) => (
              <div
                key={banner._id}
                className={
                  "maxab-hero-slide " +
                  (index === active ? "is-active" : "")
                }
                aria-hidden={index !== active}
                inert={index !== active}
              >
                <img
                  className="maxab-hero-image"
                  src={banner.image}
                  alt={banner.title || "MAXAB collection"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  draggable="false"
                />

                <div className="maxab-hero-shade"/>

                <div className="maxab-hero-content">


                  <h1>{banner.title}</h1>

                  {banner.subtitle && (
                    <p>{banner.subtitle}</p>
                  )}

                  <a
                    className="maxab-hero-cta"
                    href={banner.buttonLink || "/#shop"}
                    tabIndex={index === active ? 0 : -1}
                  >
                    {banner.buttonText || "Shop Now"}
                    <ArrowUpRight size={18}/>
                  </a>
                </div>
              </div>
            ))}

            {banners.length > 1 && (
              <>
                <button
                  className="maxab-hero-arrow is-prev"
                  onClick={previous}
                  aria-label="Previous banner"
                >
                  <ChevronLeft size={21}/>
                </button>

                <button
                  className="maxab-hero-arrow is-next"
                  onClick={next}
                  aria-label="Next banner"
                >
                  <ChevronRight size={21}/>
                </button>

                <div
                  className="maxab-hero-dots"
                  aria-label="Banner navigation"
                >
                  {banners.map((banner, index) => (
                    <button
                      key={banner._id}
                      type="button"
                      onClick={() => setActive(index)}
                      className={index === active ? "active" : ""}
                      aria-label={`Show banner ${index + 1}`}
                      aria-current={
                        index === active ? "true" : undefined
                      }
                    />
                  ))}
                </div>

                <span className="maxab-hero-counter">
                  {String(active + 1).padStart(2, "0")}
                  <span> / </span>
                  {String(banners.length).padStart(2, "0")}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
