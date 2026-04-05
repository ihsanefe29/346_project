//Whole script generated via ChatGPT

const { PrismaClient } = require("./generated");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    // delete in dependency order
    await prisma.booking.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("123456", 10);

    // Users
    const organizer1 = await prisma.user.create({
        data: {
            username: "organizer1",
            email: "organizer1@test.com",
            password: hashedPassword,
            name: "Organizer One",
            role: "ORGANIZER",
        },
    });

    const organizer2 = await prisma.user.create({
        data: {
            username: "organizer2",
            email: "organizer2@test.com",
            password: hashedPassword,
            name: "Organizer Two",
            role: "ORGANIZER",
        },
    });

    const attendee1 = await prisma.user.create({
        data: {
            username: "attendee1",
            email: "attendee1@test.com",
            password: hashedPassword,
            name: "Attendee One",
            role: "ATTENDEE",
        },
    });

    const attendee2 = await prisma.user.create({
        data: {
            username: "attendee2",
            email: "attendee2@test.com",
            password: hashedPassword,
            name: "Attendee Two",
            role: "ATTENDEE",
        },
    });

    const attendee3 = await prisma.user.create({
        data: {
            username: "attendee3",
            email: "attendee3@test.com",
            password: hashedPassword,
            name: "Attendee Three",
            role: "ATTENDEE",
        },
    });

    const attendee4 = await prisma.user.create({
        data: {
            username: "attendee4",
            email: "attendee4@test.com",
            password: hashedPassword,
            name: "Attendee Four",
            role: "ATTENDEE",
        },
    });

    // Events
    const event1 = await prisma.event.create({
        data: {
            title: "Spring Music Festival",
            description: "Open-air campus music event.",
            dateTime: new Date("2026-04-20T18:00:00.000Z"),
            capacity: 3,
            organizerId: organizer1.id,
        },
    });

    const event2 = await prisma.event.create({
        data: {
            title: "Tech Career Talk",
            description: "Industry professionals share career advice.",
            dateTime: new Date("2026-04-25T14:00:00.000Z"),
            capacity: 2,
            organizerId: organizer1.id,
        },
    });

    const event3 = await prisma.event.create({
        data: {
            title: "Startup Networking Night",
            description: "Meet founders, investors, and students.",
            dateTime: new Date("2026-05-02T17:30:00.000Z"),
            capacity: 4,
            organizerId: organizer2.id,
        },
    });

    const event4 = await prisma.event.create({
        data: {
            title: "Empty Test Event",
            description: "No one has booked this yet.",
            dateTime: new Date("2026-05-10T10:00:00.000Z"),
            capacity: 5,
            organizerId: organizer2.id,
        },
    });

    // Bookings
    await prisma.booking.create({
        data: {
            userId: attendee1.id,
            eventId: event1.id,
        },
    });

    await prisma.booking.create({
        data: {
            userId: attendee2.id,
            eventId: event1.id,
        },
    });

    await prisma.booking.create({
        data: {
            userId: attendee3.id,
            eventId: event1.id,
        },
    });

    await prisma.booking.create({
        data: {
            userId: attendee1.id,
            eventId: event2.id,
        },
    });

    await prisma.booking.create({
        data: {
            userId: attendee2.id,
            eventId: event3.id,
        },
    });

    await prisma.booking.create({
        data: {
            userId: attendee3.id,
            eventId: event3.id,
        },
    });

    await prisma.booking.create({
        data: {
            userId: attendee4.id,
            eventId: event3.id,
        },
    });

    console.log("Seed completed successfully.");
    console.log("Users created:");
    console.log("ORGANIZER -> organizer1 / 123456");
    console.log("ORGANIZER -> organizer2 / 123456");
    console.log("ATTENDEE  -> attendee1 / 123456");
    console.log("ATTENDEE  -> attendee2 / 123456");
    console.log("ATTENDEE  -> attendee3 / 123456");
    console.log("ATTENDEE  -> attendee4 / 123456");
    console.log("Events created:");
    console.log(`- ${event1.title} (full: 3/3)`);
    console.log(`- ${event2.title} (1/2)`);
    console.log(`- ${event3.title} (3/4)`);
    console.log(`- ${event4.title} (0/5)`);
}

main()
    .catch((e) => {
        console.error("Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });