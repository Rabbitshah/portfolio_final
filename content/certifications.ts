// content/certifications.ts
// Changes from the old file:
//  - Added "Game Design and Development 1: 2D Shooter" (Coursera). It is on your resume but was missing here.
//    The old site claimed "5 Certifications" while this file listed 4. With this entry the count is 5.
//  - Icons removed. Dates are ISO (YYYY-MM) so the UI can format them.
// Show the count by using certifications.length, not a hard-coded number.

export interface Certification {
  title: string;
  issuer: string;
  issued?: string; // YYYY-MM
  description: string;
}

export const certifications: Certification[] = [
  {
    title: "Computer Networks and Internet Protocol",
    issuer: "NPTEL",
    issued: "2024-04",
    description: "Networking protocols and architecture",
  },
  {
    title: "Introduction to Internet of Things",
    issuer: "NPTEL",
    issued: "2025-10",
    description: "IoT systems, sensors and connectivity",
  },
  {
    title: "C and C++ Programming",
    issuer: "BIT",
    issued: "2023-08",
    description: "Core programming concepts and memory management",
  },
  {
    title: "Full Stack Web Development",
    issuer: "Apna College",
    issued: "2025-01",
    description: "End-to-end web application development",
  },
  {
    title: "Game Design and Development 1: 2D Shooter",
    issuer: "Coursera",
    // TODO(content): add the issue date (YYYY-MM).
    description: "Game design fundamentals, built around a 2D shooter",
  },
];
