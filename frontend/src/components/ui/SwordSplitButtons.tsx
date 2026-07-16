import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import './SwordSplitButtons.css';

export default function SwordSplitButtons() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leftRef    = useRef<HTMLAnchorElement>(null);
  const rightRef   = useRef<HTMLAnchorElement>(null);
  const cutMarkRef = useRef<HTMLDivElement>(null);
  const sparkRef   = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const w  = wrapperRef.current;
    const l  = leftRef.current;
    const r  = rightRef.current;
    const c  = cutMarkRef.current;
    const sp = sparkRef.current;
    if (done || !w || !l || !r || !c || !sp) return;

    // Mixed color gradient mid-point
    const MIX_MID = '#344e21';
    const LEFT_COLOR  = '#1E3F20';
    const RIGHT_COLOR = '#4a5d23';

    // Timing: line1(1.2s) + initialDelay(2s) + line2(1.75s) = 4.95s → 5.1s
    gsap.set(w,      { opacity: 0, scale: 0.95 });
    gsap.set(c,      { opacity: 1, clipPath: 'inset(0 0 100% 0)' });
    gsap.set(sp,     { opacity: 0, scale: 0 });
    
    // Start buttons as a seamless 50-50 gradient across the whole wrapper
    gsap.set(l, { x: 0, y: 0, background: `linear-gradient(to right, ${LEFT_COLOR} 0%, ${MIX_MID} 100%)` });
    gsap.set(r, { x: 0, y: 0, background: `linear-gradient(to right, ${MIX_MID} 0%, ${RIGHT_COLOR} 100%)` });

    const tl = gsap.timeline({ delay: 5.1, onComplete: () => setDone(true) });

    // 1 — buttons emerge as one fused block in gradient color
    tl.to(w, { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' });

    // 2 — the SLASH: scar sweeps top → bottom ultra-fast
    tl.addLabel('slash', '+=0.45');
    tl.to(c, { clipPath: 'inset(0 0 0% 0)', duration: 0.12, ease: 'expo.in' }, 'slash');

    // 3 — Cinematic impact: tiny scale pop, spark burst, brightness flash, AND color split
    const impactTime = 'slash+=0.12'; // exactly as the slash finishes
    
    // Impact structural shake/pop (no elastic bounce to prevent rendering gap)
    tl.to(w,  { scale: 1.04, duration: 0.04, ease: 'power2.out' }, impactTime);
    tl.to(w,  { scale: 1, duration: 0.2, ease: 'power2.out' }, `${impactTime}+=0.04`);
    
    // Spark burst
    tl.to(sp, { opacity: 1, scale: 1.8, duration: 0.04, ease: 'none' }, impactTime);
    tl.to(sp, { opacity: 0, scale: 4, duration: 0.4, ease: 'power2.out' }, `${impactTime}+=0.04`);
    
    // The exact moment the sword cuts through, colors split to solid with a high brightness flash
    gsap.set([l, r], { filter: 'brightness(1)' });
    
    tl.to(l, { 
      background: LEFT_COLOR, 
      filter: 'brightness(1.5)',
      duration: 0.05, ease: 'none' 
    }, impactTime);
    tl.to(r, { 
      background: RIGHT_COLOR, 
      filter: 'brightness(1.5)',
      duration: 0.05, ease: 'none' 
    }, impactTime);

    // Settle the brightness back to normal
    tl.to([l, r], { filter: 'brightness(1)', duration: 0.4, ease: 'power2.out' }, `${impactTime}+=0.05`);

    // 4 — scar settles to ambient glow
    tl.to(c, {
      boxShadow: '0 0 4px rgba(255,255,255,0.6), 0 0 10px rgba(255,255,255,0.3)',
      duration: 0.6, ease: 'power2.out'
    }, '+=0.1');

  }, [done]);

  return (
    <div className="sword-split-wrapper" ref={wrapperRef}>
      <Link to="/map" className="sword-left" ref={leftRef}>Buy Land</Link>

      <div className="sword-cut-mark" ref={cutMarkRef} />
      <div className="sword-spark"    ref={sparkRef}   />

      <Link to="/login?mode=register&role=SELLER" className="sword-right" ref={rightRef}>Sell Land</Link>
    </div>
  );
}
