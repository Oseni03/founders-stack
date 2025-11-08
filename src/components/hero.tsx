import { authClient } from "@/lib/auth-client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { ArrowRight, MoveRight, PhoneCall } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function Hero() {
	const [titleNumber, setTitleNumber] = useState(0);
	const titles = useMemo(
		() => ["powerful", "intuitive", "unified", "smart", "scalable"],
		[]
	);
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (titleNumber === titles.length - 1) {
				setTitleNumber(0);
			} else {
				setTitleNumber(titleNumber + 1);
			}
		}, 2000);
		return () => clearTimeout(timeoutId);
	}, [titleNumber, titles]);

	const { data: session } = authClient.useSession();

	return (
		<div className="w-full">
			<div className="container mx-auto">
				<div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
					<div>
						<Button variant="secondary" size="sm" className="gap-4">
							Read our launch article{" "}
							<MoveRight className="w-4 h-4" />
						</Button>
					</div>
					<div className="flex gap-4 flex-col">
						<h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
							<span className="text-spektr-cyan-50">
								Builder&rsquo;s Stack is a
							</span>
							<span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
								&nbsp;
								{titles.map((title, index) => (
									<motion.span
										key={index}
										className="absolute font-semibold text-foreground"
										initial={{ opacity: 0, y: "-100" }}
										transition={{
											type: "spring",
											stiffness: 50,
										}}
										animate={
											titleNumber === index
												? {
														y: 0,
														opacity: 1,
													}
												: {
														y:
															titleNumber > index
																? -150
																: 150,
														opacity: 0,
													}
										}
									>
										{title}
									</motion.span>
								))}
							</span>
							<span className="text-foreground">
								SaaS dashboard
							</span>
						</h1>
						<p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
							Streamline your SaaS stack with a single pane of
							glass. Aggregate metrics, alerts, and actions from
							20+ tools like GitHub, Jira, and Stripe—built for
							indie founders.
						</p>
					</div>
					<div className="flex flex-row gap-3">
						{session?.user ? (
							<Link href="/products/">
								<Button size="lg" className="gap-4">
									Go to Dashboard{" "}
									<ArrowRight className="w-4 h-4" />
								</Button>
							</Link>
						) : (
							<Link href="/signup">
								<Button size="lg" className="gap-4">
									Start Free Now{" "}
									<ArrowRight className="w-4 h-4" />
								</Button>
							</Link>
						)}
						<Link href="/demo">
							<Button
								size="lg"
								className="gap-4"
								variant="outline"
							>
								Try Demo <PhoneCall className="w-4 h-4" />
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Hero;
