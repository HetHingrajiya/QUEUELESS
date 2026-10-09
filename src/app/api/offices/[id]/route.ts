import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const query: any = { _id: id };
    
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
       query.organizationId = user.organizationId;
    } else if (user.role === 'CITIZEN') {
       // Maybe citizens can view office details, let's allow it but not restricted
       // by org since citizens don't have an org.
    }
    
        const office = await Office.findOne(query).lean();
    
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    const { User } = await import('@/models/User');
    const assignedStaff = await User.find({ officeId: office._id, role: 'STAFF' }, '_id').lean();
    const staffIds = assignedStaff.map((s: any) => s._id.toString());

    return NextResponse.json({
      success: true,
      data: { ...office, staffIds }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role === 'CITIZEN' || currentUser.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (currentUser.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageOffices = await hasPermission(currentUser.userId, 'MANAGE_OFFICES');
      if (!canManageOffices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_OFFICES permission' }, { status: 403 });
      }
    }

    const body = await req.json();
    
    const query: any = { _id: id };
    if (currentUser.role === 'ADMIN') {
       query.organizationId = currentUser.organizationId;
    }

    const oldOffice = await Office.findOne(query);
    if (!oldOffice) {
      return NextResponse.json({ success: false, message: 'Office not found or unauthorized' }, { status: 404 });
    }

    // Prevent mass assignment
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.pincode !== undefined) updateData.pincode = body.pincode;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.status !== undefined) updateData.status = body.status;
    
    if (body.latitude !== undefined) {
      if (body.latitude === null || body.latitude === '') {
        updateData.latitude = null;
      } else {
        const lat = Number(body.latitude);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          return NextResponse.json({ success: false, message: 'Invalid latitude' }, { status: 400 });
        }
        updateData.latitude = lat;
      }
    }
    
    if (body.longitude !== undefined) {
      if (body.longitude === null || body.longitude === '') {
        updateData.longitude = null;
      } else {
        const lon = Number(body.longitude);
        if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
          return NextResponse.json({ success: false, message: 'Invalid longitude' }, { status: 400 });
        }
        updateData.longitude = lon;
      }
    }
    if (currentUser.role === 'SUPER_ADMIN' && body.organizationId) {
       updateData.organizationId = body.organizationId;
    }

        const updatedOffice = await Office.findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    if (body.staffIds && Array.isArray(body.staffIds)) {
      const { User } = await import('@/models/User');
      // Unassign those no longer selected
      await User.updateMany(
        { officeId: updatedOffice._id, role: 'STAFF', _id: { $nin: body.staffIds } },
        { $unset: { officeId: 1, counterId: 1 } }
      );
      // Assign new ones
      if (body.staffIds.length > 0) {
        await User.updateMany(
          { _id: { $in: body.staffIds }, role: 'STAFF' },
          { $set: { officeId: updatedOffice._id } }
        );
      }
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Offices',
      description: `Updated office: ${updatedOffice.name}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Office',
      entityId: id,
      oldData: oldOffice.toObject(),
      newData: updatedOffice.toObject(),
      organizationId: oldOffice.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Office updated successfully',
      data: updatedOffice
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role === 'CITIZEN' || currentUser.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (currentUser.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageOffices = await hasPermission(currentUser.userId, 'MANAGE_OFFICES');
      if (!canManageOffices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_OFFICES permission' }, { status: 403 });
      }
    }

    const query: any = { _id: id };
    if (currentUser.role === 'ADMIN') {
       query.organizationId = currentUser.organizationId;
    }

    const oldOffice = await Office.findOne(query);
    if (!oldOffice) {
      return NextResponse.json({ success: false, message: 'Office not found or unauthorized' }, { status: 404 });
    }

    const deletedOffice = await Office.findOneAndDelete(query);

    if (!deletedOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Offices',
      description: `Deleted office: ${oldOffice.name}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Office',
      entityId: id,
      oldData: oldOffice.toObject(),
      organizationId: oldOffice.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Office deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
