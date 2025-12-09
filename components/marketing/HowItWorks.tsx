import { Button } from '@/components/ui/button';

export default function HowItWorks() {
  const steps = [
    {
      title: 'Track time effortlessly',
      description: 'Start the timer, work as usual. FlowTrack captures activity and optional screenshots in the background.',
    },
    {
      title: 'Review and adjust',
      description: 'Clean up timesheets, add notes, and confirm what should be billable in a single view.',
    },
    {
      title: 'Share and get paid',
      description: 'Export accurate reports, generate invoices, and sync with your existing tools.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How FlowTrack works</h2>
          <p className="text-lg text-gray-600">
            Simple enough for your team to adopt in minutes. Powerful enough to run your entire operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.title} className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-left">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 font-semibold">
                {steps.indexOf(step) + 1}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600 mb-4">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            Start tracking in minutes
          </Button>
        </div>
      </div>
    </section>
  );
}
