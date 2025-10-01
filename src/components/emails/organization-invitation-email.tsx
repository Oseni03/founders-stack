import React from "react";
import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Text,
	Heading,
	Button,
	Hr,
} from "@react-email/components";

const OrganizationInvitationEmail = (data: {
	organizationName: string;
	inviterName: string;
	inviteeEmail: string;
	invitationId: string;
	role: string;
}) => {
	const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/accept-invitation/${
		data.invitationId
	}`;
	const declineUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reject-invitation/${
		data.invitationId
	}`;

	return (
		<Html>
			<Head />
			<Body style={main}>
				<Container style={container}>
					{/* Header */}
					<Section style={header}>
						<Heading style={h1}>Organization Invitation</Heading>
						<Text style={subtitle}>
							You&rsquo;re invited to join {data.organizationName}
						</Text>
					</Section>

					<Hr style={hr} />

					{/* Main Content */}
					<Section style={content}>
						<Text style={paragraph}>Hi there,</Text>

						<Text style={paragraph}>
							<strong>{data.inviterName}</strong> has invited you
							to join <strong>{data.organizationName}</strong> as
							an <strong>{data.role}</strong>.
						</Text>

						<Text style={paragraphGray}>
							Click the button below to accept this invitation and
							get started.
						</Text>

						{/* Action Buttons */}
						<Section style={buttonContainer}>
							<Button style={primaryButton} href={acceptUrl}>
								Accept Invitation
							</Button>
							<Button style={secondaryButton} href={declineUrl}>
								Decline
							</Button>
						</Section>
					</Section>

					<Hr style={hr} />

					{/* Footer */}
					<Section style={footer}>
						<Text style={footerText}>
							This invitation was sent to {data.inviteeEmail}
						</Text>
						<Text style={footerText}>
							If you have any questions, please contact{" "}
							{data.inviterName}
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

// Styles
const main = {
	backgroundColor: "#ffffff",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "560px",
};

const header = {
	textAlign: "center" as const,
	marginBottom: "32px",
};

const h1 = {
	color: "#000000",
	fontSize: "32px",
	fontWeight: "bold",
	margin: "0 0 8px",
	padding: "0",
};

const subtitle = {
	color: "#666666",
	fontSize: "16px",
	margin: "0",
	padding: "0",
};

const content = {
	margin: "32px 0",
};

const paragraph = {
	color: "#000000",
	fontSize: "16px",
	lineHeight: "24px",
	margin: "0 0 16px",
};

const paragraphGray = {
	color: "#666666",
	fontSize: "16px",
	lineHeight: "24px",
	margin: "0 0 24px",
};

const buttonContainer = {
	textAlign: "center" as const,
	margin: "32px 0",
};

const primaryButton = {
	backgroundColor: "#000000",
	borderRadius: "0px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "12px 32px",
	margin: "0 8px 12px 0",
};

const secondaryButton = {
	backgroundColor: "#ffffff",
	border: "2px solid #000000",
	borderRadius: "0px",
	color: "#000000",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "10px 32px",
	margin: "0 8px 12px 0",
};

const hr = {
	borderColor: "#cccccc",
	margin: "20px 0",
};

const footer = {
	textAlign: "center" as const,
	margin: "32px 0 0",
};

const footerText = {
	color: "#666666",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "0 0 8px",
};

export default OrganizationInvitationEmail;
