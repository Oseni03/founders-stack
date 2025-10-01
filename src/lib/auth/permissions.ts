import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
	...defaultStatements,
	notes: ["create", "retrieve", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
	notes: ["create", "retrieve", "update", "delete"],
});

const admin = ac.newRole({
	notes: ["create", "update", "delete"],
	organization: ["update", "delete"],
	invitation: ["create", "cancel"],
});

export { ac, admin, member, statement };
