import { useEffect, useRef } from "react";
import "./CustomCursor.css";

export default function CustomCursor() {
  const circleRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const pointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (!pointer.matches || reducedMotion.matches) return;

    const circle = circleRef.current;
    const dot = dotRef.current;

    let mouseX = -100;
    let mouseY = -100;
    let circleX = -100;
    let circleY = -100;
    let frame;

    function move(event) {
      mouseX = event.clientX;
      mouseY = event.clientY;

      dot.style.transform =
        `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

      circle.classList.add("visible");
      dot.classList.add("visible");
    }

    function hover(event) {
      const interactive = event.target.closest(
        "a, button, input, textarea, select, [role='button']"
      );

      circle.classList.toggle("hover", Boolean(interactive));
    }

    function animate() {
      // Lower value = smoother and slower circle
      const speed = 0.12;

      circleX += (mouseX - circleX) * speed;
      circleY += (mouseY - circleY) * speed;

      circle.style.transform =
        `translate3d(${circleX}px, ${circleY}px, 0) translate(-50%, -50%)`;

      frame = requestAnimationFrame(animate);
    }

    function hide() {
      circle.classList.remove("visible");
      dot.classList.remove("visible");
    }

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerover", hover);
    document.addEventListener("pointerout", event => {
      if (!event.relatedTarget) hide();
    });
    window.addEventListener("blur", hide);

    animate();

    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", hover);
      window.removeEventListener("blur", hide);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div ref={circleRef} className="maxab-cursor-circle"/>
      <div ref={dotRef} className="maxab-cursor-dot"/>
    </>
  );
}
