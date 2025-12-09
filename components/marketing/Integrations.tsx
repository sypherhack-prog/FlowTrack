export default function Integrations() {
  const tools = [
    'Slack',
    'Jira',
    'Asana',
    'Trello',
    'QuickBooks',
    'Google Workspace',
  ];

  return (
    <section id="integrations" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Works with your stack</h2>
          <p className="text-lg text-gray-600">
            Connect FlowTrack with the tools your team already uses to keep work, tracking, and payroll in sync.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <div
              key={tool}
              className="h-20 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-sm font-medium text-gray-700 shadow-sm"
            >
              {tool}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
