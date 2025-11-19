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
	content: ["create", "retrieve", "update", "delete"],
	comments: ["create", "retrieve", "update", "delete"],
	data: ["view", "export"],
	projects: ["view", "comment", "access"],
} as const;

const ac = createAccessControl(statement);

// OWNER: Full access to all actions including billing and organization deletion
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
	content: ["create", "retrieve", "update", "delete"],
	comments: ["create", "retrieve", "update", "delete"],
	data: ["view", "export"],
	projects: ["view", "comment", "access"],
	invitation: ["create", "cancel"],
});

// ADMIN: Manage members, integrations, and settings (no billing or deletion)
const admin = ac.newRole({
	organization: ["update", "configure"],
	members: ["invite", "remove", "manage_roles"],
	integrations: ["connect", "disconnect", "configure"],
	content: ["create", "retrieve", "update", "delete"],
	comments: ["create", "retrieve", "update", "delete"],
	data: ["view", "export"],
	projects: ["view", "comment", "access"],
	invitation: ["create", "cancel"],
});

// MEMBER: Standard access - create and edit content
const member = ac.newRole({
	content: ["create", "retrieve", "update", "delete"],
	comments: ["create", "retrieve", "update", "delete"],
	data: ["view"],
	projects: ["view", "comment", "access"],
});

// VIEWER: Read-only access
const viewer = ac.newRole({
	content: ["retrieve"],
	comments: ["retrieve"],
	data: ["view"],
	projects: ["view"],
});

// GUEST: Limited access to specific projects only
const guest = ac.newRole({
	projects: ["view", "comment"],
});

export { ac, owner, admin, member, viewer, guest, statement };
