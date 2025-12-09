// components/marketing/Features.tsx
const features = [
  { title: "Accurate Time Tracking", desc: "Automatic or manual tracking with idle detection", icon: "Stopwatch" },
  { title: "Optional Screenshots", desc: "Visual proof of work with privacy blur", icon: "Camera" },
  { title: "Activity Levels", desc: "See keyboard & mouse activity in real-time", icon: "Activity" },
  { title: "GPS Location Tracking", desc: "Perfect for field teams and remote workers", icon: "MapPin" },
  { title: "Invoicing & Payroll", desc: "Generate invoices and pay your team automatically", icon: "DollarSign" },
  { title: "Detailed Reports", desc: "18+ report types with export to PDF/CSV", icon: "BarChart3" },
];

export default function Features() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to manage time</h2>
          <p className="text-xl text-gray-600">One platform. All the features. No hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-6">{f.icon}</div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}