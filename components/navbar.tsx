import {
  FolderOpenDot,
  HomeIcon,
  NotebookPen,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "./ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ModeToggle } from "./ModeToggle";

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <nav className="flex space-x-6 border-b mb-5 px-5 h-14 items-center justify-between">
      <div className="flex space-x-6 items-center">
        <Link href="/" className="flex items-center gap-2">
          <NotebookPen className="w-8 h-8" />
          <span className="font-bold">Issue Tracker</span>
        </Link>
      </div>

      {session && (
        <span className="text-sm text-black dark:text-gray-200">
          👋 Welcome back,
          <span className="font-semibold text-primary ml-1">
            {session.user?.name.split(" ")[0]}
          </span>
        </span>
      )}

      <div className="hidden md:flex items-center space-x-4">
        {session && (
          <>
            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/">
                <HomeIcon size={16} className="w-4 h-4" />
                <span className="hidden lg:inline">Home</span>
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/home">
                <FolderOpenDot size={16} className="w-4 h-4" />
                <span className="hidden lg:inline">Projects</span>
              </Link>
            </Button>

            {/* <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/issues">
                <TriangleAlert size={16} className="w-4 h-4" />
                <span className="hidden lg:inline">Issues</span>
              </Link>
            </Button> */}
          </>
        )}

        <ModeToggle />

        {session ? (
          <form
            action={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/sign-in");
            }}
          >
            <Button type="submit">Sign Out</Button>
          </form>
        ) : (
          <Link href="/sign-in" className={buttonVariants()}>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
