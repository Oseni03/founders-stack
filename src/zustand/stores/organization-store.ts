import { authClient } from "@/lib/auth-client";
import { getOrganizationById } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";
import { Member, Organization } from "@/types";
import { Invitation, Subscription } from "@prisma/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrganizationStats = {
	activeTasks: number;
	pendingFeedback: number;
	openTickets: number;
	totalIntegrations: number;
};

export type OrganizationState = {
	activeOrganization?: Organization;
	members: Member[];
	invitations: Invitation[];
	organizations: Organization[];
	subscription?: Subscription;
	isAdmin: boolean;
	isLoading: boolean;
	error: string | null;
	organizationStats: OrganizationStats | null;
	statsLoading: boolean;
	statsError: string | null;
};

type OrganizationActions = {
	setActiveOrganization: (organizationId: string) => Promise<void>;
	setOrganizationData: (
		organization: Organization,
		members: Member[],
		invitations: Invitation[],
		subscription?: Subscription
	) => void;
	setOrganizations: (organizations: Organization[]) => Promise<void>;
	addOrganization: (organization: Organization) => Promise<void>;
	updateOrganization: (organization: Organization) => Promise<void>;
	removeOrganization: (organizationId: string) => Promise<void>;
	addInvitation: (invitation: Invitation) => Promise<void>;
	removeInvite: (invitationId: string) => Promise<void>;
	updateMember: (member: Member) => Promise<void>;
	removeMember: (memberId: string) => Promise<void>;
	loadSubscription: (organizationId: string) => Promise<void>;
	subscribe: (organizationId: string, products: string[]) => Promise<void>;
	openPortal: () => Promise<void>;
	updateSubscription: (subscription: Subscription) => void;
	setLoading: (loading: boolean) => void;
	setAdmin: (isAdmin: boolean) => void;
	loadOrganizationStats: () => Promise<void>;
	setOrganizationStats: (stats: OrganizationStats) => void;
};

export type OrganizationStore = OrganizationState & OrganizationActions;

export const defaultInitState: OrganizationState = {
	activeOrganization: undefined,
	members: [],
	invitations: [],
	organizations: [],
	subscription: undefined,
	isAdmin: false,
	isLoading: false,
	error: null,
	organizationStats: null,
	statsLoading: false,
	statsError: null,
};

export const createOrganizationStore = (
	initState: OrganizationState = defaultInitState
) => {
	return create<OrganizationStore>()(
		persist(
			(set, get) => ({
				...initState,
				// Set organization data
				setOrganizationData: (
					organization,
					members,
					invitations,
					subscription?
				) => {
					set((state) => ({
						...state,
						activeOrganization: organization,
						members,
						invitations,
						subscription,
						isLoading: false,
					}));
				},

				setLoading: (loading: boolean) => {
					set((state) => ({ ...state, isLoading: loading }));
				},

				setAdmin: (isAdmin: boolean) => {
					set((state) => ({ ...state, isAdmin }));
				},

				// Set active organization
				setActiveOrganization: async (organizationId) => {
					get().setLoading(true);
					try {
						const { data, success } =
							await getOrganizationById(organizationId);
						const session = await getCurrentUser();
						const isAdmin = !!data?.members?.find(
							(member) =>
								member.userId == session?.user?.id &&
								member.role == "admin"
						);
						if (success && data) {
							get().setOrganizationData(
								data as Organization,
								(data?.members as Member[]) || [],
								data?.invitations || [],
								data.subscription!
							);
							get().setAdmin(isAdmin);
						} else {
							get().setLoading(false);
						}
					} catch (error) {
						console.error("Error fetching organization:", error);
						get().setLoading(false);
					}
				},

				// Organization actions
				setOrganizations: async (organizations) => {
					set((state) => ({
						...state,
						organizations,
					}));
				},

				addOrganization: async (organization) => {
					set((state) => ({
						...state,
						organizations: [...state.organizations, organization],
					}));
				},

				updateOrganization: async (organization) => {
					set((state) => ({
						...state,
						organizations: state.organizations.map((org) =>
							org.id === organization.id
								? { ...org, ...organization }
								: org
						),
						activeOrganization:
							state.activeOrganization?.id === organization.id
								? {
										...state.activeOrganization,
										...organization,
									}
								: state.activeOrganization,
					}));
				},

				removeOrganization: async (organizationId) => {
					set((state) => ({
						...state,
						organizations: state.organizations.filter(
							(org) => org.id !== organizationId
						),
						activeOrganization:
							state.activeOrganization?.id === organizationId
								? undefined
								: state.activeOrganization,
					}));
				},

				// Invitation actions
				addInvitation: async (invitation) => {
					set((state) => ({
						...state,
						invitations: [...state.invitations, invitation],
					}));
				},

				removeInvite: async (invitationId) => {
					set((state) => ({
						...state,
						invitations: state.invitations.filter(
							(invite) => invite.id !== invitationId
						),
					}));
				},

				// Member actions
				updateMember: async (member) => {
					set((state) => ({
						...state,
						members: state.members.map((m) =>
							m.id === member.id ? member : m
						),
					}));
				},

				removeMember: async (memberId) => {
					set((state) => ({
						...state,
						members: state.members.filter(
							(member) => member.id !== memberId
						),
					}));
				},
				loadSubscription: async (organizationId: string) => {
					if (!organizationId) return;
					set((state) => ({
						...state,
						isLoading: true,
						error: null,
					}));
					try {
						const response = await fetch(
							`/api/subscription/${organizationId}`
						);
						if (!response.ok) {
							if (response.status === 404) {
								set((state) => ({
									...state,
									subscription: undefined,
									isLoading: false,
								}));
								return;
							}
							throw new Error("Failed to fetch subscription");
						}
						const { data } = await response.json();
						set((state) => ({
							...state,
							subscription: data,
							isLoading: false,
						}));
					} catch (error) {
						console.error("Error loading subscription:", error);
						set((state) => ({
							...state,
							error:
								error instanceof Error
									? error.message
									: "Failed to load subscription",
							isLoading: false,
						}));
					}
				},

				subscribe: async (
					organizationId: string,
					products: string[]
				) => {
					if (!organizationId) {
						set({ error: "Organization ID required" });
						return;
					}
					set((state) => ({
						...state,
						isLoading: true,
						error: null,
					}));
					try {
						const { data, error } = await authClient.checkout({
							products,
							referenceId: organizationId,
						});
						set({ isLoading: false });
						if (error) {
							throw new Error(error.message);
						}
						if (data?.url) window.location.href = data.url;
					} catch (error) {
						console.error("Error creating checkout:", error);
						set((state) => ({
							...state,
							error:
								error instanceof Error
									? error.message
									: "Failed to create checkout",
							isLoading: false,
						}));
						throw error;
					}
				},

				openPortal: async () => {
					set((state) => ({
						...state,
						isLoading: true,
						error: null,
					}));
					try {
						await authClient.customer.portal();
						set({ isLoading: false });
					} catch (error) {
						console.error("Error opening customer portal:", error);
						set((state) => ({
							...state,
							error:
								error instanceof Error
									? error.message
									: "Failed to open customer portal",
							isLoading: false,
						}));
						throw error;
					}
				},

				updateSubscription: (subscription: Subscription) => {
					set((state) => ({ ...state, subscription }));
				},

				// Stats actions
				loadOrganizationStats: async () => {
					set((state) => ({
						...state,
						statsLoading: true,
						statsError: null,
					}));
					try {
						const response = await fetch("/api/products/stats");
						if (!response.ok) {
							throw new Error(
								"Failed to fetch organization stats"
							);
						}
						const data = await response.json();
						set((state) => ({
							...state,
							products: data.products,
							integrations: data.integrations,
							organizationStats: data.stats,
							statsLoading: false,
						}));
					} catch (error) {
						console.error(
							"Error loading organization stats:",
							error
						);
						set((state) => ({
							...state,
							statsError:
								error instanceof Error
									? error.message
									: "Failed to load organization stats",
							statsLoading: false,
						}));
					}
				},

				setOrganizationStats: (stats: OrganizationStats) => {
					set((state) => ({
						...state,
						organizationStats: stats,
					}));
				},
			}),
			{ name: "organization-store" }
		)
	);
};
