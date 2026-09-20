// content/faq.ts
// TODO(content): drafted; review every claim. Copied from reference/portfolio-template.html.

export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: "What are you doing now?",
    // TODO(content): confirm wording with employer
    answer:
      "I'm a Software Development Engineer at Praverse Tech in Vadodara, since July 2026.",
  },
  {
    question: "What are you looking for?",
    // TODO(content): decide availability wording now that I am employed
    answer: "Full-stack or AI-product roles, remote preferred.",
  },
  {
    question: "What's your main stack?",
    answer:
      "Python (Django REST, FastAPI) and TypeScript (React, Next.js, Node). PostgreSQL, Redis and Docker for the rest. I've also used MongoDB, AWS and Celery.",
  },
  {
    question: "Which timezone are you in?",
    answer: "IST (UTC+5:30), based in Vadodara, India.",
  },
  {
    question: "What did you do at NexGen Pharma?",
    answer:
      "Two stints. In 2025 I built their corporate website in Next.js. From January to July 2026 I co-developed a QMS MVP for automated robotic platforms in pharma workflows. It is in pilot.",
  },
  {
    question: "Is the research real?",
    answer:
      "Two co-authored papers: NEAT autonomous car navigation at IEEE ICSCDS-2025, and ProFolio in IJCRT Vol. 13, Issue 12. Both are in the Research section.",
  },
  {
    question: "Where can I see the code?",
    answer: "My GitHub profile is linked in the contact section below.",
  },
];
