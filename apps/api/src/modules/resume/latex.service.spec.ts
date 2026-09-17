import { LatexService } from './latex.service.js';

// Exact full-fidelity production LaTeX template structure stored in Cloudflare R2
const fullProductionTemplate = `\\documentclass[10pt, a4paper]{article}

\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}
% Packages
\\usepackage{setspace}
\\setstretch{1.10}
\\usepackage[
    ignoreheadfoot,
    top=0.75cm, bottom=0.75cm,
    left=1cm, right=1cm,
]{geometry}
\\usepackage{titlesec, tabularx, array, xcolor, enumitem, amsmath}
\\definecolor{primaryColor}{RGB}{0, 79, 144}
\\usepackage[
    pdftitle={%%FULL_NAME%%'s CV},
    pdfauthor={%%FULL_NAME%%},
    colorlinks=true,
    urlcolor=primaryColor
]{hyperref}
\\usepackage{changepage, paracol, needspace, iftex}
\\usepackage{fontawesome5}
\\usepackage{graphicx}

% PDF engine setup
\\ifPDFTeX
    \\input{glyphtounicode}
    \\pdfgentounicode=1
    \\usepackage[utf8]{inputenc}
    \\usepackage{lmodern}
\\fi

\\pagestyle{empty}
\\setcounter{secnumdepth}{0}
\\setlength{\\parindent}{0pt}
\\setlength{\\columnsep}{0cm}
\\setlength{\\topskip}{0pt}
\\renewcommand\\labelitemi{$\\circ$}

% Formatting sections
\\titleformat{\\section}{\\needspace{4\\baselineskip}\\bfseries\\large}{}{0pt}{}[\\vspace{1pt}\\titlerule]
\\titlespacing{\\section}{0pt}{0.20cm}{0.15cm}

\\newenvironment{highlights}{\\begin{itemize}[topsep=0.1cm, parsep=0.1cm, partopsep=0pt, itemsep=0pt, leftmargin=10pt]}{\\end{itemize}}
\\newenvironment{onecolentry}{\\begin{adjustwidth}{0.2cm}{0.2cm}}{\\end{adjustwidth}}
\\newenvironment{twocolentry}[1]{\\onecolentry\\def\\secondColumn{#1}\\setcolumnwidth{\\fill, 4.5cm}\\begin{paracol}{2}}{\\switchcolumn\\raggedleft \\secondColumn\\end{paracol}\\endonecolentry}

\\begin{document}

% ===========================
% Header
% ===========================
\\begin{center}
    {\\Huge \\textbf{%%FULL_NAME%%}} \\\\[3pt]
    {{TITLE_LINE}}
    {{CONTACT_LINE}} \\\\[2pt]
    {{LINKS_LINE}}
\\end{center}

% ===========================
% Professional Summary
% ===========================
{{#if SUMMARY}}
\\section{Professional Summary}
\\begin{onecolentry}
{{SUMMARY}}
\\end{onecolentry}
{{/if}}

% ===========================
% Skills
% ===========================
{{#if SKILLS}}
\\section{Skills}
\\begin{onecolentry}
{{SKILLS}}
\\end{onecolentry}
{{/if}}

% ===========================
% Experience
% ===========================
{{#if HAS_EXPERIENCE}}
\\section{Experience}
{{EXPERIENCE_ENTRIES}}
{{/if}}

% ===========================
% Projects
% ===========================
{{#if HAS_PROJECTS}}
\\section{Projects}
{{PROJECT_ENTRIES}}
{{/if}}

% ===========================
% Education
% ===========================
{{#if HAS_EDUCATION}}
\\section{Education}
{{EDUCATION_ENTRIES}}
{{/if}}

% ===========================
% Certifications
% ===========================
{{#if HAS_CERTIFICATIONS}}
\\section{Certifications}
{{CERTIFICATION_ENTRIES}}
{{/if}}

\\end{document}
`;

