import type { SectionProps } from "./typing";

function Section({ title, summary, className, children }: SectionProps) {
  return (
    <div className={className}>
      <div className="flex flex-col space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400">{summary}</p>
      </div>
      {children}
    </div>
  );
}

export default Section;
