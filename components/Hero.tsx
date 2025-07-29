import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronRightIcon, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function HeroSection() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <section className="bg-background py-24 md:py-32 border-b">
      <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
        {/* Başlık */}
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Simple & Powerful Issue Tracking
        </h1>

        {/* Açıklama */}
        <p className="mt-4 text-muted-foreground text-lg">
          Track, manage, and resolve issues with ease. Stay organized, improve
          productivity, and collaborate seamlessly.
        </p>

        {/* Butonlar */}
        <div className="mt-8 flex justify-center gap-4">
          {session ? (
            <Link href="/issues" className={buttonVariants({ size: "lg" })}>
              <TriangleAlert className="w-4 h-4 mr-2" />
              Go to Issues
            </Link>
          ) : (
            <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
              Sign In
            </Link>
          )}
        </div>

        {/* Alt Bilgi */}
        <div className="mt-6 flex justify-center items-center gap-x-2 text-sm text-muted-foreground">
          <span>Need help?</span>
          <a
            href="#"
            className="inline-flex items-center gap-1 hover:underline font-medium"
          >
            Documentation
            <ChevronRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
