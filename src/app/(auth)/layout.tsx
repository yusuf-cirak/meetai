/** @format */

interface Props {
	children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-3xl">{children}</div>
		</div>
	);
};

export default Layout;

// layout files are special files that are resolved by nextjs. you can apply layouts for every components that are inside auth folder.

// http://localhost:3000/auth/sign-in => this is the format for every route that is inside auth folder.
// if you change your folder name with (auth) then your route will be like this: http://localhost:3000/sign-in
