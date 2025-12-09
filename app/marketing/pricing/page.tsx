export default function MarketingPricingPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappBaseUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '#';

  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: 'per user / month',
      description: 'For freelancers and very small teams just getting started.',
      features: ['Basic time tracking', 'Unlimited projects', 'Simple reports'],
      highlighted: false,
    },
    {
      name: 'Team',
      price: '$19',
      period: 'per user / month',
      description: 'For growing teams that need visibility and control.',
      features: ['Advanced reports', 'Optional screenshots', 'Activity levels', 'Priority support'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Let’s talk',
      period: '',
      description: 'For large organizations with custom needs and security requirements.',
      features: ['Custom onboarding', 'Dedicated CSM', 'Security reviews'],
      highlighted: false,
    },
  ];

  const getWhatsAppLink = (planName: string) => {
    if (whatsappBaseUrl === '#') {
      return '#';
    }
    const text = encodeURIComponent(`Hi! I'm interested in the ${planName} plan of FlowTrack.`);
    return `${whatsappBaseUrl}?text=${text}`;
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-600">
            Start free, upgrade when your team is ready. No long-term contracts or hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 text-left ${
                plan.highlighted ? 'border-indigo-500 shadow-xl bg-indigo-50/60' : 'border-gray-200 bg-white shadow-md'
              }`}
            >
              <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
              <p className="text-3xl font-black mb-1">{plan.price}</p>
              {plan.period && <p className="text-sm text-gray-500 mb-4">{plan.period}</p>}
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <a
                href={getWhatsAppLink(plan.name)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Contact us on WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

