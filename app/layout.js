import './globals.css';

export const metadata = {
    title: 'Event Booking System',
    description: 'Event Booking and Ticketing System',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}