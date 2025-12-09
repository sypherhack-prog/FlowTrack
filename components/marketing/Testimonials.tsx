export default function Testimonials() {
  const testimonials = [
    { name: "Sarah Chen", role: "CEO at TechFlow", text: "FlowTrack increased our billable hours by 38% in the first quarter.", avatar: "/avatars/sarah.jpg" },
    { name: "Michael Torres", role: "Agency Owner", text: "Finally, a time tracker that doesn’t feel creepy. Our team loves it.", avatar: "/avatars/michael.jpg" },
    { name: "Emma Larsen", role: "Remote Team Lead", text: "The insights are incredible. We caught inefficiencies we never knew existed.", avatar: "/avatars/emma.jpg" },
  ];

  return (
    <section id="customers" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Loved by teams worldwide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl">
              <p className="text-lg italic mb-8">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-sm text-gray-600">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}