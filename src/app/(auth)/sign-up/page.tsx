/** @format */

import { SignUpView } from "@/modules/auth/ui/views/sign-up-view";

// page.tsx is a special file in Next.js that is used to create a page.

const Page = () => {
	console.log("This runs in server");
	return <SignUpView />; // this will run in client
};

export default Page; // you always need to export the page for next.js to find this route

// http://localhost:3000/sign-in
