import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateEchoAppById } from '@/lib/echo-apps';
import { isValidUUID } from '@/lib/oauth-config/index';
import { PermissionService } from '@/lib/permissions/service';
import { Permission } from '@/lib/permissions/types';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// POST /api/apps/[id]/images - Upload profile picture or banner image
export async function POST(
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

    // Check if user has permission to edit this app
    const hasEditPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.EDIT_APP
    );

    if (!hasEditPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('type') as string; // 'profile' or 'banner'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!imageType || !['profile', 'banner'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "profile" or "banner"' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${appId}-${imageType}-${randomUUID()}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'apps');

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);

    // Ensure directory exists
    const fs = await import('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    await writeFile(filepath, buffer);

    // Create the public URL
    const imageUrl = `/uploads/apps/${filename}`;

    // Update the app with the new image URL
    const updateData: { profilePictureUrl?: string; bannerImageUrl?: string } =
      {};
    if (imageType === 'profile') {
      updateData.profilePictureUrl = imageUrl;
    } else {
      updateData.bannerImageUrl = imageUrl;
    }

    await updateEchoAppById(appId, user.id, updateData);

    return NextResponse.json({
      success: true,
      imageUrl,
      type: imageType,
    });
  } catch (error) {
    console.error('Error uploading image:', error);

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
        { error: 'App not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/apps/[id]/images - Remove profile picture or banner image
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

    // Check if user has permission to edit this app
    const hasEditPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.EDIT_APP
    );

    if (!hasEditPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get the image type from query parameters
    const url = new URL(request.url);
    const imageType = url.searchParams.get('type');

    if (!imageType || !['profile', 'banner'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "profile" or "banner"' },
        { status: 400 }
      );
    }

    // Update the app to remove the image URL
    const updateData: { profilePictureUrl?: string; bannerImageUrl?: string } =
      {};
    if (imageType === 'profile') {
      updateData.profilePictureUrl = undefined;
    } else {
      updateData.bannerImageUrl = undefined;
    }

    await updateEchoAppById(appId, user.id, updateData);

    return NextResponse.json({
      success: true,
      message: `${imageType} image removed successfully`,
    });
  } catch (error) {
    console.error('Error removing image:', error);

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
        { error: 'App not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
