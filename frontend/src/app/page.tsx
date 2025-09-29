'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSOPSummaries } from '@/lib/api';
import { titleToSlug, getDefaultSOPSlug } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToDefaultSOP() {
      try {
        const response = await getSOPSummaries();

        if (response.items.length > 0) {
          // Look for "Pre-Initiate Phase" first
          const preInitiateSOP = response.items.find(sop =>
            sop.title.toLowerCase().includes('pre-initiate') ||
            sop.title.toLowerCase().includes('pre initiate')
          );

          if (preInitiateSOP) {
            const slug = titleToSlug(preInitiateSOP.title);
            router.replace(`/playbook/${slug}`);
          } else {
            // Fallback to first SOP if "Pre-Initiate Phase" not found
            const firstSop = response.items[0];
            const slug = titleToSlug(firstSop.title);
            router.replace(`/playbook/${slug}`);
          }
        } else {
          // No SOPs available, redirect to default slug anyway
          router.replace(`/playbook/${getDefaultSOPSlug()}`);
        }
      } catch (error) {
        console.error('Failed to load SOPs:', error);
        // Fallback to default slug on error
        router.replace(`/playbook/${getDefaultSOPSlug()}`);
      }
    }

    void redirectToDefaultSOP();
  }, [router]);

  // Show loading state while redirecting
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: '1.1rem',
      color: '#666'
    }}>
      Loading Playbook...
    </div>
  );
}
