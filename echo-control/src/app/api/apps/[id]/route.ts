import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  updateEchoAppById,
  deleteEchoAppById,
  verifyArgs,
} from '@/lib/apps/crud';
import { isValidUUID } from '@/lib/oauth-config/index';
import { AppUpdateInput, getApp } from '@/lib/apps';

// GET /api/apps/[id] - Get detailed app information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get current user
  const user = await getCurrentUser();
  const resolvedParams = await params;
  const { id: appId } = resolvedParams;

  // Validate UUID format
  if (!isValidUUID(appId)) {
    return NextResponse.json(
      { error: 'Invalid app ID format' },
      { status: 400 }
    );
  }
  const appData = await getApp(appId, user.id);

  return NextResponse.json(appData);
}

// PUT /api/apps/[id] - Update an existing Echo app
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const resolvedParams = await params;
    const appId = resolvedParams.id;

    // Extract allowed update fields
    const {
      name,
      description,
      githubType,
      githubId,
      authorizedCallbackUrls,
      profilePictureUrl,
      bannerImageUrl,
      homepageUrl,
      isPublic,
    } = body;

    // Validate input fields
    const validationError = verifyArgs({
      name,
      description,
      githubType,
      githubId,
      authorizedCallbackUrls,
      profilePictureUrl,
      bannerImageUrl,
      homepageUrl,
      isPublic,
    });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updateData: AppUpdateInput = {};

    // Only include provided fields in the update
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (githubType !== undefined) updateData.githubType = githubType;
    if (githubId !== undefined) updateData.githubId = githubId;
    if (authorizedCallbackUrls !== undefined)
      updateData.authorizedCallbackUrls = authorizedCallbackUrls;
    if (profilePictureUrl !== undefined)
      updateData.profilePictureUrl = profilePictureUrl;
    if (bannerImageUrl !== undefined)
      updateData.bannerImageUrl = bannerImageUrl;
    if (homepageUrl !== undefined) updateData.homepageUrl = homepageUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedApp = await updateEchoAppById(appId, user.id, updateData);

    if (!updatedApp) {
      return NextResponse.json(
        { error: 'Echo app not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updatedApp.id,
      name: updatedApp.name,
      description: updatedApp.description,
      githubType: updatedApp.githubLink?.githubType,
      githubId: updatedApp.githubLink?.githubId,
      createdAt: updatedApp.createdAt.toISOString(),
      updatedAt: updatedApp.updatedAt.toISOString(),
      authorizedCallbackUrls: updatedApp.authorizedCallbackUrls,
      profilePictureUrl: updatedApp.profilePictureUrl,
      bannerImageUrl: updatedApp.bannerImageUrl,
      homepageUrl: updatedApp.homepageUrl,
      isPublic: updatedApp.isPublic,
    });
  } catch (error) {
    console.error('Error updating Echo app:', error);

    // Handle validation errors
    if (
      error instanceof Error &&
      (error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('characters') ||
        error.message.includes('not found') ||
        error.message.includes('access denied'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/apps/[id] - Archive an echo app (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const resolvedParams = await params;
    const { id: appId } = resolvedParams;

    // Validate UUID format
    if (!isValidUUID(appId)) {
      return NextResponse.json(
        { error: 'Invalid app ID format' },
        { status: 400 }
      );
    }

    const result = await deleteEchoAppById(appId, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error archiving echo app:', error);

    if (
      error instanceof Error &&
      (error.message === 'Not authenticated' ||
        error.message.includes('Invalid'))
    ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes('not found or access denied')
    ) {
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
