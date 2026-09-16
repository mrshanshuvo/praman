# Frontend Architecture & Engineering Guidelines (apps/web)

> **Mandatory Guidelines for AI Agents & Developers**  
> Apply these principles whenever creating, refactoring, or modifying any page, component, or feature in `apps/web`.

---

## 1. Architectural Principles & File Organization (Next.js App Router)

### A. The "Thin Page" Rule (`page.tsx`)

- A `page.tsx` must act **strictly as a coordinator/orchestrator** (ideal length: **< 150 lines**).
- **NEVER** define modals, heavy forms, multi-card layouts, or complex local UI state directly inside `page.tsx`.
- Responsibilities of `page.tsx`:
  1. Route parameters & query hooks (React Query / Server fetchers).
  2. Orchestrating layout components.
  3. Coordinating top-level callbacks (e.g. deletion, modal triggers, mutations).

### B. Route-Level Colocation (`_components/`)

- Always colocate route-specific sub-components in a private `_components/` folder inside the route segment (official Next.js convention).
- Example structure:
  ```
  src/app/jobs/[id]/
  ├── page.tsx                    # Thin orchestrator (< 150 lines)
  └── _components/
      ├── index.ts                # Clean barrel exports
      ├── types.ts                # Route-specific interfaces & type definitions
      ├── JobHeaderCard.tsx       # Title, metadata, trigger actions
      ├── StageJdSection.tsx      # Stage 1 structured view
      ├── StageMatchSection.tsx   # Stage 2 match view
      ├── StageStrategySection.tsx# Stage 3 strategy view
      └── StageResumeSection.tsx  # Stage 4 resume view
  ```
- **Cross-Page Decoupling**: Never import private components from another route's `_components/`. If a component is shared across multiple routes, export it from `@/components/`.

### C. File Size Benchmark

- **Hard Limit**: Maximum **200–250 lines** per file.
- If a component grows larger:
  - Separate form logic from presentation.
  - Break repetitive rows/cards into memoized child items.

---

## 2. React 19 & React Compiler Compliance

### A. The "No Effect for Form State" Rule (Anti-Cascading Renders)

- **NEVER** synchronize prop changes into local state with `useEffect`:
  ```tsx
  // ❌ ANTI-PATTERN: Triggers cascading renders and breaks React Compiler
  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);
  ```
- **OFFICIAL REACT PATTERN**: Split the dialog/modal into a container and an inner keyed form:
  ```tsx
  // ✅ GOLD STANDARD: Keyed mount initializes state directly
  export function EditModal({ isOpen, onClose, initialData }: EditModalProps) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          {isOpen && (
            <EditForm
              key={initialData?.id ?? "edit-form"}
              initialData={initialData}
              onClose={onClose}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  function EditForm({
    initialData,
    onClose,
  }: {
    initialData: ProfileData;
    onClose: () => void;
  }) {
    // Initialized directly, 0 effects needed!
    const [formData, setFormData] = useState({
      first_name: initialData.first_name || "",
    });
  }
  ```

### B. Clean Memoization (No Over-Memoizing)

- **Do not** wrap primitive string derivations or lightweight dates in `useMemo`:
  ```tsx
  // ❌ Redundant overhead that causes React Compiler dependency mismatches:
  const fullName = useMemo(
    () => `${user.first_name} ${user.last_name}`,
    [user.first_name, user.last_name],
  );

  // ✅ Compute directly during render:
  const fullName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Member";
  ```
- Reserve `useMemo` / `useCallback` for:
  1. Expensive calculations (filtering/sorting large lists).
  2. Stable function references passed to memoized children.

### C. Strict TypeScript Standards

- Never use empty interfaces:
  ```ts
  // ❌ Lint Error: An interface declaring no members is equivalent to its supertype
  export interface UserView extends UserData {}

  // ✅ Use type alias instead:
  export type UserView = UserData;
  ```
- Always define explicit types for component props and API responses. Avoid `any`.

---

## 3. Performance & Resource Optimization

### A. Code-Splitting Interactive Overlays

- Heavy modals and interactive dialogs that are hidden by default should **always** be lazy-loaded using `next/dynamic`:
  ```tsx
  const EditModal = dynamic(() => import("./_components/EditModal"), {
    ssr: false,
  });
  ```
- Keeps the initial page bundle lightweight and optimizes Core Web Vitals (LCP & TTI).

### B. Zero Cumulative Layout Shift (CLS)

- Instead of showing a centered full-page spinner that flashes during data loading, provide a **Skeleton UI** that mirrors the actual page layout structure using `@/components/ui/skeleton`.

### C. Preventing Memory Leaks

- When using `URL.createObjectURL(file)`, always clean up with `URL.revokeObjectURL(url)` on unmount or file replacement, or use `FileReader.readAsDataURL()`.

---

## 4. Forms & Network Resilience

### A. Inflight State Protection

- Disable submit buttons and input fields while an API mutation is inflight (`isLoading` / `isPending`).
- Display an inline spinner on the submit button while processing.

### B. Input Sanitization

- Always `.trim()` string inputs before sending to backend mutations to avoid trailing whitespace database errors.

### C. Actionable Error Recovery

- When server queries fail, display clear alerts that include a **"Retry" button** triggering React Query's `refetch()`:
  ```tsx
  {Boolean(error) && (
    <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
      <p className="text-rose-400 text-sm">Failed to sync data.</p>
      <Button variant="ghost" size="sm" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  )}
  ```

---

## 5. UI & Design System Consistency (Praman Brand Standard)

- **Shadcn UI Full Power & Proactive Installation**: Always prefer official Shadcn UI primitives over raw HTML or custom ad-hoc elements. If an additional Shadcn component is needed (e.g. `select`, `alert`, `avatar`, `dialog`, `dropdown-menu`, `sheet`, `scroll-area`), install it proactively via `pnpm dlx shadcn@latest add -y <component>` and integrate it directly.
- **Primitives**: Always compose official Shadcn UI primitives (`@/components/ui/*`: `Badge`, `Button`, `Card`, `Input`, `Textarea`, `Tabs`, `Separator`, `Skeleton`, `Dialog`, `Select`, `Alert`, `Avatar`, `Tooltip`).
- **Base UI Button Rule**: Base UI does **not** support `asChild` on `Button`. For Next.js `<Link>`, use `className={buttonVariants({ variant: '...', size: '...' })}`.
- **Theme**: Dark mode optimized with deep zinc palette (`zinc-900`, `zinc-950`), emerald/cyan accents (`emerald-400`, `teal-300`, `cyan-400`).
- **Typography**: Inter for clean sans UI typography (`font-sans`), JetBrains Mono for code/JSON/technical identifiers (`font-mono`).
- **Cards**: Modern rounded cards (`rounded-2xl` / `rounded-3xl`), subtle borders (`border-zinc-800`), backdrop-blur glassmorphism.

---

## Checklist for Every New Page or Component

- [ ] Is `page.tsx` under 150 lines and acting purely as an orchestrator?
- [ ] Are route-specific components in `_components/` with an `index.ts`?
- [ ] Are modals code-split via `next/dynamic({ ssr: false })`?
- [ ] Are form dialogs using keyed mounts instead of `useEffect` + `setState`?
- [ ] Are all inputs and buttons disabled during mutation loading?
- [ ] Does `pnpm check` and `pnpm --filter web build` pass with 0 errors?
