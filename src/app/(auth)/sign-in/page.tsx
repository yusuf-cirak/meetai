/** @format */

import { SignInView } from "@/modules/auth/ui/views/sign-in-view";

// page.tsx is a special file in Next.js that is used to create a page.

const Page = () => <SignInView />;

export default Page; // you always need to export the page for next.js to find this route

// http://localhost:3000/auth/sign-in
