import * as bcrypt from 'bcrypt';
import { db } from './db.js';

export async function seed() {
  console.log('--- Starting Praman Database Seed (Shahid Hasan Shovu) ---');
  await db.connect();

  const userEmail = 'mrshanshuvo@gmail.com';
  const userName = 'Shahid Hasan Shovu';
  const rawPassword = process.env.SEED_DEFAULT_PASSWORD || 'Password123!';
  const defaultPasswordHash = bcrypt.hashSync(rawPassword, 10);

  // Check if user already exists
  let user = await db.orm.public.User.where({ email: userEmail }).first();

  // Also check if old default@praman.dev exists, update or use it
  if (!user) {
    const oldUser = await db.orm.public.User.where({
      email: 'default@praman.dev',
    }).first();
    if (oldUser) {
      user = await db.orm.public.User.where({ id: oldUser.id }).update({
        email: userEmail,
        name: userName,
        passwordHash: defaultPasswordHash,
      });
      console.log(`Updated user ${oldUser.id} to ${userEmail}`);
    } else {
      user = await db.orm.public.User.create({
        email: userEmail,
        name: userName,
        passwordHash: defaultPasswordHash,
      });
      console.log(`Created user with ID: ${user.id}`);
    }
  } else if (!user.passwordHash) {
    const updated = await db.orm.public.User.where({ id: user.id }).update({
      passwordHash: defaultPasswordHash,
    });
    if (updated) {
      user = updated;
      console.log(`Updated existing user ${user.id} with default passwordHash`);
    }
  }

  if (!user) {
    throw new Error('Failed to create or find user');
  }

  // Find candidate profile
  let profile = await db.orm.public.CandidateProfile.where({
    userId: user.id,
  }).first();

  const personalData = {
    name: 'Shahid Hasan Shovu',
    title: 'Full-Stack Developer',
    location: 'Dhaka - 1216, Bangladesh',
    contact: {
      email: 'mrshanshuvo@gmail.com',
      phone: '+8801929346733',
    },
    links: {
      github: 'https://github.com/mrshanshuvo',
      linkedin: 'https://linkedin.com/in/mrshanshuvo',
      portfolio: 'https://shanshuvo.dev',
      beecrowd: 'https://www.beecrowd.com.br/judge/en/users/profile/mrshanshuvo',
    },
    summary:
      'Full-Stack Developer specializing in Next.js, TypeScript, Node.js, and NestJS, with experience building production-ready web applications and RESTful APIs. Experienced in authentication, role-based access control, database design, cloud deployment. Strong problem-solving background with competitive programming experience and a top 4% global ranking on BeeCrowd.',
    achievements: [
      "VC's & Dean's List Scholarship (2022–2025)",
      'ICPC & IDPC Competitor',
      'Top 4% globally on BeeCrowd (321.11 points)',
      'First author: IEEE ICCIT 2025 publication on Multimodal Lie Detection',
    ],
    languages: ['Bangla (Native)', 'English (Fluent)', 'Hindi/Urdu (Conversational)'],
  };

  if (profile) {
    // Clean up old relations to re-seed cleanly
    await db.orm.public.Experience.where({
      candidateProfileId: profile.id,
    }).deleteAll();
    await db.orm.public.Project.where({
      candidateProfileId: profile.id,
    }).deleteAll();
    await db.orm.public.Skill.where({
      candidateProfileId: profile.id,
    }).deleteAll();
    await db.orm.public.Education.where({
      candidateProfileId: profile.id,
    }).deleteAll();
    await db.orm.public.Certification.where({
      candidateProfileId: profile.id,
    }).deleteAll();

    await db.orm.public.CandidateProfile.where({ id: profile.id }).update({
      personal: personalData,
    });
    console.log(`Cleared and updated existing candidate profile ${profile.id}`);
  } else {
    profile = await db.orm.public.CandidateProfile.create({
      userId: user.id,
      personal: personalData,
    });
    console.log(`Created candidate profile ${profile.id}`);
  }

  // 1. Education
  await db.orm.public.Education.create({
    candidateProfileId: profile.id,
    institution: 'Green University of Bangladesh',
    degree: 'B.Sc. in Computer Science & Engineering',
    field: 'Computer Science & Engineering',
    startDate: '2022-01',
    endDate: '2026-01',
    details: "CGPA: 3.76 / 4.00. VC's & Dean's List Scholarship (2022–2025).",
  });

  // 2. Experiences
  await db.orm.public.Experience.create({
    candidateProfileId: profile.id,
    company: 'Softvence Agency',
    title: 'Jr. Full Stack Developer',
    startDate: '2026-08',
    endDate: null,
    isCurrent: true,
    responsibilities: [
      'Developing production applications using Next.js, TypeScript, Node.js, NestJS, and RESTful APIs with auth and RBAC.',
      'Building AI-powered features and integrations while working with PostgreSQL, Docker, and deployment workflows.',
    ],
    technologies: [
      'Next.js',
      'TypeScript',
      'Node.js',
      'NestJS',
      'REST APIs',
      'PostgreSQL',
      'Docker',
      'JWT',
      'RBAC',
    ],
    achievements: [
      'Delivered end-to-end full stack architecture with authenticated RBAC and AI workflow integrations.',
    ],
  });

  await db.orm.public.Experience.create({
    candidateProfileId: profile.id,
    company: 'Softvence Agency',
    title: 'Frontend Developer',
    startDate: '2026-01',
    endDate: '2026-07',
    isCurrent: false,
    responsibilities: [
      'Developed production applications using Next.js, TypeScript, and React.js, focused on performance, SEO, and responsive UI.',
      'Built reusable components, managed state with Redux and Zustand, and contributed to AI-powered features and integrations.',
    ],
    technologies: ['Next.js', 'TypeScript', 'React.js', 'Redux', 'Zustand', 'Tailwind CSS', 'SEO'],
    achievements: [
      'Optimized application performance, SEO scores, and delivered responsive user interfaces.',
    ],
  });

  await db.orm.public.Experience.create({
    candidateProfileId: profile.id,
    company: 'Zensoft Lab',
    title: 'Frontend Developer Intern',
    startDate: '2025-09',
    endDate: '2025-12',
    isCurrent: false,
    responsibilities: [
      'Developed web application features using React.js, focusing on reusable components and maintainable UI architecture.',
      'Collaborated with the development team to deliver user-focused features and improve application usability and performance.',
    ],
    technologies: ['React.js', 'JavaScript', 'HTML5', 'CSS3', 'UI Architecture'],
    achievements: ['Delivered sprint features for maintainable and user-friendly web interfaces.'],
  });

  // 3. Projects
  await db.orm.public.Project.create({
    candidateProfileId: profile.id,
    name: 'CareCamp',
    description:
      'Full-stack medical management platform with RESTful APIs, JWT authentication, and cloud-hosted MongoDB.',
    technologies: [
      'MERN',
      'Node.js',
      'React.js',
      'MongoDB',
      'JWT',
      'Stripe',
      'Firebase Authentication',
    ],
    role: 'Full-Stack Developer',
    outcomes: [
      'Engineered a full-stack medical management platform with RESTful APIs, JWT authentication, and cloud-hosted MongoDB.',
      'Integrated Stripe payments and Firebase Authentication, with responsive dashboards for users, bookings, and transactions.',
    ],
    link: 'https://carecamp.web.app',
  });

  await db.orm.public.Project.create({
    candidateProfileId: profile.id,
    name: 'Gram2City',
    description:
      'Parcel delivery platform with Next.js, TypeScript, Node.js, Express.js, and MongoDB.',
    technologies: ['Next.js', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Socket.IO'],
    role: 'Full-Stack Developer',
    outcomes: [
      'Built a parcel delivery platform with Next.js, TypeScript, Node.js, Express.js, and MongoDB.',
      'Implemented real-time delivery tracking, live chat, REST APIs, JWT authentication, and role-based access control.',
    ],
    link: 'https://gram2city.vercel.app',
  });

  await db.orm.public.Project.create({
    candidateProfileId: profile.id,
    name: 'WhereIsIt',
    description:
      'Community platform for reporting and discovering lost and found items using Next.js and TypeScript.',
    technologies: ['Next.js', 'TypeScript', 'Firebase', 'Node.js', 'Express.js', 'MongoDB'],
    role: 'Full-Stack Developer',
    outcomes: [
      'Built a community platform for reporting and discovering lost and found items using Next.js and TypeScript.',
      'Implemented Firebase authentication, image uploads, search functionality, and recovery confirmation workflows.',
    ],
    link: 'https://whereisit.vercel.app',
  });

  // 4. Skills (Accurate from Shahid's CV, with levels per §1c & §11)
  const skillsToSeed = [
    // Frontend (EXPERIENCED)
    {
      name: 'React.js',
      level: 'EXPERIENCED' as const,
      evidence:
        'Production UI development at Softvence Agency, Zensoft Lab, and multiple full-stack projects',
    },
    {
      name: 'Next.js',
      level: 'EXPERIENCED' as const,
      evidence: 'Production apps at Softvence Agency; Gram2City, WhereIsIt',
    },
    {
      name: 'TypeScript',
      level: 'EXPERIENCED' as const,
      evidence: 'Primary language across frontend and backend at Softvence Agency',
    },
    {
      name: 'JavaScript',
      level: 'EXPERIENCED' as const,
      evidence: 'Core language in all professional applications and competitive programming',
    },
    {
      name: 'Tailwind CSS',
      level: 'EXPERIENCED' as const,
      evidence: 'Styling and UI systems across Next.js and React applications',
    },
    {
      name: 'Shadcn/UI',
      level: 'EXPERIENCED' as const,
      evidence: 'Design system and component architecture in modern Next.js projects',
    },
    {
      name: 'Redux',
      level: 'EXPERIENCED' as const,
      evidence: 'State management at Softvence Agency',
    },
    {
      name: 'Zustand',
      level: 'EXPERIENCED' as const,
      evidence: 'Client state management in production applications at Softvence Agency',
    },

    // Backend (EXPERIENCED)
    {
      name: 'Node.js',
      level: 'EXPERIENCED' as const,
      evidence: 'Backend runtime for RESTful microservices and full-stack platforms',
    },
    {
      name: 'Express.js',
      level: 'EXPERIENCED' as const,
      evidence: 'Backend REST APIs for Gram2City, WhereIsIt, and Bootcamp projects',
    },
    {
      name: 'NestJS',
      level: 'EXPERIENCED' as const,
      evidence: 'Enterprise production backend architecture at Softvence Agency',
    },
    {
      name: 'REST APIs',
      level: 'EXPERIENCED' as const,
      evidence: 'Designing and integrating secure RESTful APIs with auth across all projects',
    },
    {
      name: 'JWT',
      level: 'EXPERIENCED' as const,
      evidence: 'Token-based authentication and secure session handling',
    },
    {
      name: 'RBAC',
      level: 'EXPERIENCED' as const,
      evidence: 'Role-based access control implemented in Softvence production apps and Gram2City',
    },

    // Database (EXPERIENCED & WORKING_KNOWLEDGE)
    {
      name: 'PostgreSQL',
      level: 'EXPERIENCED' as const,
      evidence: 'Relational database design and queries at Softvence Agency and Next Level Web Dev',
    },
    {
      name: 'MongoDB',
      level: 'EXPERIENCED' as const,
      evidence: 'NoSQL schema design across CareCamp, Gram2City, and WhereIsIt',
    },
    {
      name: 'Prisma',
      level: 'EXPERIENCED' as const,
      evidence: 'ORM data modeling and migrations with PostgreSQL',
    },
    {
      name: 'Mongoose',
      level: 'EXPERIENCED' as const,
      evidence: 'ODM schema modeling for MongoDB platforms',
    },
    {
      name: 'NeonDB',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Serverless PostgreSQL deployment and connection pooling',
    },

    // DevOps & Tools (WORKING_KNOWLEDGE)
    {
      name: 'Docker',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Containerizing services and development workflows at Softvence Agency',
    },
    {
      name: 'Git',
      level: 'EXPERIENCED' as const,
      evidence: 'Version control and team collaboration workflows',
    },
    {
      name: 'GitHub Actions',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Automated CI/CD pipelines and deployment',
    },
    {
      name: 'Linux',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Server environments and command line workflows',
    },
    {
      name: 'Vercel',
      level: 'EXPERIENCED' as const,
      evidence: 'Production Next.js deployment and hosting',
    },
    {
      name: 'Firebase',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Auth and storage in CareCamp and WhereIsIt',
    },
    {
      name: 'Postman',
      level: 'EXPERIENCED' as const,
      evidence: 'API testing, documentation, and mock servers',
    },
    {
      name: 'Swagger/OpenAPI',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'API documentation generation in NestJS',
    },
    {
      name: 'Socket.IO',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Live chat and real-time delivery tracking in Gram2City',
    },
    {
      name: 'Stripe',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Payment gateway integration in CareCamp',
    },
    {
      name: 'Python',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'Research project & EDGE Program (BCC, ICT Division)',
    },
    {
      name: 'Django',
      level: 'WORKING_KNOWLEDGE' as const,
      evidence: 'EDGE Program (BCC, ICT Division)',
    },

    // LEARNING (truth-preservation regression test anchors)
    {
      name: 'System Design',
      level: 'LEARNING' as const,
      evidence: 'Currently studying in Next Level Web Development (Programming Hero)',
    },
    {
      name: 'AI Workflows & LLM Integration',
      level: 'LEARNING' as const,
      evidence: 'Building AI-powered features and integrations at Softvence',
    },
    {
      name: 'Deep Learning',
      level: 'LEARNING' as const,
      evidence: 'Research on Multimodal Lie Detection using MFCC and ResNet-18',
    },

    // NOT_LEARNED (critical anti-hallucination anchors)
    { name: 'Solidity', level: 'NOT_LEARNED' as const, evidence: null },
    { name: 'Kubernetes', level: 'NOT_LEARNED' as const, evidence: null },
    { name: 'C++', level: 'NOT_LEARNED' as const, evidence: null },
  ];

  for (const s of skillsToSeed) {
    await db.orm.public.Skill.create({
      candidateProfileId: profile.id,
      name: s.name,
      level: s.level,
      evidence: s.evidence,
    });
  }

  // 5. Training & Certifications
  await db.orm.public.Certification.create({
    candidateProfileId: profile.id,
    name: 'Next Level Web Development (Next.js, Node.js, PostgreSQL, System Design, AI)',
    issuer: 'Programming Hero',
    date: '2026',
  });

  await db.orm.public.Certification.create({
    candidateProfileId: profile.id,
    name: 'Web Development Bootcamp (React, Node.js, Express, MongoDB — 45+ projects)',
    issuer: 'Programming Hero',
    date: '2025',
  });

  await db.orm.public.Certification.create({
    candidateProfileId: profile.id,
    name: 'EDGE Program (Python & Django)',
    issuer: 'BCC, ICT Division',
    date: '2025',
  });

  console.log('Successfully seeded Shahid Hasan Shovu profile!');
  console.log('--- Database Seed Finished ---');
  await db.close();
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