describe('LatexService', () => {
  let service: LatexService;
  let mockStorageService: any;

  beforeEach(() => {
    mockStorageService = {
      getFileString: vi.fn().mockImplementation((key: string) => {
        if (key === 'templates/modern-developer.tex') {
          return Promise.resolve(fullProductionTemplate);
        }
        return Promise.resolve(null);
      }),
    };
    service = new LatexService(mockStorageService);
  });

  describe('escapeLatex', () => {
    it('should escape all LaTeX reserved characters correctly', () => {
      const raw =
        'Worked with C++ & Python (100% test coverage) for $500k ARR #1 priority {auth_token}';
      const escaped = service.escapeLatex(raw);

      expect(escaped).toContain('\\&');
      expect(escaped).toContain('\\%');
      expect(escaped).toContain('\\$');
      expect(escaped).toContain('\\#');
      expect(escaped).toContain('\\{');
      expect(escaped).toContain('\\}');
      expect(escaped).not.toMatch(/(?<!\\)&/);
      expect(escaped).not.toMatch(/(?<!\\)%/);
    });
  });

  describe('generateLatex', () => {
    const mockResumeData: any = {
      personal: {
        name: 'Shahid Hasan Shuvo',
        contact: {
          location: 'Dhaka - 1216',
          phone: '+8801929346733',
          email: 'mrshanshuvo@gmail.com',
          linkedin: 'https://linkedin.com/in/shahidhasanshovu',
          github: 'https://github.com/mrshanshuvo',
        },
      },
      summary: 'Full-Stack Developer with expertise in Next.js & NestJS.',
      skills: ['TypeScript', 'React.js', 'PostgreSQL', 'Docker'],
      experience: [
        {
          sourceExperienceId: 'exp-1',
          company: 'Softvence Agency',
          title: 'Jr. Full Stack Developer',
          bullets: [
            'Built real-time features using Socket.IO & NestJS.',
            'Refactored API reducing latency by 35%.',
          ],
        },
      ],
      projects: [
        {
          sourceProjectId: 'proj-1',
          name: 'CareCamp',
          bullets: ['Integrated Stripe payments and Firebase Authentication.'],
        },
      ],
      education: [
        {
          sourceEducationId: 'edu-1',
          institution: 'Green University of Bangladesh',
          degree: 'B.Sc. in Computer Science & Engineering',
        },
      ],
      certifications: [
        {
          sourceCertificationId: 'cert-1',
          name: 'Next Level Web Development',
        },
      ],
    };

    const mockCandidateProfile: any = {
      profile: {
        desiredTitle: 'Full-Stack Developer',
      },
      experiences: [
        {
          id: 'exp-1',
          startDate: 'Aug 2026',
          isCurrent: true,
        },
      ],
      projects: [
        {
          id: 'proj-1',
          link: 'https://mcms-web-client.vercel.app/',
          technologies: ['React', 'Node.js', 'MongoDB'],
        },
      ],
      educations: [
        {
          id: 'edu-1',
          endDate: 'Jan 2026',
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          issuer: 'Programming Hero',
          date: '2026',
        },
      ],
    };

    it('should generate valid full-fidelity LaTeX structure from ResumeData and candidate profile', async () => {
      const tex = await service.generateLatex(mockResumeData, mockCandidateProfile);

      // Verify R2 mock was consulted
      expect(mockStorageService.getFileString).toHaveBeenCalledWith(
        'templates/modern-developer.tex',
      );

      // Verify Document Header & Metadata
      expect(tex).toContain("pdftitle={Shahid Hasan Shuvo's CV}");
      expect(tex).toContain('pdfauthor={Shahid Hasan Shuvo}');
      expect(tex).toContain('\\textbf{Shahid Hasan Shuvo}');
      expect(tex).toContain('\\textbf{Full-Stack Developer}');

      // Verify Contact Links & Escaping
      expect(tex).toContain('\\href{https://wa.me/+8801929346733}{+8801929346733}');
      expect(tex).toContain('\\href{mailto:mrshanshuvo@gmail.com}{mrshanshuvo@gmail.com}');
      expect(tex).toContain('\\href{https://linkedin.com/in/shahidhasanshovu}{LinkedIn}');

      // Verify Summary & Skills
      expect(tex).toContain('Full-Stack Developer with expertise in Next.js \\& NestJS.');
      expect(tex).toContain('TypeScript, React.js, PostgreSQL, Docker');

      // Verify Experience & Highlights
      expect(tex).toContain(
        '\\textbf{Jr. Full Stack Developer} \\hfill \\textit{Softvence Agency · Aug 2026 – Present}',
      );
      expect(tex).toContain('\\item Built real-time features using Socket.IO \\& NestJS.');
      expect(tex).toContain('\\item Refactored API reducing latency by 35\\%.');

      // Verify Projects & Live Link
      expect(tex).toContain(
        '\\textbf{CareCamp - \\href{https://mcms-web-client.vercel.app/}{Live}} \\hfill \\textit{React, Node.js, MongoDB}',
      );
      expect(tex).toContain('\\item Integrated Stripe payments and Firebase Authentication.');

      // Verify Education & Certifications
      expect(tex).toContain(
        '\\textbf{B.Sc. in Computer Science \\& Engineering} — Green University of Bangladesh \\hfill \\textit{Jan 2026}',
      );
      expect(tex).toContain(
        '\\textbf{Next Level Web Development} — Programming Hero \\hfill \\textit{2026}',
      );
    });

    it('generates classic-academic template with serif small-caps structure', async () => {
      const tex = await service.generateLatex(
        mockResumeData,
        mockCandidateProfile,
        'classic-academic',
      );
      expect(tex).toContain('\\scshape');
      expect(tex).toContain("Shahid Hasan Shuvo's Curriculum Vitae");
      expect(tex).toContain('\\section{Scholarly \\& Professional Summary}');
      expect(tex).toContain('\\section{Core Competencies \\& Technical Areas}');
    });

    it('generates compact-executive template with high-density layout', async () => {
      const tex = await service.generateLatex(
        mockResumeData,
        mockCandidateProfile,
        'compact-executive',
      );
      expect(tex).toContain("Shahid Hasan Shuvo's Executive Brief");
      expect(tex).toContain('\\section{Executive Summary}');
      expect(tex).toContain('\\section{Key Competencies}');
      expect(tex).toContain('\\section{Leadership \\& Professional Experience}');
    });
  });
});
