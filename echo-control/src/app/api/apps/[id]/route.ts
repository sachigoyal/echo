import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getDetailedAppInfo,
  updateEchoAppById,
  deleteEchoAppById,
  AppUpdateInput,
  verifyArgs,
} from '@/lib/echo-apps';
import { isValidUUID } from '@/lib/oauth-config/index';

// GET /api/apps/[id] - Get detailed app information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  let appId;
  let resolvedParams;

  try {
    // Step 1: Get current user with detailed error handling
    try {
      user = await getCurrentUser();
      console.log('GET /api/apps/[id] - User authenticated:', {
        userId: user.id,
      });
    } catch (authError) {
      console.error('Authentication error in GET /api/apps/[id]:', {
        error:
          authError instanceof Error ? authError.message : 'Unknown auth error',
        stack: authError instanceof Error ? authError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Step 2: Parse parameters with error handling
    try {
      resolvedParams = await params;
      appId = resolvedParams.id;
      console.log('GET /api/apps/[id] - Processing request:', {
        appId,
        userId: user.id,
      });
    } catch (paramError) {
      console.error('Parameter parsing error in GET /api/apps/[id]:', {
        error:
          paramError instanceof Error
            ? paramError.message
            : 'Unknown param error',
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Step 3: Validate UUID format
    if (!isValidUUID(appId)) {
      console.error('Invalid UUID format in GET /api/apps/[id]:', {
        appId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Invalid app ID format' },
        { status: 400 }
      );
    }

    // Step 4: Parse query parameters
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    console.log('GET /api/apps/[id] - Query params:', {
      view,
      globalView: view === 'global',
    });

    // Step 5: Fetch app data with detailed error handling
    const appWithStats = await getDetailedAppInfo(
      appId,
      user.id,
      view === 'global'
    );

    if (!appWithStats) {
      console.error(
        'Failed to fetch app data - getDetailedAppInfo returned null:',
        {
          appId,
          userId: user.id,
        }
      );
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    console.log('GET /api/apps/[id] - Successfully fetched app data:', {
      appId,
      userId: user.id,
      userRole: appWithStats.userRole,
      appName: appWithStats.name,
    });

    return NextResponse.json(appWithStats);
  } catch (error) {
    // Catch-all for any other unexpected errors
    console.error('Unexpected error in GET /api/apps/[id]:', {
      appId: appId || 'unknown',
      userId: user?.id || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
      isActive,
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
      isActive,
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
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedApp = await updateEchoAppById(appId, user.id, updateData);

    return NextResponse.json({
      id: updatedApp.id,
      name: updatedApp.name,
      description: updatedApp.description,
      github_type: updatedApp.githubType,
      github_id: updatedApp.githubId,
      is_active: updatedApp.isActive,
      created_at: updatedApp.createdAt.toISOString(),
      updated_at: updatedApp.updatedAt.toISOString(),
      authorized_callback_urls: updatedApp.authorizedCallbackUrls,
      profile_picture_url: updatedApp.profilePictureUrl,
      banner_image_url: updatedApp.bannerImageUrl,
      homepage_url: updatedApp.homepageUrl,
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
