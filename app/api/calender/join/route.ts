import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PATTERNS,
  SUCCESS_MESSAGES,
} from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { parseError, verifyPIN } from "@/lib/utils";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { id, pin } = await request.json();

    if (!(id && pin)) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.CALENDAR.ID_AND_PIN_REQUIRED,
        },
        {
          status: HTTP_STATUS.BAD_REQUEST,
        },
      );
    }

    const ValidPin = PATTERNS.PIN.test(pin);

    if (!ValidPin) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.PIN.INVALID_FORMAT,
        },
        {
          status: HTTP_STATUS.BAD_REQUEST,
        },
      );
    }

    const normalizedId = id.toUpperCase();
    if (!PATTERNS.CALENDAR_ID.test(normalizedId)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION.INVALID_REQUEST_DATA },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const calender = await prisma.calendar.findUnique({
      where: { id: normalizedId },
      include: {
        events: true,
      },
    });

    if (!calender) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.CALENDAR.NOT_FOUND,
        },
        {
          status: HTTP_STATUS.NOT_FOUND,
        },
      );
    }

    const isValidPin = await verifyPIN(pin, calender.pinHash);

    if (!isValidPin) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH.INVALID_PIN },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    return NextResponse.json(
      {
        id: calender.id,
        name: calender.name,
        event: calender.events,
        message: SUCCESS_MESSAGES.CALENDAR.JOINED,
      },
      {
        status: HTTP_STATUS.OK,
      },
    );
  } catch (error) {
    const errorMessage = parseError(error);
    console.error("Error joining calendar:", errorMessage);
    return NextResponse.json(
      {
        error: `${ERROR_MESSAGES.CALENDAR.JOIN_FAILED}: ${errorMessage}`,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
