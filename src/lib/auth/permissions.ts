import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
	...defaultStatements,
	organization: [
		"create",
		"update",
		"delete",
		"configure",
		"transfer_ownership",
		"manage_billing",
	],
	members: ["invite", "remove", "manage_roles"],
	integrations: ["connect", "disconnect", "configure"],
	tasks: ["create", "retrieve", "update", "delete"],
	comments: ["create", "retrieve", "update", "delete"],
	views: ["create", "retrieve", "update", "delete", "share"],
	data: ["view", "export"],
	projects: ["view", "comment"],
} as const;

const ac = createAccessControl(statement);

// Owner: Full access to all actions
const owner = ac.newRole({
	organization: [
		"create",
		"update",
		"delete",
		"configure",
		"transfer_ownership",
		"manage_billing",
	],
	members: ["invite", "remove", "manage_roles"],
	integrations: ["connect", "disconnect", "configure"],
	tasks: ["create", "retrieve", "update", "delete"],
	comments: ["create", "retrieve", "update", "delete"],
	views: ["create", "retrieve", "update", "delete", "share"],
	data: ["view", "export"],
	projects: ["view", "comment"],
	invitation: ["create", "cancel"],
});

// Admin: Broad access, except billing, workspace deletion, and owner management
const admin = ac.newRole({
	organization: ["update", "configure"],
	members: ["invite", "remove", "manage_roles"], // Cannot remove Owner
	integrations: ["connect", "disconnect", "configure"],
	tasks: ["create", "retrieve", "update", "delete"],
	comments: ["create", "retrieve", "update", "delete"],
	views: ["create", "retrieve", "update", "delete", "share"],
	data: ["view", "export"],
	projects: ["view", "comment"],
	invitation: ["create", "cancel"],
});

// Member: Limited to content creation and viewing, conditional integration access
const member = ac.newRole({
	tasks: ["create", "retrieve", "update", "delete"], // Can only edit own content
	comments: ["create", "retrieve", "update", "delete"], // Can only edit own comments
	views: ["create", "retrieve", "update", "delete", "share"],
	data: ["view"],
	projects: ["view", "comment"],
	integrations: ["connect"], // Conditional, based on workspace settings
});

// Viewer: Read-only access with commenting and private views
const viewer = ac.newRole({
	data: ["view", "export"], // Export conditional on settings
	comments: ["create", "retrieve"],
	views: ["create", "retrieve"], // Private views only
	projects: ["view", "comment"],
});

// Guest: Very restricted, project-specific access
const guest = ac.newRole({
	projects: ["view", "comment"], // Only for assigned projects
});

export { ac, owner, admin, member, viewer, guest, statement };
