/** @format */

import { auth } from "@/lib/auth";
import { SignInView } from "@/modules/auth/ui/views/sign-in-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// page.tsx is a special file in Next.js that is used to create a page.

const Page = async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!!session) {
		redirect("/");
	}
	return <SignInView />;
};

export default Page; // you always need to export the page for next.js to find this route

// http://localhost:3000/auth/sign-in
