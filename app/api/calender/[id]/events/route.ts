import { type NextRequest, NextResponse } from "next/server";

import { ERROR_MESSAGES, HTTP_STATUS, VALIDATION } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { generateColorFromName, parseError, verifyPIN } from "@/lib/utils";

async function verifyCalendarAccess(calendarId: string, request: NextRequest) {
  const normalizedCalendarId = calendarId.toUpperCase();

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authorized: false,
      error: ERROR_MESSAGES.AUTH.MISSING_TOKEN,
      status: HTTP_STATUS.UNAUTHORIZED,
    };
  }

  const pin = authHeader.substring(7);

  const calendar = await prisma.calendar.findUnique({
    where: { id: normalizedCalendarId },
  });

  if (!calendar) {
    return {
      authorized: false,
      error: ERROR_MESSAGES.CALENDAR.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    };
  }

  const isValid = await verifyPIN(pin, calendar.pinHash);
  if (!isValid) {
    return {
      authorized: false,
      error: ERROR_MESSAGES.AUTH.INVALID_PIN,
      status: HTTP_STATUS.UNAUTHORIZED,
    };
  }

  return { authorized: true, calendar };
}

// Create event
export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/calender/[id]/events">,
) {
  try {
    const { id } = await params;
    const normalizedId = id.toUpperCase();

    const access = await verifyCalendarAccess(normalizedId, request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const { title, start, end } = await request.json();

    if (!(title && start && end)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.EVENT.REQUIRED_FIELDS },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle.length < VALIDATION.EVENT_TITLE.MIN_LENGTH) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.EVENT.TITLE_TOO_SHORT },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    if (trimmedTitle.length > VALIDATION.EVENT_TITLE.MAX_LENGTH) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.EVENT.TITLE_TOO_LONG },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Validate date range
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.EVENT.INVALID_DATE_RANGE },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const color = generateColorFromName(trimmedTitle);

    const event = await prisma.event.create({
      data: {
        calendarId: normalizedId,
        title: trimmedTitle,
        start: startDate,
        end: endDate,
        color,
      },
    });

    return NextResponse.json(event, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    const errorMessage = parseError(error);
    console.error("Error creating event:", errorMessage);
    return NextResponse.json(
      { error: `${ERROR_MESSAGES.EVENT.CREATE_FAILED}: ${errorMessage}` },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

// Delete single event or smart delete
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/calender/[id]/events">,
) {
  try {
    const { id } = await params;
    const normalizedId = id.toUpperCase();

    const access = await verifyCalendarAccess(normalizedId, request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const body = await request.json();

    // Single event deletion
    await prisma.event.delete({
      where: {
        id: body.eventId,
        calendarId: normalizedId,
      },
    });

    return NextResponse.json(
      { success: true, deleted: 1 },
      { status: HTTP_STATUS.OK },
    );
  } catch (error) {
    const errorMessage = parseError(error);
    console.error("Failed to delete event:", errorMessage);
    return NextResponse.json(
      { error: `${ERROR_MESSAGES.EVENT.DELETE_FAILED}: ${errorMessage}` },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

// Get events
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/calender/[id]/events">,
) {
  try {
    const { id } = await params;
    const normalizedId = id.toUpperCase();

    const access = await verifyCalendarAccess(normalizedId, request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const events = await prisma.event.findMany({
      where: {
        calendarId: normalizedId,
      },
      orderBy: {
        start: "asc",
      },
    });

    return NextResponse.json(events, { status: HTTP_STATUS.OK });
  } catch (error) {
    const errorMessage = parseError(error);
    console.error("Error fetching events:", errorMessage);
    return NextResponse.json(
      { error: `${ERROR_MESSAGES.EVENT.FETCH_FAILED}: ${errorMessage}` },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
