import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

// GET /api/notes/[id] - Get a specific note
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	return withAuth(request, async (request, currentUser) => {
		try {
			const { id: noteId } = await params;

			const note = await prisma.note.findFirst({
				where: {
					id: noteId,
					tenantId: currentUser.organizationId,
				},
				include: {
					author: {
						select: {
							id: true,
							email: true,
							name: true,
						},
					},
				},
			});

			if (!note) {
				return NextResponse.json(
					{ error: "Note not found" },
					{ status: 404 }
				);
			}

			// Users can only access their own notes unless they're admin
			if (
				note.authorId !== currentUser.id &&
				currentUser.role !== "admin"
			) {
				return NextResponse.json(
					{ error: "Access denied" },
					{ status: 403 }
				);
			}

			return NextResponse.json({ note });
		} catch (error) {
			console.error("Get note error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}

// PUT /api/notes/[id] - Update a specific note
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	return withAuth(request, async (request, currentUser) => {
		try {
			const { id: noteId } = await params;
			const { title, content, authorId, tenantId, tags, isPublic } =
				await request.json();

			if (!title || !content) {
				return NextResponse.json(
					{ error: "Title and content are required" },
					{ status: 400 }
				);
			}

			const existingNote = await prisma.note.findFirst({
				where: {
					id: noteId,
					tenantId: currentUser.organizationId,
				},
			});

			if (!existingNote) {
				return NextResponse.json(
					{ error: "Note not found" },
					{ status: 404 }
				);
			}

			if (
				!authorId ||
				!tenantId ||
				currentUser.organizationId !== tenantId
			) {
				return NextResponse.json(
					{ error: "Not authorized" },
					{ status: 401 }
				);
			}

			// Users can only update their own notes unless they're admin
			if (
				existingNote.authorId !== currentUser.id &&
				currentUser.role !== "admin"
			) {
				return NextResponse.json(
					{ error: "Access denied" },
					{ status: 403 }
				);
			}

			const updatedNote = await prisma.note.update({
				where: { id: noteId },
				data: {
					title,
					content,
					tags,
					isPublic,
				},
				include: {
					author: {
						select: {
							id: true,
							email: true,
							name: true,
						},
					},
				},
			});

			return NextResponse.json({
				note: updatedNote,
				message: "Note updated successfully",
			});
		} catch (error) {
			console.error("Update note error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}

// DELETE /api/notes/[id] - Delete a specific note
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	return withAuth(request, async (request, currentUser) => {
		try {
			const { id: noteId } = await params;

			const existingNote = await prisma.note.findFirst({
				where: {
					id: noteId,
					tenantId: currentUser.organizationId,
				},
			});

			if (!existingNote) {
				return NextResponse.json(
					{ error: "Note not found" },
					{ status: 404 }
				);
			}

			// Users can only delete their own notes unless they're admin
			if (
				existingNote.authorId !== currentUser.id &&
				currentUser.role !== "admin"
			) {
				return NextResponse.json(
					{ error: "Access denied" },
					{ status: 403 }
				);
			}

			await prisma.note.delete({
				where: { id: noteId },
			});

			return NextResponse.json({
				message: "Note deleted successfully",
			});
		} catch (error) {
			console.error("Delete note error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}

// Enable CORS for cross-origin requests
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
