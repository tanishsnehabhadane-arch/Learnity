import Link from "next/link";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const title = decodeURIComponent(courseId).replace(/-/g, " ");

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24">
      <p className="font-tech text-xs uppercase tracking-[0.3em] text-crimson">Course</p>
      <h1 className="mt-2 font-display text-5xl font-black uppercase">{title}</h1>
      <p className="mt-4 max-w-2xl opacity-75">
        Your personalized route through this course is recomputed after every graded activity.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="./path"
          className="inline-flex h-12 items-center border-2 border-black bg-crimson px-6 font-tech text-sm font-bold uppercase text-white shadow-brutal dark:border-white"
        >
          Open learning path
        </Link>
        <Link
          href="/playground"
          className="inline-flex h-12 items-center border-2 border-black px-6 font-tech text-sm font-bold uppercase shadow-brutal-sm dark:border-white"
        >
          Code playground
        </Link>
      </div>
    </main>
  );
}
