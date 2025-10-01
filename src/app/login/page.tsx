"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthForm } from "@/components/forms/auth-form";

const Login = () => {
	const { user } = authClient.useSession().data || {};
	const router = useRouter();

	if (!!user) {
		router.push("/dashboard");
	}

	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<AuthForm />
			</div>
		</div>
	);
};

export default Login;
