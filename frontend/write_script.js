const fs = require('fs');
const content = import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import './SwordSplitButtons.css';

export default function SwordSplitButtons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated || !containerRef.current || !leftRef.current || !rightRef.current || !slashRef.current) return;
    
    // Initial state
    gsap.set(containerRef.current, { opacity: 0, scale: 0.95 });
    gsap.set(slashRef.current, { height: '0%', opacity: 0 });
    gsap.set([leftRef.current, rightRef.current], { x: 0, y: 0 });

    const tl = gsap.timeline({
      delay: 3.2, // wait for text to finish typing
      onComplete: () => setHasAnimated(true)
    });

    // 1. Slow fade pop appear
    tl.to(containerRef.current, {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: 'power3.out'
    });

    // 2. Sword slash down the middle
    tl.to(slashRef.current, {
      height: '140%',
      opacity: 1,
      duration: 0.3,
      ease: 'power4.inOut'
    }, '+=0.2');

    // 3. Split them apart
    tl.to(leftRef.current, {
      x: -16,
      y: 6,
      rotation: -3,
      duration: 0.6,
      ease: 'back.out(1.2)'
    }, '-=0.1');

    tl.to(rightRef.current, {
      x: 16,
      y: -6,
      rotation: 3,
      duration: 0.6,
      ease: 'back.out(1.2)'
    }, '<');

  }, [hasAnimated]);

  return (
    <div className="sword-split-container" ref={containerRef}>
      <div className="sword-left" ref={leftRef}>
        <Link to="/map" className="btn-primary sword-btn">Buy Land</Link>
      </div>
      
      <div className="sword-slash" ref={slashRef} />
      
      <div className="sword-right" ref={rightRef}>
        <Link to="/login?mode=register&role=SELLER" className="btn-olx-sell sword-btn">Sell Land</Link>
      </div>
    </div>
  );
}
;
fs.writeFileSync('src/components/ui/SwordSplitButtons.tsx', content, 'utf8');
