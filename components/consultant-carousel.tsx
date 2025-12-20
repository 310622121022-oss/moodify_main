 'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Consultant = {
  id: string;
  full_name?: string;
  title?: string;
  bio?: string;
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

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-4 px-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="w-[320px] shrink-0 border-2 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  return (
    <div className="overflow-x-auto py-2">
      <div className="flex gap-4 px-2">
        {consultants.map((c) => (
          <div key={c.id} className="w-[320px] shrink-0">
            <Card className="group relative border-2 overflow-hidden">
              {c.picture_url ? (
                <div className="relative h-40 overflow-hidden">
                  <img src={c.picture_url} alt={c.full_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="relative h-40 flex items-center justify-center bg-gray-100">
                  <span className="text-5xl">👩‍⚕️</span>
                </div>
              )}

              <CardContent className="p-4">
                <h4 className="text-lg font-bold text-primary line-clamp-2">{c.full_name || 'Consultant'}</h4>
                <p className="text-sm text-muted-foreground mb-3">{c.title || 'Therapist'}</p>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">{c.bio || ''}</p>
                <div className="flex items-center justify-between gap-2">
                  {c.booking_url ? (
                    <a href={c.booking_url} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">Book Now</Button>
                    </a>
                  ) : (
                    <Link href={`/consultants/${c.id}`} className="w-full">
                      <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">Details</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
