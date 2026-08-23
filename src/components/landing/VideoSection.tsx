"use client";
import EditableText from "@/components/admin/EditableText";

export default function VideoSection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const videoUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/landing-media/landing-video.mp4`
    : undefined;

  return (
    <section className="bg-raz-surface py-16">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1"><EditableText tKey="landing.video.heading1" /></h2>
        <p className="text-2xl font-bold text-gray-900 mb-8"><EditableText tKey="landing.video.heading2" /></p>

        <video
          className="w-full aspect-video rounded-2xl border border-gray-200 bg-black object-contain shadow-sm"
          controls
          playsInline
          preload="metadata"
          src={videoUrl}
          aria-label="Impactify donation impact video"
        >
          Your browser does not support embedded videos.
        </video>
      </div>
    </section>
  );
}
