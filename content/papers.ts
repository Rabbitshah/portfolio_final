// content/papers.ts  (new: the old site had no research data)
// Everything here comes from your resume. Nothing has been checked against the papers themselves.
// TODO(content): before launch, open each paper and confirm the title, author order, venue name and every number below.

export interface Paper {
  slug: string;
  title: string;
  venue: string;
  venueShort: string;
  year: number;
  role: string;
  summary: string;
  metrics?: { label: string; value: string }[];
  metricsNote?: string;
  doi?: string;
  url?: string;
  relatedProject?: string; // slug in projects.ts
}

export const papers: Paper[] = [
  {
    slug: "neat-autonomous-car",
    title: "Evolutionary Autonomous Car Navigation Using NEAT Algorithm",
    venue:
      "IEEE ICSCDS-2025, International Conference on Sustainable Computing and Data Science",
    venueShort: "IEEE · ICSCDS-2025",
    year: 2025,
    role: "Co-author",
    summary:
      "Evolved neural networks for autonomous vehicle navigation in a custom Python and Pygame simulation, then compared the result against deep reinforcement learning.",
    // TODO(content): confirm 97% and the 8 h vs 48 h training times against the paper's own results.
    metrics: [
      { label: "Track completion", value: "97%" },
      { label: "Faster training than deep RL", value: "6× (8 h vs 48 h)" },
    ],
    // TODO(content): add the IEEE Xplore URL or DOI. Do not guess it.
    doi: undefined,
    url: undefined,
  },
  {
    slug: "profolio-ijcrt",
    title:
      "ProFolio: An Intelligent Resume and Portfolio Builder Using MERN Stack",
    venue: "IJCRT, Vol. 13, Issue 12 (December 2025)",
    venueShort: "IJCRT · Vol. 13, Issue 12",
    year: 2025,
    role: "Co-author",
    summary:
      "A unified career platform on the MERN stack, with role-based dashboards for job seekers, recruiters and admins, integrating resume building, portfolio management and recruiter analytics.",
    // TODO(content): confirm both figures against the paper. The pilot had only 10 users.
    metrics: [
      { label: "ATS compatibility", value: "80%+" },
      { label: "Recruiter efficiency", value: "+30%" },
    ],
    metricsNote: "Pilot with 10 users",
    // Paper ID from your resume: IJCRT2512468. TODO(content): open the DOI once to confirm it resolves.
    doi: "10.56975/ijcrt.v13i12.298354",
    url: "https://doi.org/10.56975/ijcrt.v13i12.298354",
    relatedProject: "profolio",
  },
];
