 'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Consultant = {
  id: string;
  full_name?: string;
  title?: string;
  picture_url?: string;
  booking_url?: string;
};

export default function ConsultantCarousel() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;
    const fetchConsultants = async () => {
      try {
        const { data } = await supabase
          .from('consultants')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12);

        if (!isMounted) return;
        setConsultants(data || []);
      } catch (err) {
        console.error('Error loading consultants:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConsultants();
    return () => {
      isMounted = false;
    };
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const totalWidthRef = useRef(0);
  const resumeTimeoutRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const didDragRef = useRef(false);
  const lastMoveTimeRef = useRef<number>(0);
  const lastMoveXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0); // px/sec, positive means moving left
  const momentumRafRef = useRef<number | null>(null);
  const speed = 40; // px per second

  const wrapOffset = (value: number) => {
    const width = totalWidthRef.current;
    if (!width || width <= 0) return 0;
    let next = value % width;
    if (next < 0) next += width;
    return next;
  };

  const applyTransform = () => {
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  };

  const scheduleResume = (delayMs = 900) => {
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, delayMs);
  };

  const stopMomentum = () => {
    if (momentumRafRef.current) cancelAnimationFrame(momentumRafRef.current);
    momentumRafRef.current = null;
  };

  const startMomentum = (initialVelocityPxPerSec: number) => {
    stopMomentum();

    // Keep paused during momentum; we'll resume after it settles.
    pausedRef.current = true;
    velocityRef.current = initialVelocityPxPerSec;

    let lastTime: number | null = null;
    const deceleration = 2600; // px/sec^2 (tuned for a quick, smooth settle)

    const step = (now: number) => {
      if (lastTime == null) lastTime = now;
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const v0 = velocityRef.current;
      if (Math.abs(v0) < 40) {
        stopMomentum();
        scheduleResume();
        return;
      }

      offsetRef.current = wrapOffset(offsetRef.current + v0 * dt);
      applyTransform();

      // Apply constant deceleration opposite to direction of travel.
      const dv = deceleration * dt;
      if (v0 > 0) velocityRef.current = Math.max(0, v0 - dv);
      else velocityRef.current = Math.min(0, v0 + dv);

      momentumRafRef.current = requestAnimationFrame(step);
    };

    momentumRafRef.current = requestAnimationFrame(step);
  };

  // continuous animation effect
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const recalc = () => {
      totalWidthRef.current = track.scrollWidth / 2 || 0; // track contains two copies
    };

    recalc();
    let lastTime: number | null = null;

    function step(now: number) {
      if (lastTime == null) lastTime = now;
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const width = totalWidthRef.current;
      if (!pausedRef.current && width > 0) {
        offsetRef.current += speed * delta;
        if (offsetRef.current >= width) offsetRef.current -= width;
        const cur = trackRef.current;
        if (cur) cur.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);

    const onEnter = () => { pausedRef.current = true; };
    const onLeave = () => { pausedRef.current = false; };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => recalc()) : null;
    if (ro) {
      ro.observe(container);
      ro.observe(track);
    }

    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopMomentum();
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
      if (ro) ro.disconnect();
    };
  }, [consultants]);

  if (loading) {
    return (
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-2 animate-pulse w-full">
            <div className="h-40 bg-gray-200 rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (consultants.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">Connect with Certified Therapists</h3>
          <p className="text-sm text-muted-foreground">No consultants available right now. Add consultants via the admin panel.</p>
        </CardContent>
      </Card>
    );
  }

  // If 3 or fewer consultants just show them inline
  if (consultants.length <= 3) {
    return (
      <div className="flex gap-4 overflow-x-hidden">
        {consultants.map((c) => (
          <div key={c.id} className="consultant-card-wrapper">
            <Card className="relative border-2 overflow-hidden rounded-lg h-[220px]">
              {c.picture_url ? (
                <div className="relative h-full w-full">
                  <img src={c.picture_url} alt={c.full_name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between">
                    <div className="text-white">
                      <h4 className="text-lg font-bold">{c.full_name || 'Consultant'}</h4>
                      <p className="text-sm opacity-90">{c.title || 'Therapist'}</p>
                    </div>

                    <div>
                      {c.booking_url ? (
                        <a href={c.booking_url} target="_blank" rel="noopener noreferrer">
                          <Button className="rounded-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm">Book Now</Button>
                        </a>
                      ) : (
                        <Link href={`/consultants/${c.id}`}>
                          <Button className="rounded-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm">Details</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-full flex items-center justify-center bg-gray-100">
                  <span className="text-5xl">👩‍⚕️</span>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none', touchAction: 'pan-y' }}
      onPointerDown={(e) => {
        // Left button / touch only
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);

        stopMomentum();

        pausedRef.current = true;
        isDraggingRef.current = true;
        didDragRef.current = false;
        dragStartXRef.current = e.clientX;
        dragStartOffsetRef.current = offsetRef.current;

        lastMoveTimeRef.current = performance.now();
        lastMoveXRef.current = e.clientX;
        velocityRef.current = 0;

        try {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        } catch {
          // no-op
        }
      }}
      onPointerMove={(e) => {
        if (!isDraggingRef.current) return;
        const delta = dragStartXRef.current - e.clientX;
        if (Math.abs(delta) > 4) didDragRef.current = true;

        offsetRef.current = wrapOffset(dragStartOffsetRef.current + delta);
        applyTransform();

        const now = performance.now();
        const dt = (now - lastMoveTimeRef.current) / 1000;
        if (dt > 0) {
          const dx = lastMoveXRef.current - e.clientX;
          // velocity is in the same direction as offset (drag left increases offset)
          velocityRef.current = dx / dt;
          lastMoveTimeRef.current = now;
          lastMoveXRef.current = e.clientX;
        }
      }}
      onPointerUp={(e) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;

        try {
          (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        } catch {
          // no-op
        }

        // Add a little inertia so sliding feels natural.
        const v = velocityRef.current;
        if (Math.abs(v) > 200) startMomentum(v);
        else scheduleResume();
      }}
      onPointerCancel={() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        scheduleResume();
      }}
      onWheel={(e) => {
        // Support trackpads / shift+wheel for horizontal scrolling.
        const useDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
        if (!useDelta) return;

        e.preventDefault();
        if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
        pausedRef.current = true;
        offsetRef.current = wrapOffset(offsetRef.current + useDelta);
        applyTransform();
        scheduleResume();
      }}
      onClickCapture={(e) => {
        // Prevent accidental clicks when the user was dragging.
        if (!didDragRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        didDragRef.current = false;
      }}
    >
      <div ref={trackRef} className="flex gap-4 will-change-transform">
        {consultants.map((c) => (
          <div key={c.id} className="consultant-card-wrapper">
            <Card className="relative border-2 overflow-hidden rounded-lg h-[220px]">
              {c.picture_url ? (
                <div className="relative h-full w-full">
                  <img src={c.picture_url} alt={c.full_name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between">
                    <div className="text-white">
                      <h4 className="text-lg font-bold">{c.full_name || 'Consultant'}</h4>
                      <p className="text-sm opacity-90">{c.title || 'Therapist'}</p>
                    </div>

                    <div>
                      {c.booking_url ? (
                        <a href={c.booking_url} target="_blank" rel="noopener noreferrer">
                          <Button className="rounded-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm">Book Now</Button>
                        </a>
                      ) : (
                        <Link href={`/consultants/${c.id}`}>
                          <Button className="rounded-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm">Details</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-full flex items-center justify-center bg-gray-100">
                  <span className="text-5xl">👩‍⚕️</span>
                </div>
              )}
            </Card>
          </div>
        ))}

        {/** duplicated for seamless looping */}
        {consultants.map((c) => (
          <div key={`dup-${c.id}`} className="consultant-card-wrapper">
            <Card className="relative border-2 overflow-hidden rounded-lg h-[220px]">
              {c.picture_url ? (
                <div className="relative h-full w-full">
                  <img src={c.picture_url} alt={c.full_name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between">
                    <div className="text-white">
                      <h4 className="text-lg font-bold">{c.full_name || 'Consultant'}</h4>
                      <p className="text-sm opacity-90">{c.title || 'Therapist'}</p>
                    </div>
                    <div>
                      {c.booking_url ? (
                        <a href={c.booking_url} target="_blank" rel="noopener noreferrer">
                          <Button className="rounded-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm">Book Now</Button>
                        </a>
                      ) : (
                        <Link href={`/consultants/${c.id}`}>
                          <Button className="rounded-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm">Details</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-full flex items-center justify-center bg-gray-100">
                  <span className="text-5xl">👩‍⚕️</span>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* One card per view on mobile; more on larger screens */
        .consultant-card-wrapper {
          flex: 0 0 100%;
          max-width: 100%;
        }

        @media (min-width: 640px) {
          .consultant-card-wrapper {
            flex: 0 0 calc((100% - 16px) / 2);
            max-width: calc((100% - 16px) / 2);
          }
        }

        @media (min-width: 1024px) {
          .consultant-card-wrapper {
            flex: 0 0 calc((100% - 32px) / 3);
            max-width: calc((100% - 32px) / 3);
          }
        }
      `}</style>
    </div>
  );
}
