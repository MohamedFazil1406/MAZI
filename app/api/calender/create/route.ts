import {
  generateCalendarName,
  generateCalenderId,
  generatePIN,
  hashPINForDB,
  parseError,
} from "@/lib/utils";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "@/lib/constant";

export async function POST() {
  try {
    let calendarId = generateCalenderId().toUpperCase();
    const pin = generatePIN();
    const pinHash = await hashPINForDB(pin);

    // Check if ID already exists (unlikely but possible)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const existing = await prisma.calendar.findUnique({
        where: { id: calendarId },
      });

      if (!existing) {
        break;
      }

      // Generate a new ID and try again
      calendarId = generateCalenderId().toUpperCase();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Unable to generate unique calendar ID");
    }

    const calendar = await prisma.calendar.create({
      data: {
        id: calendarId,
        name: generateCalendarName(),
        pinHash,
      },
    });
    return NextResponse.json(
      {
        id: calendar.id,
        name: calendar.name,
        pin, // Send plain PIN only on creation
        message: SUCCESS_MESSAGES.CALENDAR.CREATED,
      },
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error) {
    const errorMessage = parseError(error);
    console.error("Error creating calendar:", errorMessage);
    return NextResponse.json(
      { error: `${ERROR_MESSAGES.CALENDAR.CREATE_FAILED}: ${errorMessage}` },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
