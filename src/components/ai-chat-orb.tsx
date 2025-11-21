import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	Send,
	Paperclip,
	ExternalLink,
	Github,
	MessageCircle,
} from "lucide-react";
import orbImage from "@assets/generated_images/glowing_ai_orb_for_chat_interface.png";
import { Button } from "./ui/button";
import Image from "next/image";
import { useProductStore } from "@/zustand/providers/product-store-provider";

export function AIChatOrb() {
	const [isOpen, setIsOpen] = useState(false);
	const [inputMessage, setInputMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { chatMessages, sendChatMessage, integrations } = useProductStore(
		(state) => state
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chatMessages]);

	const handleSend = async () => {
		if (!inputMessage.trim() || isTyping) return;

		const message = inputMessage;
		setInputMessage("");
		setIsTyping(true);

		await sendChatMessage(message);
		setIsTyping(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const getProviderIcon = (type: string) => {
		switch (type) {
			case "linear":
				return (
					<div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px]">
						L
					</div>
				);
			case "github":
				return (
					<div className="w-4 h-4 rounded-full bg-gray-500/20 text-gray-400 flex items-center justify-center">
						<Github size={10} />
					</div>
				);
			case "intercom":
				return (
					<div className="w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
						<MessageCircle size={10} />
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<motion.div
				className="fixed bottom-8 right-8 z-50 cursor-pointer"
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				onClick={() => setIsOpen(true)}
			>
				<div className="relative w-16 h-16">
					<div className="absolute inset-0 rounded-full bg-primary/50 blur-xl animate-pulse" />
					<Image
						src={orbImage}
						alt="AI Chat"
						className="w-full h-full rounded-full object-cover shadow-2xl border-2 border-white/20 relative z-10"
					/>
				</div>
			</motion.div>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
						animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
						exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
						className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 sm:p-8"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.95, opacity: 0, y: 20 }}
							className="w-full h-full max-w-5xl max-h-[800px] bg-black/80 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-xl"
						>
							<div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-primary/20">
										<Image
											src={orbImage}
											alt="AI"
											className="w-full h-full object-cover"
										/>
									</div>
									<div>
										<h3 className="font-display font-bold text-white text-lg">
											Apex AI Director
										</h3>
										<p className="text-xs text-primary flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
											Connected to{" "}
											{Object.entries(integrations)
												.filter(([_, v]) => v)
												.map(([k]) => k)
												.join(", ")}
										</p>
									</div>
								</div>
								<Button
									onClick={() => setIsOpen(false)}
									className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
								>
									<X size={24} />
								</Button>
							</div>

							<div className="flex-1 p-8 overflow-y-auto space-y-8">
								{chatMessages.length === 0 ? (
									<div className="flex items-center justify-center h-full">
										<div className="text-center space-y-4 max-w-md">
											<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
												<Image
													src={orbImage}
													alt="AI"
													className="w-12 h-12 rounded-full"
												/>
											</div>
											<h4 className="text-xl font-bold text-white">
												Ask me anything
											</h4>
											<p className="text-muted-foreground">
												I can help you understand
												what&rsquo;s blocking your team,
												prioritize features, or analyze
												customer feedback.
											</p>
											<div className="space-y-2 text-left mt-6">
												<p className="text-xs text-muted-foreground font-semibold uppercase">
													Try asking:
												</p>
												{[
													"Why is issue #234 stuck?",
													"Show me all checkout-related bugs",
													"What should we build next?",
												].map((q, i) => (
													<button
														key={i}
														onClick={() =>
															setInputMessage(q)
														}
														className="block w-full text-left px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-colors text-sm text-gray-300"
													>
														{q}
													</button>
												))}
											</div>
										</div>
									</div>
								) : (
									<>
										{chatMessages.map((msg) => (
											<div
												key={msg.id}
												className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
											>
												<div
													className={`w-10 h-10 rounded-full flex-shrink-0 mt-1 shadow-lg ${
														msg.role === "user"
															? "bg-gradient-to-tr from-purple-500 to-cyan-500"
															: "overflow-hidden border border-white/20"
													}`}
												>
													{msg.role ===
														"assistant" && (
														<Image
															src={orbImage}
															alt="AI"
															className="w-full h-full object-cover"
														/>
													)}
												</div>
												<div className="space-y-2 max-w-[80%]">
													<div
														className={`p-6 rounded-3xl text-base leading-relaxed shadow-xl ${
															msg.role === "user"
																? "bg-primary/20 border border-primary/30 rounded-tr-none text-white"
																: "bg-white/5 border border-white/10 rounded-tl-none text-gray-200"
														}`}
													>
														<div className="whitespace-pre-wrap">
															{msg.content}
														</div>

														{msg.sources &&
															msg.sources.length >
																0 && (
																<div className="mt-4 pt-4 border-t border-white/10 space-y-2">
																	<div className="text-xs text-muted-foreground font-semibold">
																		Sources:
																	</div>
																	{msg.sources.map(
																		(
																			source,
																			idx
																		) => (
																			<div
																				key={
																					idx
																				}
																				className="flex items-center gap-2 text-xs text-gray-300 p-2 hover:bg-white/5 rounded transition-colors"
																			>
																				{getProviderIcon(
																					source.type
																				)}
																				<span className="font-mono text-muted-foreground">
																					{
																						source.id
																					}
																				</span>
																				<span className="truncate flex-1">
																					{
																						source.title
																					}
																				</span>
																				<ExternalLink
																					size={
																						10
																					}
																					className="opacity-50 hover:opacity-100"
																				/>
																			</div>
																		)
																	)}
																</div>
															)}
													</div>
												</div>
											</div>
										))}

										{isTyping && (
											<div className="flex gap-6">
												<div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1 border border-white/20">
													<Image
														src={orbImage}
														alt="AI"
														className="w-full h-full object-cover"
													/>
												</div>
												<div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-none">
													<div className="flex gap-1">
														<div
															className="w-2 h-2 rounded-full bg-primary animate-bounce"
															style={{
																animationDelay:
																	"0ms",
															}}
														/>
														<div
															className="w-2 h-2 rounded-full bg-primary animate-bounce"
															style={{
																animationDelay:
																	"150ms",
															}}
														/>
														<div
															className="w-2 h-2 rounded-full bg-primary animate-bounce"
															style={{
																animationDelay:
																	"300ms",
															}}
														/>
													</div>
												</div>
											</div>
										)}
										<div ref={messagesEndRef} />
									</>
								)}
							</div>

							<div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
								<div className="relative max-w-4xl mx-auto w-full">
									<input
										type="text"
										value={inputMessage}
										onChange={(e) =>
											setInputMessage(e.target.value)
										}
										onKeyDown={handleKeyDown}
										placeholder="Ask Apex anything..."
										disabled={isTyping}
										className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-base text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all shadow-inner disabled:opacity-50"
									/>
									<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
										<Button
											className="p-2 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors"
											disabled={isTyping}
										>
											<Paperclip size={20} />
										</Button>
										<Button
											onClick={handleSend}
											disabled={
												!inputMessage.trim() || isTyping
											}
											className="p-2 bg-primary hover:bg-primary/90 rounded-xl text-white transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<Send size={20} />
										</Button>
									</div>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
